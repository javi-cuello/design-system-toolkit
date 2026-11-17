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

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole piece in a few paragraphs. The basics (a dark step of about 0.03 to 0.04 OKLCH lightness, no pure black page, a border on every overlay) are in the toolkit's knowledge base, `knowledge/ui/design/visual.md`. Which surface sits on which is in [how surfaces stack](how-surfaces-stack.md), shadows in [elevation and shadows](elevation-and-shadows.md).

---

## Which way levels go

In dark mode every system read makes a surface further forward lighter; in light mode they disagree, so a dark ladder can't be produced by inverting a light one.

In dark mode the order is settled: page darkest, card lighter, a menu over the card lighter still. In light there is no agreement, and a team that writes dark tokens by flipping the light ones inherits whichever light convention it started from. Here are two systems' ladders in both modes, base at the bottom.

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

Both dark columns climb. The light columns go two ways: Material's light containers darken as they rise, and Carbon's White theme swaps between white and grey at each layer ([how surfaces stack](how-surfaces-stack.md#a-surface-on-a-surface) explains the alternation).

The two systems mean different things by a level. Material's container roles measure distance from the page's extreme: in light, further from white; in dark, further from black. Carbon's layers are nesting contexts, each only having to differ from the one beneath it. Carbon's dark steps are also much larger than the toolkit's 0.03: Gray 100 climbs from OKLCH L 0.20 to 0.27, 0.35 and 0.44, about 0.08 per layer, because each layer has to hold fields and borders of its own. Carbon pairs them by position (a field on `layer-01` takes `field-02`), so the relationship holds in both modes.

Take an illustrative inversion to see the cost. A team's light tokens follow Carbon's White theme, and someone writes dark values by mapping each light grey to the matching dark grey of the ramp. `background` and `layer-02` share `#FFFFFF` in light, so they get the same dark value too, and a card at `layer-02` on a `background` page disappears in dark mode.

**Write the order of levels per mode as a position (one up from its container), and design the dark ladder on its own, ascending.** *Weight: strong* for ascending in dark, which every system read does. Whether light mode darkens, alternates or stays white (Atlassian, shadcn) is a free choice; the only error is deriving one mode from the other.

---

## Tint overlays to containers

Material stopped computing a surface's colour from its elevation and replaced it with a fixed set of named container roles, because a computed tint couldn't be themed, inspected or kept in order.

In Material 2's dark theme, and in Material 3 until 2023, the surface colour was arithmetic. A component declared an elevation in dp, and the renderer laid a translucent colour over the base surface: white in Material 2, the primary tint in Material 3. Compose still ships the formula as `surfaceColorAtElevation`: the overlay's alpha is (4.5 × ln(dp + 1) + 2) / 100 of `surfaceTint` over `surface`. Run it on Material 3's baseline dark scheme (`surfaceTint` `#D0BCFF` over `surface` `#141218`) and set the results beside the containers that replaced them.

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

The tinted row bunches up: 8 dp and 12 dp differ by under two percent. The container row is neutral, evenly stepped, and includes a level below the page (`surfaceContainerLowest`), which an overlay, which only lightens, can never produce.

The migration is documented on both of Google's toolkits. Compose Material 3 added the `SurfaceContainer` roles in 1.2.0-alpha03 (21 June 2023), with a `LocalTonalElevationEnabled` switch to turn the overlay off, and later releases moved component after component: `Menu` to `SurfaceContainer` with `MenuDefaults.TonalElevation` at 0.dp, `AlertDialog` to `SurfaceContainerHigh`, `TextField` to `SurfaceContainerHighest`. Flutter 3.22 (2024) made the same move in one release: seven new roles (`surfaceBright`, `surfaceDim` and five containers), `background`, `onBackground` and `surfaceVariant` deprecated, and `surfaceTintColor` defaulting to null on every widget. Material Web's generated tokens now mark `surface-tint` deprecated, its function "replaced by the tonal surface colors".

There is a catch. A container role is assigned per component, not per position in the stack, so it doesn't know what it is drawn over. Before reading on, work out what a menu opened from a field inside a dialog looks like in Material 3's dark scheme.

The menu is `surfaceContainer`, `#211F26` (L 0.245). The dialog is `surfaceContainerHigh`, `#2B2930` (L 0.286). The menu is darker than the dialog it opens over, by 1.13:1, and only its shadow separates it. Under the overlay model the order at least followed the declared elevations; under containers it follows the component table.

**If you adopt container roles, check every pair of a floating component and the surface it can open over, and give the floating one a border where the container order runs the wrong way.** *Weight: strong* that named containers beat computed tint (they can be themed, read in a design file and placed below the page), which is Material's own migration across its toolkits. *Weight: moderate* for the stacking check, judgement about where the change's cost belongs.

---

## Base and elevated

Apple keeps one set of background tokens and makes elevation a property of the context: the same `systemBackground` resolves to black at the base level and to `#1C1C1E` when the view is presented forward.

A grouped list in iOS dark mode is black with `#1C1C1E` cells; a sheet with the same values would merge with the black page behind. Apple's answer is in the trait system. `UITraitCollection` carries a `userInterfaceLevel` of `.base` or `.elevated`, and the system assigns `.elevated` to alerts, popovers and sheets. Every dynamic background colour has a value for each level; the HIG describes the base set as dimmer so background interfaces recede, and the elevated set as brighter.

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

The sheet's code changed no colour name; the presentation flipped the level, and every token inside moved one step up.

In light mode the two sets are identical. iOS is also the exception to the rule against a pure black page: base `systemBackground` in dark is `#000000`, which works because anything that comes forward switches to the elevated set.

The web has no built-in level, but the same shape is a few lines of CSS: a scope attribute that redefines the surface custom properties one step up, so nested content follows without knowing where it is. Atlassian's `utility.elevation.surface.current` is the read side of the same idea ([how surfaces stack](how-surfaces-stack.md#a-surface-on-a-surface)).

**Model "elevated" as a scope that remaps the same surface tokens, rather than as a second set of tokens a component has to choose.** In CSS: `[data-level="elevated"] { --surface-page: var(--surface-raised-value); ... }` on the dialog root. *Weight: moderate.* It is borrowed from Apple's platform, under the constraint that every component reads semantic tokens and none hard-codes a value.

---

## How many dark themes

Most systems ship one dark theme plus contrast variants; GitHub's Primer ships a dimmed dark as well, and Carbon offers two darks that differ only in where the ladder starts.

A request for a softer dark theme looks like a palette job. It is a second ladder, a second set of overlays and a second column in every contrast check. Primer ships eight dark themes among fourteen, `dark-dimmed` among them, and GitHub stores a person's choice as one theme per mode (`data-light-theme`, `data-dark-theme`).

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

The menu sits below the page, above it, and level with it. Only the ring is constant.

That is the hidden cost. Dimmed starts higher (page L 0.27 against dark's 0.18), which leaves room above for a lighter menu but less below for wells, so each theme needs its own answer to where overlays go, and its own checks. Carbon makes the smaller version of the choice: Gray 90 and Gray 100 share one ladder shifted by a step, and Carbon asks a product for one light theme and one dark.

**Ship one dark theme, built as a mode of the same token collection, unless your users have asked for a second; if you add a dimmed one, give it its own overlay decision and its own contrast run.** *Weight: strong* for one dark theme, the consensus. A dimmed variant is evidence from one system with a very large audience; it depends on the budget to test every theme.

---

## Floating surfaces in dark

A menu or popover in dark mode can be lighter or darker than what it opens over; what decides is whether anything has to be layered inside it, and either way its edge, a ring or border, does the separating.

The toolkit's rule puts an overlay two steps above the page, which assumes a flat list. A menu with a selected row and a search field is a small page that needs room on the ladder too.

Primer hit exactly this and reversed itself. In June 2025 a pull request moved its dark `overlay-bgColor` from `#151b23`, the muted background, lighter than the page, to `#010409`, darker than the page, in every dark theme except dimmed. The reason given: the team could not layer inside overlays, because a selected row uses muted, and muted on muted is invisible.

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

The first menu is gone. In Primer's, the selected row uses the card's muted value and still shows.

A dark ladder is short. Atlassian's whole climb from sunken to overlay is about 0.08 OKLCH L (`#18191A` to `#2B2C2F`). An overlay at the top of it has one step left for hover and selection; an overlay at the bottom has the whole ladder above it, and leans on its ring. Neither direction works without the edge: Primer's dark floating shadows open with a one-pixel `#3d444d` ring, Atlassian's dark `elevation.shadow.overlay` with a one-pixel light ring at 12% opacity. The ring is decoration, not a control boundary, so WCAG's 3:1 doesn't bind it: Primer's measures 2.09:1 against its overlay.

**Decide per system whether overlays hold layered content (selected rows, nested fields, tabs); if they do, sink the overlay and let a ring carry the edge, and if they don't, lift it one step and still give it the ring.** *Weight: moderate.* Lighter-is-higher is the consensus and the toolkit's default; Primer's reversal is one system's evidence, but a documented reversal by a team that had shipped the consensus for years.

---

## Always-dark regions

A region that must stay dark in both modes (a video player, a code block, a dark hero) should be a theme scope set to dark, not a block of hard-coded colours, and in dark mode it needs an edge because the page has come down to meet it.

The hero from the opening scene was built as `background: #111; color: #fff`. In light mode a link inside it takes the light theme's link colour, Primer's `#0969da`, which measures 3.64:1 on `#111111` and fails WCAG's 4.5:1. The focus ring is the same dark blue. The block was dark; the components inside still believed they were on a light page.

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

On the dark page the player has lost its edge, and the document preview glows.

The reverse case, an always-light document preview or email body in a dark interface, needs the light theme's values inside and framing so it doesn't dominate. Carbon calls this inline theming: a `Theme` component wraps a region in another theme, such as a Gray 100 side panel on a White page, kept to "major shifts in color". The scope carries every token, so a button, link and focus ring inside are correct without a single override.

**Wrap the always-dark region in a theme scope (`data-theme="dark"` with `color-scheme: dark` on the element, a Figma frame with the Dark mode applied, Carbon's `<Theme theme="g100">`), and give it a border that only appears when the page is dark too.** That keeps the hero's link at Primer's dark `#4493f8`, 6.09:1 on `#111111`. *Weight: strong* for scoping, consensus wherever systems document it; *moderate* for the conditional border, needed because a near-black region on a near-black page measures about 1.1:1.

---

## Brand and fixed surfaces

A colour that must stay the same in both modes should be its own role family with its own on-colour, as Material's fixed roles are, never a raw hex pasted into one component.

The brand banner from the opening scene is `primaryContainer`. In Material 3's baseline that is a pale lilac (`#EADDFF`, tone 90) in light and a deep purple (`#4F378B`, tone 30) in dark, with the text flipping from `#21005D` to `#EADDFF`. That is correct adaptive behaviour, and not what a product team wants when the banner is a brand moment. Material 3 added a family for it: `primaryFixed`, `primaryFixedDim`, `onPrimaryFixed` and `onPrimaryFixedVariant` take tones 90, 80, 10 and 30 in both modes, and the same family exists for secondary and tertiary.

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

In dark the fixed banner keeps its identity, and becomes the brightest thing on the screen: `#EADDFF` on `#141218` is 14.42:1.

So a system has three kinds of colour role. Adaptive roles change per mode. Fixed roles keep one value. Inverse roles do the opposite of the theme (Carbon's `background-inverse`, Material's `inverseSurface`; see [how surfaces stack](how-surfaces-stack.md#inverse-surfaces)). Skip the role and, in an illustrative case, a promo card set to the brand hex `#6750A4` and marked "same in dark" is never checked in dark, so its 60% white secondary text and its outline button, which takes the theme's dark `outline`, are never measured against it.

**Add fixed roles as a family (`brand-fixed`, `on-brand-fixed`, `on-brand-fixed-variant`) with both modes set to the same value, and measure every pair inside them in both modes anyway.** *Weight: moderate.* Only Material documents fixed roles; the reason it transfers is mechanical: a role with an on-colour gets checked, and a raw hex doesn't. Keep fixed surfaces small in dark mode, where a light one outshines everything else.

---

## Scoped theme overrides

Every platform lets a frame, a subtree or a view take a different theme, and each one has a boundary where the override silently stops; a system stays intact when overrides are whole themes applied to a scope, never individual colours.

The always-dark hero, the always-light document and Apple's elevated sheet are the same mechanism: part of the tree resolves the same tokens to different values. Each platform spells it differently.

- **Figma.** Apply variable mode on a frame; a child on Auto takes its nearest moded ancestor's mode, else the collection default.
- **CSS.** `color-scheme: dark` on an element makes `light-dark()` values and native controls in that subtree resolve dark; a theme attribute does the same for custom properties, and Primer's attribute selectors work on any element.
- **UIKit.** `overrideUserInterfaceStyle` on a view applies to it and the subviews its view controller owns.
- **SwiftUI.** `.environment(\.colorScheme, .dark)` changes a view and its children. `.preferredColorScheme(.dark)` propagates up to the enclosing presentation and then down through all of it.

Here is one subtree, with the place it breaks on the web.

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

Inheritance follows the tree, and a portal moves the menu out of it.

| Trap | What happens | What breaks |
|---|---|---|
| Portal escape (web) | A menu, tooltip or dialog is appended to `body`, outside the themed subtree | It renders in the page's theme over a region of the other one |
| Embedded child view controller (UIKit) | Apple's documentation says its views don't inherit the override | A reused component inside a dark-only screen turns light |
| `preferredColorScheme` reaching up (SwiftUI) | Set on one view, it flows up to the enclosing sheet or window | One dark card turns a whole sheet dark |
| Auto falling through (Figma) | A component with no moded ancestor takes the collection default | A component pasted outside its frame changes mode |
| Media queries ignore scope (web) | `<picture>` sources and `@media (prefers-color-scheme)` read the person's setting, not the subtree | A dark-only region shows the light logo |

**Allow overrides only as a whole theme or mode applied to a scope, never as colours: a `data-theme` attribute (and `color-scheme`) on the region root in code, a mode on the frame in Figma, and a rule that portalled surfaces copy their trigger's theme attribute.** A team can then ask for a dark hero or a light document and get a correct one, because it gets a whole theme. *Weight: strong* for scoping by theme, consensus wherever systems document overrides; *moderate* for the portal rule, drawn from how inheritance works rather than any system's docs.

---

## Images in dark

An image doesn't follow the theme, so each one is either designed to work on both grounds or given a second asset swapped by the same switch that changes the theme.

A PNG logo with `#1A1A1A` text measures 1.09:1 on Primer's dark page `#0D1117`; a product photo shot on white becomes a lit rectangle.

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

The logo needs a second asset; the photo needs only to be toned down. Those are Apple's two remedies: separate light and dark assets where an image works in one mode only, and slightly darkening a content image with a white background.

On the web the obvious tool is `<picture>` with a `prefers-color-scheme` source, which GitHub supports even in Markdown. Its limit is the scope trap above: the media query reads the system setting. A site with its own theme toggle, or a region forced dark, needs the swap driven by the theme attribute, for example `[data-theme="dark"] .logo-light { display: none }`. An SVG drawn with `currentColor` follows its text colour and needs no second asset.

**Make icons and logos SVGs that use `currentColor` where you can; give every raster that fails on dark a dark asset swapped by your theme attribute, not by a media query; and soften white-background photos in dark mode only.** *Weight: strong* for the asset swap (Apple, GitHub and the toolkit's own rule); *moderate* for driving it from the theme attribute, which matters only for products with a toggle or scoped regions.

---

## Contrast settings

When a person turns up contrast, the dark ladder should spread its steps and lean harder on borders; when forced colours are on, every level collapses into one colour and only borders survive.

Material's colour utilities make this concrete. Each dark container's tone is a contrast curve with points for reduced, standard, medium and high contrast. At standard contrast the dark containers sit at tones 4, 10, 12, 17 and 22; at high contrast at 0, 12, 20, 25 and 30, while `surface` stays at 6.

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

The weak link at standard contrast is the two-tone gap between low and container; at high contrast it becomes eight, and the whole ladder widens from a span of 18 tones to 30.

Primer's dark high contrast theme takes the other route: page, inset and overlay are all `#010409`, and separation moves to borders, `borderColor-default` at `#b7bdc8`, 10.88:1 against the page. Forced colours go furthest: MDN lists `background-color` and `border-color` among the properties replaced with system colours and `box-shadow` forced to `none`, so every level becomes `Canvas` and a menu's border is the only thing left that outlines it. Apple asks for dark mode to be tested with Increase Contrast and Reduce Transparency, separately and together.

**Give each surface level a high-contrast value that widens the dark steps, give every floating surface a real border (not only a shadow ring) so forced colours can outline it, and check Increase Contrast and Reduce Transparency in dark mode together.** *Weight: strong.* Material, Primer and Apple reach it by different routes; which route suits a product depends on whether its surfaces carry content that needs fills or are mostly lists and code.

---

## Testing dark surfaces

Dark surfaces fail at the joins (an overlay over the level it opens on, a scoped region against the page, an image against its ground), so the tests have to list the joins, not only the tokens.

A token-by-token contrast run passes the Material menu in a dialog, Primer's dimmed overlay on its page (1.14:1), the dark player on a dark page (1.11:1) and the portalled menu, because the failure is in which token meets which. So the test plan is a list of pairs:

- **Every floating surface against every surface it can open over**, per theme: the overlay differs in fill or carries a border, and a selected row differs from the overlay.
- **Every theme and contrast level**, light, dark, any dimmed variant, each with high contrast; forced colours once, by hand.
- **Every scoped region against the page, in both modes**, and every portalled surface opened from inside one.
- **Every raster image on the darkest and lightest surface it can land on.**

Chrome DevTools' Rendering panel emulates these settings, and Playwright's `page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })` puts them into an automated run.

**Write the surface pairs down as data (overlay, opens-over, theme) and run a contrast and border check over that list on every token change, then look at forced colours by hand once per release.** *Weight: moderate.* No system publishes a check of this shape; every failure in this piece passed a per-token check.

---

## Cheat sheet

| Situation | Do | Don't |
|---|---|---|
| Writing dark surface values | Design an ascending ladder of its own, levels named by position | Invert or map the light values |
| Material 3 container roles | Check each floating role against what it opens over | Assume `surfaceContainer` sits above `surfaceContainerHigh` |
| Elevated content (sheet, dialog) | A scope that remaps surface tokens one step up | A second token set components must pick |
| Second dark theme | Only on request; own overlay decision, own contrast run | A palette tweak with no new tests |
| Overlay holds selected rows or fields | Sink it below the page, with a ring | Lift it to the top of a short ladder |
| Always-dark or always-light region | Theme scope on the root; border when page matches | Hard-coded `#111` and `#fff` |
| Colour that must not change | Fixed role family with on-colours | A raw hex in one component |
| Portalled menu or tooltip | Copy the trigger's theme attribute | Let it inherit from `body` |
| Logo or illustration | `currentColor` SVG, or dark asset swapped by theme attribute | `<picture>` alone when there's a toggle |
| High contrast and forced colours | Widen dark steps or flatten and border; a real border on every floating surface | Standard steps; shadow or ring alone |
| Tests | A list of surface pairs per theme | Per-token contrast only |

---

## The short version

In dark mode a surface further forward is lighter in every system read, but light modes disagree, so design the dark ladder on its own and name levels by position, one up from their container.

Material's named container roles beat its old computed tint, but a role is assigned per component, so a Material 3 menu is darker than the dialog it opens over. Apple's alternative is worth borrowing: one token set, shifted a step by an elevated context; on the web, a scope attribute.

Ship one dark theme unless users ask for more. Sink floating surfaces that hold layered content, as Primer did in 2025, or lift plain ones, as Atlassian does; either way a ring does the separating.

Always-dark regions take a theme scope and colours that must not change a fixed role family; overrides are whole themes on a scope, and break at a portal or a media query. Write down for your engineers the ladder per mode, where overlays sit, the fixed and inverse roles, the portal rule and the surface pairs to test. The ladder's direction is strong; the step size and the overlay's place are your decisions, and should say so.

---

## What to re-check later

Researched 12 November 2026.

- **Primer.** `@primer/primitives` 11.10.0. The dark overlay change is PR #1220 (merged 5 June 2025); the author called it a solution they were unsure of, so it may move again. Dimmed's overlay stays lighter than its page.
- **Atlassian's dark surfaces have changed.** `@atlaskit/tokens` 20.11.0 gives `elevation.surface` `#1F1F21`, sunken `#18191A`, raised `#242528`, overlay `#2B2C2F`. The toolkit's `visual.md` still quotes the older blue-tinted set (`#161A1D` to `#282E33`) and should be updated there.
- **Material.** Tones from material-color-utilities `color_spec_2021.ts`, baseline hex from Material Web's v0_192 tokens; the 2025 Expressive spec may adjust tones. The m3.material.io pages render client-side and were not read, and Compose's Material 3 overview page still describes tonal overlays; the 2023 date is Compose's 1.2.0-alpha03 release.
- **Apple's hex values** (`#1C1C1E`, `#2C2C2E`) come from the knowledge base and Apple's colour tables; the figure's grouped-list pairing is unchecked.
- **Unchecked**: Playwright's `contrast` option (left out); whether Spectrum 2 still ships a "darkest" theme. The portal and media-query traps follow from how CSS is specified, not from a system's docs.
- **Evidence quality.** Strong on what ships, weak on what works for people: no user research on dark surface steps turned up. Lighter-is-higher has two independent origins (Material 2 and Apple, both 2019, unchecked); step sizes disagree (0.08 per layer in Carbon, 0.027 in Atlassian), so the size is local judgement.

---

## Sources

**Primary: system source, tokens and release notes**

- [Material color utilities, `color_spec_2021.ts`](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts). Surface, container and fixed tones, contrast curves.
- [Material Web, `_md-sys-color.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-color.scss), [`_md-ref-palette.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-ref-palette.scss) and [latest `_md-sys-color.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-color.scss) (`surface-tint` deprecated).
- [Compose Material 3, `ColorScheme.kt`](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ColorScheme.kt). `surfaceColorAtElevation` formula.
- [Compose Material 3 release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3). SurfaceContainer roles, `LocalTonalElevationEnabled`, component moves.
- [Flutter, new ColorScheme roles](https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles). Flutter 3.22 roles, deprecations, `surfaceTintColor` default.
- [`@primer/primitives` dark theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark.css), [dark dimmed](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark-dimmed.css) and [dark high contrast](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark-high-contrast.css).
- [Primer primitives PR #1220, overlay background in dark themes](https://github.com/primer/primitives/pull/1220) and [CHANGELOG](https://github.com/primer/primitives/blob/main/CHANGELOG.md).
- [`@carbon/themes` on npm](https://www.npmjs.com/package/@carbon/themes) (11.85.0).
- [`@atlaskit/tokens` dark raw tokens](https://cdn.jsdelivr.net/npm/@atlaskit/tokens/dist/cjs/artifacts/tokens-raw/atlassian-dark.js) (20.11.0).
- [Ant Design dark theme colours](https://github.com/ant-design/ant-design/blob/master/components/theme/themes/dark/colors.ts) and [colour algorithm](https://github.com/ant-design/ant-design/blob/master/components/theme/themes/dark/colorAlgorithm.ts).

**Primary: platform and system documentation**

- [Apple Human Interface Guidelines, Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode). Base and elevated, dark-only apps, softening white images, separate assets, testing.
- [UIKit, `overrideUserInterfaceStyle`](https://developer.apple.com/documentation/uikit/uiview/overrideuserinterfacestyle), [`userInterfaceLevel`](https://developer.apple.com/documentation/uikit/uitraitcollection/userinterfacelevel) and [`accessibilityContrast`](https://developer.apple.com/documentation/uikit/uitraitcollection/accessibilitycontrast).
- [SwiftUI, `colorScheme`](https://developer.apple.com/documentation/swiftui/environmentvalues/colorscheme) and [`preferredColorScheme(_:)`](https://developer.apple.com/documentation/swiftui/view/preferredcolorscheme(_:)).
- [Carbon, colour usage](https://carbondesignsystem.com/elements/color/usage/). Layering sets, inline theming.
- [Android Developers, Material Design 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3). Tonal and shadow elevation on `Surface`.

**Standards and tools**

- [MDN, `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark). Scoping by `color-scheme`.
- [MDN, `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors). Overridden properties, `box-shadow: none`.
- [Figma help, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables). Apply variable mode, Auto inheritance.

**Commentary and research**

- [Creager and colleagues, HFES 2016](https://flatisbad.com/publications/Creager-HFES16.pdf). Shading salience in flat interfaces; the nearest research found.

**Cited but not resolved to a URL**

- GitHub's documentation on `<picture>` with `prefers-color-scheme` in Markdown: known, not opened for this piece.
- Material 3's "tone-based surfaces" page on m3.material.io: opened, but it renders client-side and returned no text.
