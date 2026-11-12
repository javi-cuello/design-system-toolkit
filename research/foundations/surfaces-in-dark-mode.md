# Surfaces in dark mode

How the surface levels of a design system behave once the lights go out: which way they climb, what a floating menu does, and how a region, a brand colour or a whole subtree keeps a tone of its own without breaking the rest.

A team ships dark mode by giving every surface token a dark value. The page works. Then a dropdown opens inside a dialog and nobody can see where it ends. The marketing hero, hard-coded to near-black with white text, sits on a page that is now near-black too, and its links have turned a dark blue that is hard to read. A brand banner that was a pale lilac in light mode is a muddy purple in dark, and the product team asks for it to "stay the same".

---

## What this answers

- [Which way levels go](#which-way-levels-go): whether a higher surface is lighter or darker, in each mode
- [Tint overlays to containers](#tint-overlays-to-containers): why Material stopped computing surface colour from elevation
- [Base and elevated](#base-and-elevated): how Apple makes a level a property of the context, not of the token
- [How many dark themes](#how-many-dark-themes): whether one dark theme is enough, and what a dimmed one costs
- [Floating surfaces in dark](#floating-surfaces-in-dark): whether a menu should be lighter or darker than what it opens over
- [Always-dark regions](#always-dark-regions): media, code and heroes that keep one scheme in both modes
- [Brand and fixed surfaces](#brand-and-fixed-surfaces): colours that must not change between modes
- [Scoped theme overrides](#scoped-theme-overrides): how a frame, a subtree or a view takes another theme, and how that breaks
- [Images in dark](#images-in-dark): photos, logos and illustrations on dark surfaces
- [Contrast settings](#contrast-settings): what Increase Contrast and forced colours do to the ladder
- [Testing dark surfaces](#testing-dark-surfaces): what to check, and where
- [Evidence and lineage](#evidence-and-lineage): how strong the evidence is, and how independent

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole piece in a few paragraphs. The basics are not repeated here: the toolkit's knowledge base already holds the dark step size (about 0.03 to 0.04 OKLCH lightness), deriving levels from the neutral ramp, the case against a pure black page, keeping shadows in dark but darker, a border on every overlay, and a scrim that darkens (`~/Projects/toolkit/knowledge/ui/design/visual.md`, section *Surfaces and elevation levels*). Which surface sits on which is in [how surfaces stack](how-surfaces-stack.md), shadows in [elevation and shadows](elevation-and-shadows.md), and blur and translucency in [materials and translucency](materials-and-translucency.md).

---

## Which way levels go

In dark mode every system read makes a surface further forward lighter; in light mode they disagree, so a dark ladder can't be produced by inverting a light one.

Take a card on a page with a text field inside it. In dark mode the answer is settled: page darkest, card lighter, a menu over the card lighter still. In light mode there is no agreement on what "higher" looks like, and a team that writes its dark tokens by flipping the light ones inherits whichever light convention it started from.

Here are two systems' ladders in both modes, base at the bottom.

<svg role="img" viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Four surface ladders, base at the bottom. Material 3 light containers, from lowest #FFFFFF up through #F7F2FA, #F3EDF7, #ECE6F0 to highest #E6E0E9, get darker as they rise. Material 3 dark containers, from lowest #0F0D13 up through #1D1B20, #211F26, #2B2930 to highest #36343B, get lighter as they rise. Carbon's White theme alternates: background #FFFFFF, layer-01 #F4F4F4, layer-02 #FFFFFF, layer-03 #F4F4F4. Carbon's Gray 100 theme climbs in large steps: background #161616, layer-01 #262626, layer-02 #393939, layer-03 #525252. Values from Material Web's baseline tokens and Carbon's themes package.</title>
<rect x="0" y="0" width="720" height="340" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Material 3, light</text>
<text x="200" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Material 3, dark</text>
<text x="376" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Carbon, White</text>
<text x="552" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Carbon, Gray 100</text>
<rect x="24" y="48" width="150" height="44" rx="4" fill="#e6e0e9" stroke="#c9c6bd"/>
<text x="34" y="75" font-size="12" fill="#1a1a1a">highest #E6E0E9</text>
<rect x="24" y="96" width="150" height="44" rx="4" fill="#ece6f0" stroke="#c9c6bd"/>
<text x="34" y="123" font-size="12" fill="#1a1a1a">high #ECE6F0</text>
<rect x="24" y="144" width="150" height="44" rx="4" fill="#f3edf7" stroke="#c9c6bd"/>
<text x="34" y="171" font-size="12" fill="#1a1a1a">container #F3EDF7</text>
<rect x="24" y="192" width="150" height="44" rx="4" fill="#f7f2fa" stroke="#c9c6bd"/>
<text x="34" y="219" font-size="12" fill="#1a1a1a">low #F7F2FA</text>
<rect x="24" y="240" width="150" height="44" rx="4" fill="#ffffff" stroke="#c9c6bd"/>
<text x="34" y="267" font-size="12" fill="#1a1a1a">lowest #FFFFFF</text>
<rect x="200" y="48" width="150" height="44" rx="4" fill="#36343b"/>
<text x="210" y="75" font-size="12" fill="#e6e0e9">highest #36343B</text>
<rect x="200" y="96" width="150" height="44" rx="4" fill="#2b2930"/>
<text x="210" y="123" font-size="12" fill="#e6e0e9">high #2B2930</text>
<rect x="200" y="144" width="150" height="44" rx="4" fill="#211f26"/>
<text x="210" y="171" font-size="12" fill="#e6e0e9">container #211F26</text>
<rect x="200" y="192" width="150" height="44" rx="4" fill="#1d1b20"/>
<text x="210" y="219" font-size="12" fill="#e6e0e9">low #1D1B20</text>
<rect x="200" y="240" width="150" height="44" rx="4" fill="#0f0d13"/>
<text x="210" y="267" font-size="12" fill="#e6e0e9">lowest #0F0D13</text>
<rect x="376" y="96" width="150" height="44" rx="4" fill="#f4f4f4" stroke="#c9c6bd"/>
<text x="386" y="123" font-size="12" fill="#1a1a1a">layer-03 #F4F4F4</text>
<rect x="376" y="144" width="150" height="44" rx="4" fill="#ffffff" stroke="#c9c6bd"/>
<text x="386" y="171" font-size="12" fill="#1a1a1a">layer-02 #FFFFFF</text>
<rect x="376" y="192" width="150" height="44" rx="4" fill="#f4f4f4" stroke="#c9c6bd"/>
<text x="386" y="219" font-size="12" fill="#1a1a1a">layer-01 #F4F4F4</text>
<rect x="376" y="240" width="150" height="44" rx="4" fill="#ffffff" stroke="#c9c6bd"/>
<text x="386" y="267" font-size="12" fill="#1a1a1a">background #FFFFFF</text>
<rect x="552" y="96" width="150" height="44" rx="4" fill="#525252"/>
<text x="562" y="123" font-size="12" fill="#f4f4f4">layer-03 #525252</text>
<rect x="552" y="144" width="150" height="44" rx="4" fill="#393939"/>
<text x="562" y="171" font-size="12" fill="#f4f4f4">layer-02 #393939</text>
<rect x="552" y="192" width="150" height="44" rx="4" fill="#262626"/>
<text x="562" y="219" font-size="12" fill="#f4f4f4">layer-01 #262626</text>
<rect x="552" y="240" width="150" height="44" rx="4" fill="#161616"/>
<text x="562" y="267" font-size="12" fill="#f4f4f4">background #161616</text>
<text x="24" y="312" font-size="12" fill="#5a5850">darker going up</text>
<text x="200" y="312" font-size="12" fill="#5a5850">lighter going up</text>
<text x="376" y="312" font-size="12" fill="#5a5850">alternates</text>
<text x="552" y="312" font-size="12" fill="#5a5850">lighter going up, big steps</text>
</svg>

Both dark columns climb. The light columns go two different ways: Material's light containers darken as they rise, and Carbon's White theme swaps between white and grey at each layer.

The mechanism differs because the two systems mean different things by a level. Material's container roles measure distance from the page's extreme: in light, further from white; in dark, further from black. "High" means more separated, not nearer the viewer. Carbon's layers are nesting contexts. Each layer only has to differ from the one directly beneath it, and in light mode the only room left is between white and one grey, so it alternates.

Carbon's dark steps are also much larger than the toolkit's 0.03. Gray 100 climbs from OKLCH L 0.20 to 0.27, 0.35 and 0.44, about 0.08 per layer, because each layer has to hold fields and borders of its own. Carbon pairs them by number: a field on `layer-01` takes `field-02`, so the field is always one layer up from its container. In White that gives `#FFFFFF` on `#F4F4F4`; in Gray 100, `#393939` on `#262626`. The relationship holds in both directions because it is written as a position, not as "lighter".

Take an illustrative inversion to see the cost. A team's light tokens follow Carbon's White theme, and someone writes dark values by mapping each light grey to the matching dark grey of the ramp. `background` and `layer-02` share `#FFFFFF` in light, so they get the same dark value too, and a card at `layer-02` on a `background` page disappears in dark mode.

**Write the order of levels per mode as a position (one up from its container), and design the dark ladder on its own, ascending.** Every system read agrees on ascending in dark, so that part is consensus. Whether light mode darkens, alternates or stays white (Atlassian, shadcn) is a free choice; the only error is deriving one mode from the other.

---

## Tint overlays to containers

Material stopped computing a surface's colour from its elevation and replaced it with a fixed set of named container roles, because a computed tint couldn't be themed, inspected or kept in order.

In Material 2's dark theme, and in Material 3 until 2023, the surface colour was arithmetic. A component declared an elevation in dp, and the renderer laid a translucent colour over the base surface: white in Material 2, the primary tint in Material 3. Compose still ships the formula as `surfaceColorAtElevation`: the overlay's alpha is (4.5 × ln(dp + 1) + 2) / 100 of `surfaceTint` over `surface`.

Run that formula on Material 3's baseline dark scheme (`surfaceTint` `#D0BCFF` over `surface` `#141218`) and set the results beside the containers that replaced them.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two rows on Material 3's dark surface #141218. Top row, the tint overlay model: surfaceTint #D0BCFF laid over the surface at elevations 1, 3, 6, 8 and 12 dp gives alphas of 5.1, 8.2, 10.8, 11.9 and 13.5 percent and the colours #1E1B24, #23202B, #282431, #2A2633 and #2D2937, purple-tinged and close together at the top. Bottom row, the tonal container roles: lowest #0F0D13, low #1D1B20, container #211F26, high #2B2930, highest #36343B, neutral tones 4, 10, 12, 17 and 22. Tint values computed with Compose's surfaceColorAtElevation formula; container values from Material Web's baseline tokens.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<rect x="16" y="16" width="688" height="268" rx="8" fill="#141218"/>
<text x="36" y="46" font-size="14" font-weight="600" fill="#e6e0e9">Before: tint overlay, computed per elevation</text>
<rect x="36" y="60" width="120" height="56" rx="6" fill="#1e1b24"/>
<rect x="168" y="60" width="120" height="56" rx="6" fill="#23202b"/>
<rect x="300" y="60" width="120" height="56" rx="6" fill="#282431"/>
<rect x="432" y="60" width="120" height="56" rx="6" fill="#2a2633"/>
<rect x="564" y="60" width="120" height="56" rx="6" fill="#2d2937"/>
<text x="46" y="134" font-size="12" fill="#cac4d0">1 dp, 5.1%</text>
<text x="178" y="134" font-size="12" fill="#cac4d0">3 dp, 8.2%</text>
<text x="310" y="134" font-size="12" fill="#cac4d0">6 dp, 10.8%</text>
<text x="442" y="134" font-size="12" fill="#cac4d0">8 dp, 11.9%</text>
<text x="574" y="134" font-size="12" fill="#cac4d0">12 dp, 13.5%</text>
<text x="36" y="170" font-size="14" font-weight="600" fill="#e6e0e9">After: named containers, one tone each</text>
<rect x="36" y="184" width="120" height="56" rx="6" fill="#0f0d13" stroke="#49454f"/>
<rect x="168" y="184" width="120" height="56" rx="6" fill="#1d1b20"/>
<rect x="300" y="184" width="120" height="56" rx="6" fill="#211f26"/>
<rect x="432" y="184" width="120" height="56" rx="6" fill="#2b2930"/>
<rect x="564" y="184" width="120" height="56" rx="6" fill="#36343b"/>
<text x="46" y="258" font-size="12" fill="#cac4d0">lowest, tone 4</text>
<text x="178" y="258" font-size="12" fill="#cac4d0">low, tone 10</text>
<text x="310" y="258" font-size="12" fill="#cac4d0">container, 12</text>
<text x="442" y="258" font-size="12" fill="#cac4d0">high, tone 17</text>
<text x="574" y="258" font-size="12" fill="#cac4d0">highest, 22</text>
</svg>

The tinted row bunches up: the logarithm flattens it, so 8 dp and 12 dp differ by under two percent. The container row is neutral, evenly stepped, and includes a level below the page (`surfaceContainerLowest`), which an overlay can never produce, since laying something on top only lightens.

The migration is documented on both of Google's toolkits. Compose Material 3 added the `SurfaceContainer` roles in 1.2.0-alpha03, with a `LocalTonalElevationEnabled` switch to turn the overlay off. The release notes then move component after component: `Menu` to `SurfaceContainer` with `MenuDefaults.TonalElevation` at 0.dp, `AlertDialog` to `SurfaceContainerHigh`, `TextField` to `SurfaceContainerHighest`. Flutter 3.22 made the same move in one release: seven new roles (`surfaceBright`, `surfaceDim` and five containers), `background`, `onBackground` and `surfaceVariant` deprecated, and `surfaceTintColor` defaulting to null on every widget.

There is a catch in the new model. A container role is assigned per component, not per position in the stack, so it doesn't know what it is drawn over. Before reading on, work out what a menu opened from a field inside a dialog looks like in Material 3's dark scheme.

The menu is `surfaceContainer`, `#211F26` (L 0.245). The dialog is `surfaceContainerHigh`, `#2B2930` (L 0.286). The menu is darker than the dialog it opens over, by a contrast of 1.13:1, and only its shadow separates it. Under the old overlay model the order at least followed the declared elevation numbers; under containers, the order follows whatever the component table says.

> **Aside.** Compose's documentation page on Material 3 still describes elevation as "mainly" tonal overlays from the primary colour, while its release notes describe the move away. The release notes and the components' current defaults are the reliable record.

**If you adopt container roles, check every pair of a floating component and the surface it can open over, and give the floating one a border where the container order runs the wrong way.** Named containers are better than computed tint: they can be themed, read in a design file, and placed below the page. That part is consensus across Material's own toolkits. The stacking check is the cost of the change, and it is judgement that it belongs in your test plan rather than in the role table.

---

## Base and elevated

Apple keeps one set of background tokens and makes elevation a property of the context: the same `systemBackground` resolves to black at the base level and to `#1C1C1E` when the view is presented forward.

Picture a grouped settings list in iOS dark mode. The screen behind is black, and the cells are `#1C1C1E`. Then a sheet slides up with another grouped list in it. If the sheet used the same values, its black background would merge with the black page behind, and the only edge would be the sheet's rounded top.

Apple's answer is in the trait system. `UITraitCollection` carries a `userInterfaceLevel` of `.base` or `.elevated`, and the system assigns `.elevated` to alerts, popovers and sheets. Every dynamic background colour has a value for each level. The Human Interface Guidelines describe the base set as dimmer so background interfaces recede, and the elevated set as brighter.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two iPhone-shaped frames in dark mode. Left, base level: a black #000000 background with grouped cells in #1C1C1E. Right, the same screen with a sheet presented: the screen behind is dimmed, and the sheet takes the elevated set, so its background is #1C1C1E and its cells #2C2C2E. Every value moved one step lighter while the relationship between background and cell stayed the same. Values from Apple's system colour tables.</title>
<rect x="0" y="0" width="720" height="320" fill="#f7f6f2"/>
<text x="60" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Base level</text>
<rect x="60" y="44" width="200" height="236" rx="24" fill="#000000"/>
<rect x="80" y="80" width="160" height="36" rx="8" fill="#1c1c1e"/>
<rect x="80" y="122" width="160" height="36" rx="8" fill="#1c1c1e"/>
<rect x="80" y="180" width="160" height="36" rx="8" fill="#1c1c1e"/>
<text x="92" y="103" font-size="12" fill="#ebebf5">Cell #1C1C1E</text>
<text x="92" y="262" font-size="12" fill="#8e8e93">Background #000000</text>
<text x="400" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Sheet presented: elevated level</text>
<rect x="400" y="44" width="200" height="236" rx="24" fill="#000000"/>
<rect x="420" y="80" width="160" height="36" rx="8" fill="#1c1c1e" opacity="0.5"/>
<rect x="400" y="44" width="200" height="236" rx="24" fill="#000000" opacity="0.35"/>
<rect x="400" y="104" width="200" height="176" rx="18" fill="#1c1c1e"/>
<rect x="420" y="136" width="160" height="36" rx="8" fill="#2c2c2e"/>
<rect x="420" y="178" width="160" height="36" rx="8" fill="#2c2c2e"/>
<text x="432" y="159" font-size="12" fill="#ebebf5">Cell #2C2C2E</text>
<text x="420" y="262" font-size="12" fill="#8e8e93">Sheet #1C1C1E</text>
<text x="60" y="306" font-size="12" fill="#5a5850">Same tokens, base values</text>
<text x="400" y="306" font-size="12" fill="#5a5850">Same tokens, elevated values, one step up</text>
</svg>

The sheet's code didn't change a single colour name. The presentation flipped the level, and every background and cell token inside moved one step up together.

In light mode the base and elevated sets are identical, so a designer who works only in light never sees the trait. It matters only when one dark interface is layered over another, which also covers multitasking: the HIG notes the elevated set separates apps side by side and windows on an external display.

The web has no built-in level, but the same shape is a few lines of CSS: a scope attribute that redefines the surface custom properties one step up, so nested content follows without knowing where it is. Atlassian ships the read side of the idea as a token: `utility.elevation.surface.current` is described as the surface colour "set by a parent element", defaulting to `elevation.surface`, so a child such as a sticky header or a fade-out gradient matches whatever it sits on.

> **Aside.** iOS is also the exception to the toolkit's rule against a pure black page: base `systemBackground` in dark is `#000000`. That works there because no level ever needs to sink below the page; anything that comes forward switches to the elevated set.

**Model "elevated" as a scope that remaps the same surface tokens, rather than as a second set of tokens a component has to choose.** In CSS: `[data-level="elevated"] { --surface-page: var(--surface-raised-value); ... }` on the dialog root. That is judgement, borrowed from Apple; the evidence that it works is Apple's own platform, under the constraint that every component reads semantic tokens and none hard-codes a value.

---

## How many dark themes

Most systems ship one dark theme plus contrast variants; GitHub's Primer ships a dimmed dark as well, and Carbon offers two darks that differ only in where the ladder starts.

A team gets a request: the dark theme is too harsh, can there be a softer one? It looks like a palette job. It is a second ladder, a second set of overlays and a second column in every contrast check.

Primer's package lists fourteen functional themes, eight of them dark: `dark`, `dark-dimmed`, `dark-high-contrast`, `dark-colorblind`, `dark-tritanopia`, and high-contrast versions of the dimmed, colourblind and tritanopia themes. GitHub stores the choice as a pair: `data-color-mode` (`light`, `dark` or `auto`) plus a `data-light-theme` and a `data-dark-theme`. A person picks one theme for each mode, and `auto` follows the operating system between them.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three Primer dark themes side by side, each showing a page, an inset well and a floating menu with a one-pixel ring. Dark: page #0D1117, inset #010409, menu #010409 with ring #3D444D. Dark dimmed: page #212830, inset #151B23, menu #2A313C with ring #3D444D, the menu lighter than the page. Dark high contrast: page #010409, inset #010409, menu #010409 with a bright ring #B7BDC8. Values from @primer/primitives 11.10.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">dark</text>
<text x="264" y="30" font-size="14" font-weight="600" fill="#1a1a1a">dark-dimmed</text>
<text x="504" y="30" font-size="14" font-weight="600" fill="#1a1a1a">dark-high-contrast</text>
<rect x="24" y="44" width="200" height="210" rx="8" fill="#0d1117"/>
<rect x="40" y="60" width="168" height="40" rx="6" fill="#010409"/>
<text x="50" y="84" font-size="12" fill="#9198a1">inset #010409</text>
<rect x="64" y="120" width="144" height="110" rx="10" fill="#010409" stroke="#3d444d"/>
<text x="76" y="146" font-size="12" fill="#f0f6fc">Menu #010409</text>
<text x="76" y="166" font-size="12" fill="#9198a1">ring #3D444D</text>
<text x="40" y="246" font-size="12" fill="#9198a1">page #0D1117</text>
<rect x="264" y="44" width="200" height="210" rx="8" fill="#212830"/>
<rect x="280" y="60" width="168" height="40" rx="6" fill="#151b23"/>
<text x="290" y="84" font-size="12" fill="#9198a1">inset #151B23</text>
<rect x="304" y="120" width="144" height="110" rx="10" fill="#2a313c" stroke="#3d444d"/>
<text x="316" y="146" font-size="12" fill="#d1d7e0">Menu #2A313C</text>
<text x="316" y="166" font-size="12" fill="#9198a1">ring #3D444D</text>
<text x="280" y="246" font-size="12" fill="#9198a1">page #212830</text>
<rect x="504" y="44" width="200" height="210" rx="8" fill="#010409"/>
<rect x="520" y="60" width="168" height="40" rx="6" fill="#010409" stroke="#b7bdc8" stroke-dasharray="3 3"/>
<text x="530" y="84" font-size="12" fill="#b7bdc8">inset #010409</text>
<rect x="544" y="120" width="144" height="110" rx="10" fill="#010409" stroke="#b7bdc8"/>
<text x="556" y="146" font-size="12" fill="#ffffff">Menu #010409</text>
<text x="556" y="166" font-size="12" fill="#b7bdc8">ring #B7BDC8</text>
<text x="520" y="246" font-size="12" fill="#b7bdc8">page #010409</text>
<text x="24" y="284" font-size="12" fill="#5a5850">menu darker than page</text>
<text x="264" y="284" font-size="12" fill="#5a5850">menu lighter than page</text>
<text x="504" y="284" font-size="12" fill="#5a5850">menu same as page, edge only</text>
</svg>

Three dark themes from one system, and the menu sits in three different places on the ladder: below the page, above it, and level with it. Only the ring is constant.

That is the hidden cost of a second dark theme. Dimmed starts higher (page L 0.27 against dark's 0.18), which leaves room above for a lighter menu but less room below for wells. Each theme ends up with its own answer to where overlays go, and each answer needs its own checks.

Carbon makes the smaller version of the same choice. Gray 90 and Gray 100 share one ladder shifted by a step: Gray 100 runs `#161616`, `#262626`, `#393939`, `#525252`, and Gray 90 starts at `#262626` and ends at `#6F6F6F`. Carbon's colour guidance asks a product for one light theme and one dark, so the second dark is a product decision, not a user setting.

Outside the Western cluster, Ant Design's dark algorithm takes the opposite position on how dark to start. Its `colorBgBase` defaults to `#000`, the layout background is that base unchanged, containers are the base lightened by 8 (`#141414`) and elevated surfaces by 12 (`#1F1F1F`). The page is pure black, like iOS, and elevation is all upward.

**Ship one dark theme, built as a mode of the same token collection, unless your users have asked for a second; if you add a dimmed one, give it its own overlay decision and its own contrast run.** One dark theme is the consensus. A dimmed variant is evidence from one system, GitHub, with a very large and vocal audience; the constraint it depends on is the budget to test every theme.

---

## Floating surfaces in dark

A menu or popover in dark mode can be lighter or darker than what it opens over; what decides is whether anything has to be layered inside it, and either way its edge, a ring or border, does the separating.

Back to the dropdown inside the dialog. The toolkit's rule says an overlay is two steps above the page. That rule assumes the overlay is a flat list. A menu with a selected row, a hovered row and a search field inside it is itself a small page, and those need room on the ladder too.

Primer hit exactly this and reversed itself. Until mid 2025 its dark `overlay-bgColor` was `#151b23`, the muted background, lighter than the page. In June 2025 a pull request changed it to `#010409`, darker than the page, in every dark theme except dimmed. The author wrote that the team relied on the lighter shade for dimension "where shadows aren't very useful", but was "lacking the ability to layer inside overlays" with muted as the background. A selected row in a menu uses muted, and muted on muted is invisible.

Here are the three answers shipping systems give, each on its own system's page.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three dark panels, each with a menu over a card. First, illustrative, a menu with the same fill as the card and no border: the menu's edge is lost. Second, Atlassian: page #1F1F21, card #242528, menu #2B2C2F lighter than the card, with a faint light ring and a dark shadow. Third, Primer dark: page #0D1117, card #151B23, menu #010409 darker than both, with a #3D444D ring, and a selected row in #151B23 that stays visible inside it. Atlassian values from @atlaskit/tokens 20.11, Primer from @primer/primitives 11.10; the Atlassian selected row is illustrative.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<text x="24" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Same fill, no edge (illustrative)</text>
<text x="264" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Lighter plus ring (Atlassian)</text>
<text x="504" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Darker plus ring (Primer)</text>
<rect x="24" y="40" width="200" height="220" rx="8" fill="#1f1f21"/>
<rect x="36" y="56" width="176" height="190" rx="8" fill="#242528"/>
<rect x="76" y="96" width="124" height="120" rx="8" fill="#242528"/>
<text x="88" y="120" font-size="12" fill="#cecfd2">Rename</text>
<text x="88" y="146" font-size="12" fill="#cecfd2">Duplicate</text>
<text x="88" y="172" font-size="12" fill="#cecfd2">Delete</text>
<rect x="264" y="40" width="200" height="220" rx="8" fill="#1f1f21"/>
<rect x="276" y="56" width="176" height="190" rx="8" fill="#242528"/>
<rect x="320" y="104" width="124" height="120" rx="8" fill="#010404" opacity="0.36"/>
<rect x="316" y="96" width="124" height="120" rx="8" fill="#2b2c2f" stroke="#4a4a4d"/>
<text x="328" y="120" font-size="12" fill="#cecfd2">Rename</text>
<rect x="320" y="132" width="116" height="22" rx="4" fill="#3b3d42"/>
<text x="328" y="147" font-size="12" fill="#cecfd2">Duplicate</text>
<text x="328" y="172" font-size="12" fill="#cecfd2">Delete</text>
<rect x="504" y="40" width="200" height="220" rx="8" fill="#0d1117"/>
<rect x="516" y="56" width="176" height="190" rx="8" fill="#151b23"/>
<rect x="556" y="96" width="124" height="120" rx="8" fill="#010409" stroke="#3d444d"/>
<text x="568" y="120" font-size="12" fill="#f0f6fc">Rename</text>
<rect x="560" y="132" width="116" height="22" rx="4" fill="#151b23"/>
<text x="568" y="147" font-size="12" fill="#f0f6fc">Duplicate</text>
<text x="568" y="172" font-size="12" fill="#f0f6fc">Delete</text>
<text x="24" y="284" font-size="12" fill="#5a5850">edge lost</text>
<text x="264" y="284" font-size="12" fill="#5a5850">lift by fill, ring, shadow</text>
<text x="504" y="284" font-size="12" fill="#5a5850">sink by fill, ring; rows can layer</text>
</svg>

The first menu is gone. The second and third are both readable, and the difference is what fits inside: in Primer's version the selected row uses the same muted value the card uses, and still shows.

The mechanism is that a dark ladder is short. Atlassian's whole climb from sunken to overlay is about 0.08 OKLCH L (`#18191A` to `#2B2C2F`). An overlay at the top of it has one step left for hover and selection before it starts to glow. An overlay at the bottom has the entire ladder above it for whatever it contains, and leans on its ring for separation.

Neither direction works without the edge. Primer's dark floating shadows open with a one-pixel `#3d444d` ring; Atlassian's dark `elevation.shadow.overlay` opens with a one-pixel light ring at 12% opacity. The ring is decoration, not a control boundary, so WCAG's 3:1 doesn't bind it: Primer's ring measures 2.09:1 against its overlay.

**Decide per system whether overlays hold layered content (selected rows, nested fields, tabs); if they do, sink the overlay and let a ring carry the edge, and if they don't, lift it one step and still give it the ring.** Lighter-is-higher is the consensus and the toolkit's default. Primer's reversal is one system's evidence, but it is a documented reversal by a team that had shipped the consensus for years, which is the strongest kind of evidence a single system can give. The constraint is the content: a plain action menu doesn't need the room.

---

## Always-dark regions

A region that must stay dark in both modes (a video player, a code block, a dark hero) should be a theme scope set to dark, not a block of hard-coded colours, and in dark mode it needs an edge because the page has come down to meet it.

The hero from the opening scene was built as `background: #111; color: #fff`. In light mode, a text link inside it takes the light theme's link colour, Primer's `#0969da`, which measures 3.64:1 on `#111111` and fails WCAG's 4.5:1 for text. The focus ring is the same dark blue. The block was dark; the components inside it still believed they were on a light page.

Apple names the legitimate cases. Its guidelines allow a permanently dark appearance for immersive media, with the Stocks app as its example, and watchOS and visionOS have no dark mode setting at all. Media viewers, video players, photo lightboxes, slide presenters and code editors all have a reason to keep one scheme regardless of the person's choice.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two pages side by side. Left, a light page #FFFFFF holding an always-dark video player #000000 and a dark code block #0D1117; both stand out on their own. Right, the same layout on a dark page #0D1117: the video player at #000000 measures only 1.11 to 1 against the page and needs a border, and an always-light document preview #FFFFFF sits in the middle of the dark page as the reverse case. Colours illustrative, page values from Primer.</title>
<rect x="0" y="0" width="720" height="320" fill="#f7f6f2"/>
<text x="24" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Light page</text>
<text x="376" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Dark page</text>
<rect x="24" y="40" width="320" height="250" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<rect x="44" y="60" width="280" height="110" rx="6" fill="#000000"/>
<path d="M172 98 L172 132 L200 115 Z" fill="#ffffff"/>
<text x="54" y="160" font-size="11" fill="#c9c6bd">Player, always dark</text>
<rect x="44" y="186" width="280" height="84" rx="6" fill="#0d1117"/>
<text x="56" y="210" font-family="ui-monospace, monospace" font-size="12" fill="#ff7b72">const</text>
<text x="100" y="210" font-family="ui-monospace, monospace" font-size="12" fill="#f0f6fc">level = 2;</text>
<text x="56" y="256" font-size="11" fill="#9198a1">Code, always dark</text>
<rect x="376" y="40" width="320" height="250" rx="8" fill="#0d1117"/>
<rect x="396" y="60" width="280" height="110" rx="6" fill="#000000" stroke="#3d444d"/>
<path d="M524 98 L524 132 L552 115 Z" fill="#ffffff"/>
<text x="406" y="160" font-size="11" fill="#9198a1">Player: 1.11:1 to page, so bordered</text>
<rect x="396" y="186" width="280" height="84" rx="6" fill="#ffffff"/>
<rect x="412" y="202" width="160" height="8" rx="2" fill="#c9c6bd"/>
<rect x="412" y="218" width="220" height="8" rx="2" fill="#c9c6bd"/>
<rect x="412" y="234" width="190" height="8" rx="2" fill="#c9c6bd"/>
<text x="412" y="262" font-size="11" fill="#5a5850">Document preview, always light</text>
</svg>

On the light page, both dark blocks separate themselves. On the dark page, the player has lost its edge and needs a border, while the document preview is now the region that stands out, and glows.

The reverse case is as common as the first. A document editor shows the page being edited as white paper in both modes; an email client often renders a message's own HTML on white; a PDF viewer shows the PDF as printed. These are always-light regions inside a dark interface, and they bring the same two problems back: the components inside them (a comment marker, a selection colour, a link) need the light theme's values, and the white block needs softening or framing so it doesn't dominate. Apple's guidelines suggest slightly darkening a content image with a white background for exactly this reason.

Carbon's documentation describes this as inline theming: a `Theme` component wraps a region in another theme, such as a Gray 100 side panel on a White page, and Carbon limits it to "major shifts in color, like high contrast moments". The scope carries every token, so a button, a link and a focus ring inside the region are all correct without a single override.

**Wrap the always-dark region in a theme scope (`data-theme="dark"` with `color-scheme: dark` on the element, a Figma frame with the Dark mode applied, Carbon's `<Theme theme="g100">`), and give it a border that only appears when the page is dark too.** That keeps the hero's link at Primer's dark `#4493f8`, which measures 6.09:1 on `#111111`. Scoping is consensus wherever systems document it; the conditional border is judgement, needed because a near-black region on a near-black page measures about 1.1:1.

---

## Brand and fixed surfaces

A colour that must stay the same in both modes should be its own role family with its own on-colour, as Material's fixed roles are, never a raw hex pasted into one component.

The brand banner from the opening scene is `primaryContainer`. In Material 3's baseline that is a pale lilac (`#EADDFF`, tone 90) in light mode and a deep purple (`#4F378B`, tone 30) in dark, with the text flipping from `#21005D` to `#EADDFF`. That is correct adaptive behaviour, and it is also not what a product team wants when the banner is a brand moment or a card that pictures a physical product.

Material 3 added a role family for exactly this. `primaryFixed`, `primaryFixedDim`, `onPrimaryFixed` and `onPrimaryFixedVariant` take tones 90, 80, 10 and 30 in both modes; in Material's colour utilities the tone function for each ignores whether the scheme is dark. The same family exists for secondary and tertiary.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Material 3 baseline, light page #FEF7FF on the left and dark page #141218 on the right. In each, two banners. The primaryContainer banner flips: #EADDFF with #21005D text in light, #4F378B with #EADDFF text in dark. The primaryFixed banner stays #EADDFF with #21005D text in both modes, and on the dark page it is far brighter than anything around it. Values from Material Web's baseline tokens and Material colour utilities.</title>
<rect x="0" y="0" width="720" height="270" fill="#f7f6f2"/>
<text x="24" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Light</text>
<text x="376" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Dark</text>
<rect x="24" y="40" width="320" height="200" rx="8" fill="#fef7ff" stroke="#c9c6bd"/>
<rect x="44" y="60" width="280" height="64" rx="12" fill="#eaddff"/>
<text x="60" y="88" font-size="13" font-weight="600" fill="#21005d">primaryContainer</text>
<text x="60" y="108" font-size="12" fill="#21005d">#EADDFF, text #21005D</text>
<rect x="44" y="144" width="280" height="64" rx="12" fill="#eaddff"/>
<text x="60" y="172" font-size="13" font-weight="600" fill="#21005d">primaryFixed</text>
<text x="60" y="192" font-size="12" fill="#21005d">#EADDFF, text #21005D</text>
<rect x="376" y="40" width="320" height="200" rx="8" fill="#141218"/>
<rect x="396" y="60" width="280" height="64" rx="12" fill="#4f378b"/>
<text x="412" y="88" font-size="13" font-weight="600" fill="#eaddff">primaryContainer</text>
<text x="412" y="108" font-size="12" fill="#eaddff">#4F378B, text #EADDFF: flipped</text>
<rect x="396" y="144" width="280" height="64" rx="12" fill="#eaddff"/>
<text x="412" y="172" font-size="13" font-weight="600" fill="#21005d">primaryFixed</text>
<text x="412" y="192" font-size="12" fill="#21005d">#EADDFF, text #21005D: unchanged</text>
<text x="24" y="260" font-size="12" fill="#5a5850">Both banners look alike in light.</text>
<text x="376" y="260" font-size="12" fill="#5a5850">Only the adaptive one adapts.</text>
</svg>

In light mode the two banners are indistinguishable. In dark mode the fixed one keeps its identity, and also becomes the brightest thing on the screen: `#EADDFF` on `#141218` is 14.42:1.

So a system ends up with three kinds of colour role, and naming the kind is what keeps a request like "make it stay the same" from turning into a hex in a component. Adaptive roles (most of them) change per mode. Fixed roles keep one value. Inverse roles do the opposite of the theme: Carbon's `background-inverse` is `#393939` in White and `#F4F4F4` in Gray 100, and Material's snackbar takes `inverseSurface`.

Take an illustrative request to see the cost of skipping the role. A designer sets a promo card to the brand hex `#6750A4` with white text (6.44:1, fine) in the light file and marks it "same in dark". Nobody makes a dark-mode check for a colour that "doesn't change", so the card's secondary text, a 60% white, and its outline button, which takes the theme's dark `outline`, are never measured against it.

**Add fixed roles as a family (`brand-fixed`, `on-brand-fixed`, `on-brand-fixed-variant`) with both modes set to the same value, and measure every pair inside them in both modes anyway.** Fixed roles are documented only by Material, so this is one system's evidence; the reason it transfers is mechanical: a role with an on-colour gets checked, and a raw hex doesn't. Keep fixed surfaces small in dark mode, where a light fixed surface outshines everything else.

---

## Scoped theme overrides

Every platform lets a frame, a subtree or a view take a different theme, and each one has a boundary where the override silently stops; a system stays intact when overrides are whole themes applied to a scope, never individual colours.

The always-dark hero, the always-light document and Apple's elevated sheet are all the same mechanism: a part of the tree resolves the same tokens to different values. Here is how each platform spells it.

- **Figma.** Select a frame, section, group or page and use Apply variable mode in the Appearance section. A child left on Auto takes its parent's mode, walking up until it finds a container with one set, and falls back to the collection's default when none has.
- **CSS.** `color-scheme: dark` on an element sets the used colour scheme for that subtree, so `light-dark()` values and native controls inside it resolve to dark. A theme attribute does the same for custom properties: Primer's selectors are plain attribute selectors (`[data-color-mode="dark"][data-dark-theme="dark"]`), so they work on any element, not only `html`.
- **UIKit.** `overrideUserInterfaceStyle` on a view applies to it and its subviews owned by the same view controller.
- **SwiftUI.** `.environment(\.colorScheme, .dark)` changes a view and its children only. `.preferredColorScheme(.dark)` propagates up to the enclosing presentation (a sheet, a popover, a window) and then down through all of it.

Each of these has a place where the override stops, and that place is where customisation breaks the system. Here is one subtree, with the place it breaks on the web.

<svg role="img" viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A tree diagram of a light page. html, light, contains main, light, which contains a hero section with data-theme dark and color-scheme dark. Inside the hero, a card inherits dark and a button inside the card inherits dark: both correct. The button opens a menu, but the menu is rendered through a portal as a child of body, outside the hero, so it resolves to the light theme: a white menu appears over the dark hero. The fix shown: the portal copies the trigger's theme attribute onto the menu root. Illustrative.</title>
<rect x="0" y="0" width="720" height="340" fill="#f7f6f2"/>
<rect x="24" y="24" width="180" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="36" y="49" font-size="13" fill="#1a1a1a">html: light</text>
<rect x="24" y="96" width="180" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="36" y="121" font-size="13" fill="#1a1a1a">body &gt; main: light</text>
<rect x="24" y="168" width="260" height="40" rx="6" fill="#0d1117"/>
<text x="36" y="193" font-size="13" fill="#f0f6fc">section.hero  data-theme="dark"</text>
<rect x="64" y="236" width="180" height="36" rx="6" fill="#151b23"/>
<text x="76" y="259" font-size="13" fill="#f0f6fc">card: inherits dark</text>
<rect x="104" y="288" width="180" height="36" rx="6" fill="#151b23"/>
<text x="116" y="311" font-size="13" fill="#f0f6fc">button: inherits dark</text>
<path d="M60 64 L60 96" stroke="#5a5850" stroke-width="1.5"/>
<path d="M60 136 L60 168" stroke="#5a5850" stroke-width="1.5"/>
<path d="M80 208 L80 236" stroke="#5a5850" stroke-width="1.5"/>
<path d="M120 272 L120 288" stroke="#5a5850" stroke-width="1.5"/>
<rect x="420" y="96" width="270" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="432" y="121" font-size="13" fill="#1a1a1a">body &gt; portal root: light</text>
<rect x="460" y="168" width="230" height="64" rx="8" fill="#ffffff" stroke="#b5501f" stroke-width="2"/>
<text x="472" y="192" font-size="13" fill="#b5501f">menu: resolves light</text>
<text x="472" y="214" font-size="12" fill="#5a5850">white menu over dark hero</text>
<path d="M204 44 L470 44 L470 96" fill="none" stroke="#5a5850" stroke-width="1.5"/>
<path d="M520 136 L520 168" stroke="#5a5850" stroke-width="1.5"/>
<path d="M284 306 Q380 300 460 210" fill="none" stroke="#b5501f" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="330" y="282" font-size="12" fill="#b5501f">opens</text>
<rect x="420" y="256" width="270" height="56" rx="6" fill="#ffffff" stroke="#1f5fbf"/>
<text x="432" y="279" font-size="12" fill="#1f5fbf">Fix: the portal copies the trigger's</text>
<text x="432" y="297" font-size="12" fill="#1f5fbf">data-theme onto the menu root</text>
</svg>

Inheritance follows the tree, and a portal moves the menu out of the tree. The card and the button are right; the menu, which is the one surface that floats, is wrong.

Each platform has its own version of the portal. Here is the run, each with what it looks like and what it breaks.

| Trap | What happens | What breaks |
|---|---|---|
| Portal escape (web) | A menu, tooltip or dialog is appended to `body`, outside the themed subtree | It renders in the page's theme over a region of the other one |
| Embedded child view controller (UIKit) | Apple's documentation says a child view controller's views don't inherit the override | A reused component inside a dark-only screen turns light |
| `preferredColorScheme` reaching up (SwiftUI) | Set on one view, it flows up to the enclosing sheet or window | One dark card turns a whole sheet dark |
| Auto falling through (Figma) | A component on Auto with no moded ancestor takes the collection default | A component pasted outside its frame changes mode in the file |
| Media queries ignore scope (web) | `<picture>` sources and `@media (prefers-color-scheme)` read the person's setting, not the subtree | A dark-only region shows the light logo when the person is in light mode |
| Raw values inside a scope | A colour typed as hex doesn't follow the scope | That one element is the only thing wrong in the region |

Two of these come from systems' own documentation (the UIKit and SwiftUI rows); the rest follow from how CSS inheritance and Figma's Auto mode are specified. Carbon caps the related `Layer` component at three nested levels, which is another way of saying a scope is not free.

**Allow overrides only as a whole theme or mode applied to a scope, never as colours: in code a `data-theme` attribute (and `color-scheme`) on the region root, in Figma a mode applied to the frame, and in a component library a rule that portalled surfaces copy their trigger's theme attribute.** That rule is how a design system keeps a product's customisation inside the system: a team can ask for a dark hero or a light document, and gets a correct one because it gets a whole theme. Scoping by theme is consensus wherever systems document overrides; the portal rule is judgement, drawn from how inheritance works rather than from any system's docs.

---

## Images in dark

An image doesn't follow the theme, so each one is either designed to work on both grounds or given a second asset swapped by the same switch that changes the theme.

A logo exported as a PNG with near-black text (`#1A1A1A`) on a transparent background measures 1.09:1 on Primer's dark page `#0D1117`. A product photo shot on white becomes a lit rectangle in the middle of a dark screen. An illustration drawn with dark outlines loses its details.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Four tiles on a dark page #0D1117. First, a logo with #1A1A1A text on a transparent background, nearly invisible at 1.09 to 1. Second, the dark-mode asset of the same logo with light text #F0F6FC. Third, a product photo on a pure white background, glowing. Fourth, the same photo with its white background softened to a light grey. Colours illustrative, page colour from Primer.</title>
<rect x="0" y="0" width="720" height="270" fill="#f7f6f2"/>
<rect x="16" y="16" width="688" height="220" rx="8" fill="#0d1117"/>
<rect x="36" y="40" width="150" height="120" rx="6" fill="none" stroke="#3d444d" stroke-dasharray="4 4"/>
<circle cx="66" cy="100" r="14" fill="#1a1a1a"/>
<text x="88" y="106" font-size="18" font-weight="700" fill="#1a1a1a">Acme</text>
<rect x="202" y="40" width="150" height="120" rx="6" fill="none" stroke="#3d444d" stroke-dasharray="4 4"/>
<circle cx="232" cy="100" r="14" fill="#f0f6fc"/>
<text x="254" y="106" font-size="18" font-weight="700" fill="#f0f6fc">Acme</text>
<rect x="368" y="40" width="150" height="120" rx="6" fill="#ffffff"/>
<rect x="418" y="70" width="50" height="70" rx="10" fill="#b5501f"/>
<rect x="534" y="40" width="150" height="120" rx="6" fill="#d9d9d9"/>
<rect x="584" y="70" width="50" height="70" rx="10" fill="#a8481c"/>
<text x="36" y="186" font-size="12" fill="#9198a1">Logo, light asset</text>
<text x="36" y="204" font-size="12" fill="#9198a1">1.09:1, lost</text>
<text x="202" y="186" font-size="12" fill="#9198a1">Logo, dark asset</text>
<text x="202" y="204" font-size="12" fill="#9198a1">swapped by theme</text>
<text x="368" y="186" font-size="12" fill="#9198a1">Photo on white</text>
<text x="368" y="204" font-size="12" fill="#9198a1">glows</text>
<text x="534" y="186" font-size="12" fill="#9198a1">Photo, softened</text>
<text x="534" y="204" font-size="12" fill="#9198a1">slightly darkened</text>
</svg>

The logo needs a second asset; the photo needs only to be toned down. Those are the two remedies Apple's guidelines give: separate light and dark assets where an image works in only one mode, and slightly darkening a content image with a white background so it doesn't glow.

Apple's asset catalogs carry the swap natively: one named image with an appearance for Any, Dark and, optionally, high contrast. Apple's own example is an icon of a drop of oil that gets a thin outline only in dark mode, so its edge shows on a dark ground.

On the web the obvious tool is `<picture>` with a `prefers-color-scheme` source, which GitHub supports even inside Markdown. Its limit is the scope trap from the last section: the media query reads the person's system setting. A site with its own theme toggle, or a region forced dark, needs the swap driven by the theme attribute instead, for example two `img` elements with one hidden by `[data-theme="dark"] .logo-light { display: none }`. An SVG drawn with `currentColor` follows its text colour and needs no second asset at all.

**Make icons and logos SVGs that use `currentColor` where you can; give every raster that fails on dark a dark asset swapped by your theme attribute, not by a media query; and soften white-background photos with a light filter in dark mode only.** The asset swap is consensus (Apple, GitHub and the toolkit's own rule). Driving it from the theme attribute rather than the media query is judgement, and it matters only for products with a toggle or scoped regions.

---

## Contrast settings

When a person turns up contrast, the dark ladder should spread its steps and lean harder on borders; when forced colours are on, every level collapses into one colour and only borders survive.

The toolkit's knowledge base already covers the basics of forced colours and `prefers-contrast`. What it doesn't say is what each setting does to the surface ladder specifically.

Material's colour utilities make the answer concrete. Each dark container's tone is a contrast curve with four points, for reduced, standard, medium and high contrast. At standard contrast the dark containers sit at tones 4, 10, 12, 17 and 22. At high contrast they sit at 0, 12, 20, 25 and 30, while `surface` stays at 6.

<svg role="img" viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Material 3's five dark surface containers at two contrast levels, drawn as neutral greys at each tone with the hue dropped. Standard contrast: tones 4, 10, 12, 17 and 22, greys #0E0E0E, #1B1B1B, #1F1F1F, #2A2A2A and #353535, with a gap of only 2 between low and container. High contrast: tones 0, 12, 20, 25 and 30, greys #000000, #1F1F1F, #303030, #3B3B3B and #474747, wider gaps and a lowest level of pure black. Tones from Material colour utilities; greys illustrative.</title>
<rect x="0" y="0" width="720" height="240" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Standard contrast</text>
<rect x="24" y="44" width="124" height="56" rx="6" fill="#0e0e0e"/>
<rect x="160" y="44" width="124" height="56" rx="6" fill="#1b1b1b"/>
<rect x="296" y="44" width="124" height="56" rx="6" fill="#1f1f1f"/>
<rect x="432" y="44" width="124" height="56" rx="6" fill="#2a2a2a"/>
<rect x="568" y="44" width="124" height="56" rx="6" fill="#353535"/>
<text x="36" y="78" font-size="12" fill="#e3e3e3">lowest 4</text>
<text x="172" y="78" font-size="12" fill="#e3e3e3">low 10</text>
<text x="308" y="78" font-size="12" fill="#e3e3e3">container 12</text>
<text x="444" y="78" font-size="12" fill="#e3e3e3">high 17</text>
<text x="580" y="78" font-size="12" fill="#e3e3e3">highest 22</text>
<text x="24" y="140" font-size="14" font-weight="600" fill="#1a1a1a">High contrast</text>
<rect x="24" y="154" width="124" height="56" rx="6" fill="#000000"/>
<rect x="160" y="154" width="124" height="56" rx="6" fill="#1f1f1f"/>
<rect x="296" y="154" width="124" height="56" rx="6" fill="#303030"/>
<rect x="432" y="154" width="124" height="56" rx="6" fill="#3b3b3b"/>
<rect x="568" y="154" width="124" height="56" rx="6" fill="#474747"/>
<text x="36" y="188" font-size="12" fill="#e3e3e3">lowest 0</text>
<text x="172" y="188" font-size="12" fill="#e3e3e3">low 12</text>
<text x="308" y="188" font-size="12" fill="#e3e3e3">container 20</text>
<text x="444" y="188" font-size="12" fill="#e3e3e3">high 25</text>
<text x="580" y="188" font-size="12" fill="#e3e3e3">highest 30</text>
</svg>

The weak link at standard contrast is the two-tone gap between low and container; at high contrast it becomes eight. The whole ladder also widens, from a span of 18 tones to 30.

Primer's dark high contrast theme takes the other route. Its page, inset and overlay are all `#010409`, and the separation moves entirely to borders: `borderColor-default` is `#b7bdc8`, 10.88:1 against the page, and the floating shadow's ring takes the same value. Where Material spreads the fills, Primer flattens them and draws lines.

Forced colours go furthest. MDN lists `background-color` and `border-color` among the properties replaced with system colours, and `box-shadow` forced to `none`. Every surface level becomes `Canvas`, and a menu's border, now a system colour, is the only thing left that outlines it.

Apple adds a warning specific to dark mode: with Increase Contrast on, dark text on a dark background can end up with less visual contrast, and its guidelines ask for testing with Increase Contrast and Reduce Transparency both separately and together.

**Give each surface level a high-contrast value that widens the dark steps, make sure every floating surface has a real border (not only a shadow ring) so forced colours can outline it, and check Increase Contrast and Reduce Transparency in dark mode together.** Spreading or bordering under high contrast is consensus between Material, Primer and Apple, by different routes; which route suits a product depends on whether its surfaces carry content that needs fills (Material's case) or are mostly lists and code (Primer's).

---

## Testing dark surfaces

Dark surfaces fail at the joins (an overlay over the level it opens on, a scoped region against the page, an image against its ground), so the tests have to list the joins, not only the tokens.

A token-by-token contrast run, each text colour against the surface it was designed for, passes every theme in this piece. The Material menu in a dialog, Primer's dimmed overlay against its page (1.14:1), the always-dark player on a dark page (1.11:1) and the portalled menu in the dark hero all pass it too, because the failure is in which token meets which.

So the test plan is a list of pairs. Here is a working version, in the order the failures appeared above.

- **Every floating surface against every surface it can open over.** For a menu that can open from a page, a card or a dialog, that is three pairs per theme. The check is that the overlay differs in fill or carries a border, and for a selected row, that the row differs from the overlay.
- **Every theme and contrast level.** Light, dark, any dimmed variant, and each one with high contrast. Forced colours once, by hand.
- **Every scoped region against the page, in both modes.** A dark region on a dark page needs its edge; a light region on a dark page needs softening.
- **Every portalled surface opened from inside a scoped region.**
- **Every raster image on the darkest and lightest surface it can land on.**

The tools exist for each. Chrome DevTools' Rendering panel emulates `prefers-color-scheme`, `forced-colors` and `prefers-contrast`. Playwright's `page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })` puts the same states into an automated run. In Figma, duplicating a frame and applying the Dark mode to the copy shows both at once. On Apple platforms, the HIG's own list is Dark Mode with Increase Contrast and Reduce Transparency, separately and together.

**Write the surface pairs down as data (overlay, opens-over, theme) and run a contrast and border check over that list on every token change, then look at forced colours by hand once per release.** No system read publishes a check of this shape, so this is judgement; the reason for it is that every failure in this piece passed a per-token check.

---

## Evidence and lineage

The evidence here is strong on what systems ship and weak on what works for people: no published user research on depth perception between dark surfaces turned up.

Ranked by strength, the sources are: token source code and generated packages (Material colour utilities, Material Web tokens, `@primer/primitives` 11.10, `@carbon/themes` 11.85, `@atlaskit/tokens` 20.11, Ant Design's dark algorithm); release notes and pull requests with their reasoning (Compose Material 3, Flutter 3.22, Primer's PR #1220); platform documentation (Apple's HIG and UIKit and SwiftUI reference, MDN, Figma's help centre, Carbon's colour guidance). A search for user studies of perceived elevation in dark interfaces found practitioner guides and one 2016 study on shading in flat interfaces, nothing on dark surface steps.

The lineage check matters for the central claim, lighter-is-higher in dark. Material 2 published it as a white overlay with its dark theme guidance (2019, unchecked), and much of the web followed Material. Apple's base and elevated sets (iOS 13, 2019, unchecked) reach the same direction by a different mechanism, a trait rather than an overlay, which counts as close to independent. Carbon's ascending layers and Ant Design's lightened containers come from systems with their own colour tooling. So the direction has at least two independent origins; the step sizes do not agree (about 0.08 per layer in Carbon against about 0.027 in Atlassian), which suggests the size is local judgement.

The two reversals in this piece are the most informative evidence because they ran against the consensus: Primer moving dark overlays below the page in 2025, and Material moving from computed tint to named containers in 2023 to 2024. Both are documented by the teams that made them.

**Treat the direction (lighter is higher in dark) as settled, the step size and the overlay's place as local decisions to test, and say so when you write them into your system's documentation.**

---

## Cheat sheet

| Situation | Do | Don't |
|---|---|---|
| Writing dark surface values | Design an ascending ladder of its own | Invert or map the light values |
| Naming levels | Position: one up from its container | "Lighter" or "darker" |
| Material 3 container roles | Check each floating role against what it opens over | Assume `surfaceContainer` sits above `surfaceContainerHigh` |
| Elevated content (sheet, dialog) | A scope that remaps surface tokens one step up | A second token set components must pick |
| Second dark theme | Only on request; own overlay decision, own contrast run | A palette tweak with no new tests |
| Overlay holds selected rows or fields | Sink it below the page, with a ring | Lift it to the top of a short ladder |
| Plain action menu | Lift it one step, with a ring | Same fill as the card, no edge |
| Always-dark or always-light region | Theme scope on the root; border when page matches | Hard-coded `#111` and `#fff` |
| Colour that must not change | Fixed role family with on-colours | A raw hex in one component |
| Portalled menu or tooltip | Copy the trigger's theme attribute | Let it inherit from `body` |
| Logo or illustration | `currentColor` SVG, or dark asset swapped by theme attribute | `<picture>` alone when there's a toggle |
| White-background photo | Soften slightly in dark | Leave it glowing |
| High contrast | Widen dark steps, or flatten and border | Keep standard steps |
| Forced colours | A real border on every floating surface | Shadow or ring alone |
| Tests | A list of surface pairs per theme | Per-token contrast only |

---

## The short version

In dark mode, a surface further forward is lighter in every system read, but light modes disagree (Material darkens, Carbon alternates, Atlassian stays white), so design the dark ladder on its own and name levels by position, one up from their container, never by lightness.

Material's move from a computed tint overlay to named container roles made surfaces themeable and allowed a level below the page, but a role is assigned per component, so a Material 3 menu (`surfaceContainer`) is darker than the dialog it opens over (`surfaceContainerHigh`). Apple's alternative is worth borrowing: one token set, and a base or elevated context that shifts every surface one step when something is presented. On the web that's a scope attribute that remaps your surface properties.

Ship one dark theme unless users ask for more. Primer ships a dimmed one, and its overlays then sit in a different place on the ladder than in its main dark theme, which is the real cost. For floating surfaces, decide whether they hold layered content: Primer moved its dark overlays below the page in 2025 because a selected row had nowhere to go, while Atlassian lifts them. Either way the edge, a ring or border, does the separating.

Regions that keep one scheme (video, code, document previews) and colours that must not change (Material's fixed roles) are both handled by naming them: a theme scope on the region, a fixed role family with on-colours. Overrides should only ever be whole themes applied to a scope, in Figma as a mode on a frame and in code as `data-theme` with `color-scheme`; the place they break is a portal, a child view controller or a media query that reads the system setting instead of the scope.

Write down for your engineers: the ladder per mode, where overlays sit and why, the fixed and inverse roles, the portal rule, and a list of surface pairs to test in every theme and contrast level. The direction of the dark ladder is consensus; the step size and the overlay's place are your decisions, and should say so.

---

## What to re-check later

Researched 12 November 2026.

- **Primer.** Values read from `@primer/primitives` 11.10.0. The dark overlay change is PR #1220 (merged 5 June 2025); the author called it a solution they were unsure of, so it may move again. Dimmed's overlay stays lighter than its page.
- **Atlassian's dark surfaces have changed.** `@atlaskit/tokens` 20.11.0 gives `elevation.surface` `#1F1F21`, sunken `#18191A`, raised `#242528`, overlay `#2B2C2F`, neutral greys. The toolkit's `visual.md` (surfaces and elevation levels) still quotes the older blue-tinted set (`#161A1D` to `#282E33`) and should be updated there.
- **Material.** Tone values read from material-color-utilities `color_spec_2021.ts`, and baseline hex from Material Web's v0_192 tokens. Material's 2025 Expressive spec may adjust tones; the 2021 spec is what the baseline still uses. The m3.material.io pages render client-side and were not read; the release notes and code stand in for them. Compose's Material 3 overview page still describes tonal overlays.
- **Compose versions.** Roles added in 1.2.0-alpha03; component moves listed under 1.2 and 1.3 release notes (Menu in 1.3.0-alpha02).
- **Apple's colour hex values** (`#1C1C1E`, `#2C2C2E`, `#3A3A3C`) come from the toolkit's knowledge base and Apple's colour tables; the grouped-list pairing in the figure follows the same tables and was not re-read for this piece (unchecked).
- **Carbon.** `@carbon/themes` 11.85.0. Carbon's colour usage page does not compare layering with elevation.
- **Ant Design.** Read from the `master` branch's dark algorithm; `colorBgBase` defaults to `#000`.
- **Playwright's `contrast` option** for `emulateMedia` was not checked and is left out; `colorScheme` and `forcedColors` are long-standing (unchecked against the current docs).
- **Spectrum** was not read; whether Spectrum 2 still ships a "darkest" theme is unchecked.
- **The portal trap and the media-query trap** follow from how CSS inheritance and media queries are specified, not from a system's documentation.
- **Evidence quality.** Everything is what systems ship and say. No user research on dark surface steps was found.

---

## Sources

**Primary: system source, tokens and release notes**

- [Material color utilities, `color_spec_2021.ts`](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts). Surface, container and fixed tones, contrast curves.
- [Material Web, `_md-sys-color.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-color.scss) and [`_md-ref-palette.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-ref-palette.scss). Baseline role mapping and hex values.
- [Compose Material 3, `ColorScheme.kt`](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ColorScheme.kt). `surfaceColorAtElevation` formula.
- [Compose Material 3 release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3). SurfaceContainer roles, `LocalTonalElevationEnabled`, component moves.
- [Flutter, new ColorScheme roles](https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles). Flutter 3.22 roles, deprecations, `surfaceTintColor` default.
- [`@primer/primitives` dark theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark.css), [dark dimmed](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark-dimmed.css) and [dark high contrast](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark-high-contrast.css).
- [Primer primitives PR #1220, overlay background in dark themes](https://github.com/primer/primitives/pull/1220) and [CHANGELOG](https://github.com/primer/primitives/blob/main/CHANGELOG.md).
- [`@carbon/themes` on npm](https://www.npmjs.com/package/@carbon/themes) (11.85.0, `scss/generated/_themes.scss`).
- [`@atlaskit/tokens` dark raw tokens](https://cdn.jsdelivr.net/npm/@atlaskit/tokens/dist/cjs/artifacts/tokens-raw/atlassian-dark.js) (20.11.0). Surfaces, overlay shadow, `utility.elevation.surface.current`.
- [Ant Design dark theme colours](https://github.com/ant-design/ant-design/blob/master/components/theme/themes/dark/colors.ts) and [colour algorithm](https://github.com/ant-design/ant-design/blob/master/components/theme/themes/dark/colorAlgorithm.ts).

**Primary: platform and system documentation**

- [Apple Human Interface Guidelines, Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode). Base and elevated, dark-only apps, softening white images, separate assets, testing with Increase Contrast and Reduce Transparency.
- [UIKit, `overrideUserInterfaceStyle`](https://developer.apple.com/documentation/uikit/uiview/overrideuserinterfacestyle), [`userInterfaceLevel`](https://developer.apple.com/documentation/uikit/uitraitcollection/userinterfacelevel) and [`accessibilityContrast`](https://developer.apple.com/documentation/uikit/uitraitcollection/accessibilitycontrast).
- [SwiftUI, `colorScheme`](https://developer.apple.com/documentation/swiftui/environmentvalues/colorscheme) and [`preferredColorScheme(_:)`](https://developer.apple.com/documentation/swiftui/view/preferredcolorscheme(_:)).
- [Carbon, colour usage](https://carbondesignsystem.com/elements/color/usage/). Layering sets, contextual tokens, `Layer` nesting, inline theming.
- [Android Developers, Material Design 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3). Tonal and shadow elevation on `Surface`.

**Standards and tools**

- [MDN, `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark). Used colour scheme, scoping by `color-scheme`, Baseline 2024.
- [MDN, `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors). Overridden properties, `box-shadow: none`.
- [Figma help, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables). Apply variable mode, Auto inheritance.

**Commentary and research**

- [Creager and colleagues, HFES 2016](https://flatisbad.com/publications/Creager-HFES16.pdf). Shading salience in flat interfaces; the nearest research found, not about dark surfaces.

**Cited but not resolved to a URL**

- GitHub's documentation on specifying the theme an image is shown to in Markdown (`<picture>` with `prefers-color-scheme`): known, not opened for this piece.
- Material 3's "tone-based surfaces" page on m3.material.io: opened, but the page renders client-side and returned no text.
