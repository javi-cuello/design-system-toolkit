# Yellow in colour scale generators

Why the dark half of a yellow ramp is a choice of hue rather than a fidelity problem, what shipping systems choose, and how the toolkit's OKLCH scale skill measures against them.

A designer gives a scale generator a brand yellow, #FFE629, and asks for twelve steps. The light steps look like yellow. The dark ones, the steps meant for text, come out olive in one tool and brown in another, and neither looks like the brand.

Every other hue in the palette came through fine. Nothing in the generator's settings says why this one didn't, or which of the two wrong answers is less wrong.

---

## What this answers

- [The hard hue](#the-hard-hue): why yellow is the hard hue
- [Hold or drift](#hold-or-drift): whether dark yellow holds or drifts
- [Drift onto orange](#drift-onto-orange): whether a drifted yellow can land on orange
- [Lime versus yellow](#lime-versus-yellow): whether lime is a yellow
- [Vivid brand yellows](#vivid-brand-yellows): where a vivid brand yellow lives
- [Text on yellow](#text-on-yellow): why yellow takes dark text
- [WCAG 2 on yellow](#wcag-2-on-yellow): whether WCAG 2 can judge contrast on yellow
- [Ramps or solved swatches](#ramps-or-solved-swatches): fixed ramps or contrast-solved swatches
- [Adopted so far](#adopted-so-far): what the skill has adopted so far

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## The hard hue

Saturated yellow only exists at high lightness, so the dark half of a yellow ramp has no vivid colours to choose from, and every generator has to invent something there.

Take #FFE629 (OKLCH L 0.918, C 0.184, H 100.9) and ask for it at L 0.42, the lightness of a step-10 text colour. A blue asked for the same thing comes back as a deep, vivid blue. The yellow comes back as something that isn't yellow. Every other part of building a ramp is the same for both hues; this is where they part.

The cause isn't a quirk of sRGB. The Munsell colour system, built from perceptual measurements a century before display gamuts, records that light yellows have considerably more potential chroma than light purples. Its colour solid bulges accordingly: yellow's chroma peak sits near the top of the value axis, blue's near the bottom.

Digital gamuts inherit the same shape. Google's material-color-utilities, asked for the maximum chroma at each tone for a yellow hue, says hue 102 peaks at chroma 67.7 at tone 90, and can deliver only 39.9 of a requested 64.25 by tone 40.

[Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) make the same point from the OKLCH side: at 44% lightness, only blue still has high-chroma colours on an sRGB screen. [Stripe](https://stripe.com/blog/accessible-color-systems), redesigning its palette in CIELAB, put it most plainly: "there's no such thing as 'very colorful dark yellow'".

So when a ramp darkens a yellow, something has to give, and there are only three candidates:

- **Hold the hue and let chroma collapse.** The result is olive. Olive (#808000) is literally the colour named for darkened yellow, and the Material team considered its associations strong enough to encode in code ([Lime versus yellow](#lime-versus-yellow) has the detail).
- **Rotate the hue toward orange while darkening.** The result is gold, then brown. Brown is what human vision already calls darkened orange-yellow, so the ramp reads as one warm family.
- **Refuse to darken it.** Keep yellow light wherever it appears and solve dark contexts some other way. Adobe Spectrum's static palette exists for exactly this: its stated purpose is that a lighter colour such as yellow remains a light value regardless of theme.

Here is #FFE629 taken down to L 0.42 by each of the first two strategies, and by Material's tonal palette.

| Strategy | Result at L 0.42 | Reads as |
|---|---|---|
| Hold hue at 100.9 | #584E00 | olive |
| Drift hue to 66 (the skill's step 10) | #6F4100 | brown-gold |
| Material tonal palette, tone 40 | #6A5F00 | dark olive |

The same results as swatches, beside the source:

<svg role="img" viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Four swatches. The source yellow #FFE629, then three ways to darken it to lightness 0.42: hold the hue gives olive #584E00; drift the hue to 66 gives brown-gold #6F4100; Material's tone 40 gives dark olive #6A5F00. None of the three dark swatches reads as yellow.</title>
<rect x="0" y="0" width="640" height="200" fill="#f7f6f2"/>
<rect x="20" y="24" width="135" height="100" rx="8" fill="#FFE629" stroke="#c9c6bd"/>
<text x="20" y="148" font-size="14" font-weight="600" fill="#1a1a1a">Source</text>
<text x="20" y="168" font-size="13" fill="#5a5850">#FFE629, L 0.918</text>
<rect x="175" y="24" width="135" height="100" rx="8" fill="#584E00"/>
<text x="175" y="148" font-size="14" font-weight="600" fill="#1a1a1a">Hold hue</text>
<text x="175" y="168" font-size="13" fill="#5a5850">#584E00, olive</text>
<rect x="330" y="24" width="135" height="100" rx="8" fill="#6F4100"/>
<text x="330" y="148" font-size="14" font-weight="600" fill="#1a1a1a">Drift to H 66</text>
<text x="330" y="168" font-size="13" fill="#5a5850">#6F4100, brown-gold</text>
<rect x="485" y="24" width="135" height="100" rx="8" fill="#6A5F00"/>
<text x="485" y="148" font-size="14" font-weight="600" fill="#1a1a1a">Material, tone 40</text>
<text x="485" y="168" font-size="13" fill="#5a5850">#6A5F00, dark olive</text>
</svg>

All three dark swatches are legitimate colours, and none of them is yellow. The design decision is which one the ramp should tell the reader it is.

**Treat the dark half of a yellow ramp as a choice of destination hue, not a fidelity problem a better colour space will solve.** Choose olive or gold deliberately for each hue family, and write the choice down in your palette's documentation. That framing is consensus across every system studied; the split by family, in [Lime versus yellow](#lime-versus-yellow), is where judgement enters.

---

## Hold or drift

Drift toward orange: hand-tuned systems rotate yellow into gold as it darkens, algorithmic generators hold the hue and then patch the olive it produces, and the skill drifts with landing hues inside the hand-tuners' band.

Feed #FFE629 to Material and its palette stays at one hue all the way down, going olive. Open Tailwind's yellow and it ends 48 degrees away, in orange-brown. Both teams know colour well. Which one is right?

Start with the systems that hold.

- **Material.** HCT's TonalPalette is documented as "constant in hue and chroma, but vary in tone", and measures that way: a #FFE629 palette moves from CAM16 hue 102.4 to 103.3 across the whole tone range. It goes olive purely through chroma clamping.
- **Evil Martians' Harmony** holds its yellow at exactly H 90 at every one of its eleven steps, in its own source.json.
- **Radix's custom palette generator** sets every step's hue to the input hue in its source (`color.coords[2] = source.coords[2]`).
- **USWDS's yellow-vivid** holds H 87 to 93 through the whole usable range, and only breaks to 63.7 at its final step, where chroma is already down to 0.044.

The systems that drift tuned their yellows by hand:

- **Tailwind v4's yellow**, published directly in `oklch()`, runs H 102.2 at yellow-50 to 53.8 at yellow-950, a 48-degree rotation into orange-brown. Its amber runs 95.3 to 45.6.
- **GitHub Primer's yellow** drifts its stored hue from 52.8 to 35.6 (HSLuv), ending brown.
- **Radix's hand-tuned amber** runs 98 to 54, and its yellow puts the step-11 text colour at H 77, gold.
- **Adobe Spectrum** documents the intent: an s-curve hue shift as colours lighten, citing the Bezold-Brücke effect. Its shipped yellow measures H 100 at the light end and 71 through the dark middle, curling back to 87 near black, exactly the documented s-curve.
- **Eugene Fedorenko's Accessible Palette** article states the rule as an instruction. Bright yellow gets a greenish shade as it darkens, so "to shift them a little closer to orange, I use a negative Hue compensation."

Two things make this split trustworthy rather than an echo. The first is that the drift camp arrived independently. Tailwind tunes by eye in OKLCH, Primer in HSLuv, Fedorenko in LCh, Spectrum in CAM02 and Stripe in CIELAB: five teams in five colour spaces converging on the same rotation.

The second is that the hold camp isn't really disagreeing about perception. Holding is what generators do when hue is a fixed parameter, and both major holders then compensate downstream. Harmony's held hue is 90, already the gold side of yellow, so its dark steps are gold by starting position. Material holds the hue and then ships a DislikeAnalyzer that detects the resulting dark olive and lightens it away ([Lime versus yellow](#lime-versus-yellow)).

The toolkit's OKLCH scale skill, `oklch-color-scale-system`, sits in an unusual position: it is an algorithmic generator that encodes the hand-tuners' judgement. Its `yellowDrift` rotates hue continuously toward orange in proportion to how far a step's lightness has travelled from the source, at a rate of 70, capped at 45 degrees.

So its reference yellow, #CA8A04, lands step 12 at H 49, and four vivid ramps generated during this research land their dark ends between H 45 and 87. Tailwind's landing zone is 46 to 54, Radix's text steps 54 to 77 and Spectrum's dark middle 71. The skill's destinations sit inside the shipped band.

Keep the drift for yellow and amber. **Darken yellow and amber toward gold, not olive.** It reproduces what five independently tuned production systems ship, and the skill's landing hues already match them, so this is consensus rather than a judgement call. Two exceptions follow: a yellow beside an orange, and lime.

---

## Drift onto orange

A yellow below H 96, drifted toward orange, can land its dark steps on the palette's own orange, so that pairing needs a check for each source.

A palette has an orange, #E07000, and a yellow beside it. Both darken toward the same warm browns. Drift the yellow far enough, and its text steps come out the same hue as the orange's: two ramps that read as one family at exactly the steps used for text.

Nobody in the field documents this cost. The skill's own sweep measured it: 1,620 synthetic yellow sources against a real project's orange, #E07000. A drifted yellow's steps 9 to 12 fell within 3° of the orange ramp's for roughly half of sources at H 72 to 84, for 22% at H 90, and for none from H 96 up.

No global drift rate fixes it. Even a rate of 20, too flat to keep yellow out of the olive zone, leaves 10.6% of sources colliding. The answer has to be per source.

The skill's answer is a check. `--collide-with` takes the orange, reports the colliding steps and the highest tail rate that clears them, and `--tail-rate` applies that rate to steps 9 to 12 only. This is the toolkit's own measurement, and the first evidence here that the drift needs a guard where two warm ramps sit side by side.

Check every yellow below H 96 against your palette's orange: give the orange to `--collide-with`, then apply the tail rate it reports with `--tail-rate`. **Where two warm ramps share a palette, check the yellow's dark steps against the orange's for each source; no single drift rate makes the check unnecessary.**

---

## Lime versus yellow

Lime is not a yellow: it holds its hue as it darkens, and yellow's drift toward orange, applied to lime, lands its dark steps in the zone Google's code flags as disliked.

Take lime #AACF24, which enters the skill at H 122. Before the skill's version 1.4.0, the yellow drift pulled its dark steps down through the nineties. Steps 8 to 11 measured H 107.4, 102.5, 95.5 and 91.3, with step 12 at 87.1. A green-yellow had turned golden olive by the time it reached text.

Three independent lines of evidence say that's wrong for lime.

**Radix ships a held-hue lime.** Converting the twelve light-mode lime hexes from the [radix-ui/colors source](https://raw.githubusercontent.com/radix-ui/colors/main/src/light.ts), hue stays between 119 and 129 across the entire scale, the dark text steps included: lime11 #5c7c2f at H 129, lime12 #37401c at H 121. The same team drifts its amber to H 54. One hand-tuning culture making opposite choices for two hues is the strongest kind of evidence that the choice is about the hue, not the house style.

**Material's DislikeAnalyzer names the failure zone.** material-color-utilities ships a module whose docstring defines disliked as "a dark yellow-green that is not neutral": CAM16 hue 90 to 111, chroma above 16, tone below 65. Its documented rationale cites universal distaste in colour-preference research.

The library doesn't only warn. `fixIfDisliked` raises the tone to 70, and scheme generation applies it, so a tertiaryContainer "should not be disliked."

**The skill's lime landed inside that zone.** Its old steps 8 to 11, at H 107.4 down to 91.3, all sit inside the 90-to-111 band, with step 12 just past it. Held at the source hue, those steps would sit at H 122, above the band, matching what Radix ships.

> **Aside.** Material's band is in CAM16 hue and the skill's numbers are OKLCH hues. In this region the two agree closely (#FFE629 measures 102.4 in CAM16 and 100.9 in OKLCH), so the placement is approximate by a degree or two, not by tens.

How far apart are the two answers in practice? Here are steps 9 to 12 of the #AACF24 ramp three ways: the skill before 1.4.0, a fully held hue computed in August 2026, and what the skill generates today (2.3.0, free mode, default flags).

| Step | Skill before 1.4.0 (full drift) | Held hue (H 122) | Skill 2.3.0 |
|---|---|---|---|
| 9 | #756B00 (H 102) | #5D7310 | #617200 (H 119) |
| 10 | #5C4C00 (H 96) | #435500 | #475200 (H 118) |
| 11 | #4C3B00 (H 91) | #354400 | #394100 (H 118) |
| 12 | #3B2B00 (H 87) | #273400 | #2B3100 (H 117) |

As swatches, one row per column of the table:

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Steps 9 to 12 of the lime #AACF24 ramp, three ways. Top row, the skill before 1.4.0 with full drift: #756B00, #5C4C00, #4C3B00, #3B2B00, golden olive turning brown. Middle row, a fully held hue at 122: #5D7310, #435500, #354400, #273400, mossy green. Bottom row, the skill 2.3.0: #617200, #475200, #394100, #2B3100, mossy green close to the held row.</title>
<rect x="0" y="0" width="640" height="250" fill="#f7f6f2"/>
<text x="20" y="22" font-size="13" fill="#5a5850">Step</text>
<text x="230" y="22" font-size="13" fill="#5a5850" text-anchor="middle">9</text>
<text x="330" y="22" font-size="13" fill="#5a5850" text-anchor="middle">10</text>
<text x="430" y="22" font-size="13" fill="#5a5850" text-anchor="middle">11</text>
<text x="530" y="22" font-size="13" fill="#5a5850" text-anchor="middle">12</text>
<text x="20" y="62" font-size="14" font-weight="600" fill="#1a1a1a">Before 1.4.0</text>
<text x="20" y="80" font-size="12" fill="#5a5850">full drift</text>
<rect x="185" y="34" width="90" height="56" rx="6" fill="#756B00"/>
<rect x="285" y="34" width="90" height="56" rx="6" fill="#5C4C00"/>
<rect x="385" y="34" width="90" height="56" rx="6" fill="#4C3B00"/>
<rect x="485" y="34" width="90" height="56" rx="6" fill="#3B2B00"/>
<text x="20" y="132" font-size="14" font-weight="600" fill="#1a1a1a">Held hue</text>
<text x="20" y="150" font-size="12" fill="#5a5850">H 122</text>
<rect x="185" y="104" width="90" height="56" rx="6" fill="#5D7310"/>
<rect x="285" y="104" width="90" height="56" rx="6" fill="#435500"/>
<rect x="385" y="104" width="90" height="56" rx="6" fill="#354400"/>
<rect x="485" y="104" width="90" height="56" rx="6" fill="#273400"/>
<text x="20" y="202" font-size="14" font-weight="600" fill="#1a1a1a">Skill 2.3.0</text>
<text x="20" y="220" font-size="12" fill="#5a5850">free mode</text>
<rect x="185" y="174" width="90" height="56" rx="6" fill="#617200"/>
<rect x="285" y="174" width="90" height="56" rx="6" fill="#475200"/>
<rect x="385" y="174" width="90" height="56" rx="6" fill="#394100"/>
<rect x="485" y="174" width="90" height="56" rx="6" fill="#2B3100"/>
</svg>

The top row is golden olive drifting toward the disliked zone; the other two are mossy green-olive, the Radix direction. None of them is vivid, because [nothing dark and yellow-green can be](#the-hard-hue), but they are different colours with different family identities.

The skill keeps a residual 15% of the drift at H 122, because its fade is linear between H 105 and 125. Its dark steps therefore sit about 4° below the source hue, still well above the disliked band.

> **Aside.** Step 10's hex in the skill's column differs slightly from the held-hue column because text steps have been luminance-targeted by default since the skill's 2.0.0.

The shipped evidence is unanimous about which colour production systems choose for lime. No counter-example was found: no studied system rotates a lime toward orange as it darkens.

The mechanism behind the fix starts with family detection. The skill puts H 70 to 130 into one yellow family with one drift rule. Material's own `isYellow` band is 105 to 125, and the evidence splits inside the skill's band: drift below roughly 105 (yellow, amber, gold), hold above it (lime, chartreuse).

A drift factor that scales down linearly from full strength at H 105 to zero at H 125 reproduces both behaviours from one rule. It leaves every existing yellow and amber ramp untouched, since those sources sit at H 76 to 101.

That is what the skill's 1.4.0 release (11 August 2026) does: it scales the yellow-family drift by source hue, full strength at H 105 or below and fading linearly to zero at H 125 (`yellowHueScale()` in `generate.js`). A 3,000-case fuzz run showed that only yellow-family sources above H 105 changed, so every existing yellow and amber ramp stayed byte-identical. The lime test set recovers 28 of 28 in the skill's parameter-recovery tool.

Hold lime's hue as it darkens; in the skill this is now the default, with nothing to set. **Give lime its own rule: it holds its hue where yellow drifts.** The direction is consensus (Radix's shipped lime, Material's disliked zone, and the absence of any counter-example). The band edges and the linear fade are a judgement, now the skill's tested rule. One guard is still missing, a warning for the disliked zone, covered in [what the skill has adopted](#adopted-so-far).

---

## Vivid brand yellows

The field offers three answers: reproduce the brand yellow at the step that matches its lightness, reproduce it at the solid slot whatever its lightness, or treat it as inspiration and reproduce nothing; the skill's anchored mode gives the strictest guarantee.

#FFE629 is vivid and very light, at L 0.918. In a ramp ordered by lightness, that lightness belongs at step 4, a background slot. But solid accents are picked from step 9. The brand colour can't be in both places, and each generator decides differently which place wins.

Here are the answers, from the strongest guarantee to none.

**Verbatim at the lightness-matched step (the skill's anchored mode).** #FFE629 has L 0.918, so it anchors at step 4 and reproduces exactly. The ramp's lightness ordering is preserved: backgrounds stay ordered from step 1 down.

The cost is that step 4, a background slot, now holds the most saturated colour in the ramp. The skill's cap taper softened the approach to it: the adjacent-step deltas around the anchor went from 0.040/0.089 to 0.060/0.066, nearly uniform. But the anchor remains the vivid peak, because verbatim requires it to be.

**Verbatim at the solid slot, whatever its lightness (Radix's custom palette generator).** The [generator's source](https://github.com/radix-ui/website/blob/main/components/generate-radix-colors.tsx) assigns the input colour directly to step 9 (`accentScaleColors[8] = accent9Colour`), whatever its lightness.

Radix's hand-tuned scales embed the same philosophy. Radix yellow descends to L 0.77 at step 8, then jumps back up to 0.92 at step 9, because step 9 is #FFE629 itself. The scale is openly non-monotonic in lightness.

Users noticed. An early issue filed the bright scales' steps 9 and 10 as a bug for being lighter than 7 and 8. The answer was that it's by design: step 9 means the pure colour, not the ninth-lightest colour. The cost is the reversed ordering and the confusion it caused; the benefit is that backgrounds 1 to 5 stay quiet and the vivid colour sits where solid accents are picked from.

**Approximate pass-through (Leonardo).** Key colours define the interpolation path, but swatches are placed by target contrast ratio, so the output only passes near a key colour. Two open feature requests, [#149](https://github.com/adobe/leonardo/issues/149) and [#204](https://github.com/adobe/leonardo/issues/204), ask for verbatim inclusion. The creator's answer is that returning the key colour exactly "would lose the ability to specify contrast for the color."

The documented workaround is to measure the brand colour's actual ratio against the background and add that number to the ratios array. That lands a swatch at the brand colour's contrast: close to the brand colour, but not exactly it.

**Inspiration only (Material).** [Flutter's `ColorScheme.fromSeed`](https://api.flutter.dev/flutter/material/ColorScheme/ColorScheme.fromSeed.html) is documented with the plain warning that the seed "may not wind up" among the resulting colours. A #FFE629 seed produces T90 #FDE426 as its nearest tonal neighbour, and a light-scheme primary of #6A5F00, a dark olive that shares only ancestry with the brand colour.

Issues asking why ([#98658](https://github.com/flutter/flutter/issues/98658), [#77](https://github.com/material-foundation/material-color-utilities/issues/77)) are closed as working as intended, with the fidelity scheme variant offered as a partial remedy. A commenter in #77 notes the scheme "rarely works for yellow brand colors."

Every system that guarantees less than the skill does so to protect a different invariant: contrast placement for Leonardo, tonal role arithmetic for Material, quiet backgrounds for the skill's own free mode. There is no free verbatim. The choice is which invariant bends.

A Radix-style option, pinning a vivid yellow at step 9 and accepting non-monotonic lightness, was open to the skill. It took a different route in 1.5.0, after a real palette accumulated five anchored ramps that had no brand mandate. They had been anchored only to put a light hue's vividness where it lives.

`--peak N` moves only the chroma curve's peak to step N. Every step's lightness stays on the shared grid, and nothing is promised verbatim. The skill's decision table now reads:

- a brand hex that must appear verbatim takes anchored mode;
- a naturally light hue (yellow, amber, lime, orange, cyan) with no verbatim requirement takes `free --peak N` at the hue's vivid step, and is never anchored.

That splits two questions that are easy to run together: "must this exact hex appear?" and "where does this hue's vividness live?". Lightness order is never broken, so the Radix trade (step 9 means the pure colour, not the ninth-lightest) isn't adopted.

Keep anchored mode for a brand colour that must appear exactly; its verbatim guarantee is the strongest in the field. For a palette yellow with no brand mandate, generate in free mode with `--peak` set to the hue's vivid step, rather than anchoring it. **Ask the two questions separately: must this exact hex appear, and where does this hue's vividness live?** The trade-off space is consensus; the split into two contracts is the skill's own tested rule, and it answers the "the anchor feels inserted" complaint for non-brand ramps without reversing lightness. A brand yellow that must sit at step 9 as a solid is the one case only Radix's placement serves, and the skill doesn't offer it.

---

## Text on yellow

Yellow takes dark text: every system studied puts dark text on yellow solids, and the skill's measured recommendation agrees.

A yellow button at step 9 needs a label. White text on a light, vivid yellow is the obvious brand move, and the one every system studied rules out.

[Radix documents](https://raw.githubusercontent.com/radix-ui/website/main/data/colors/docs/palette-composition/understanding-the-scale.mdx) that Sky, Mint, Lime, Yellow and Amber "are designed for dark foreground text" at steps 9 and 10. Spectrum's usage documentation lists yellow, orange, chartreuse and cyan as colours that "must be used with black text", and its static palette assigns black text to backgrounds 100 to 800.

Radix's custom generator automates the same rule. Step 9's text colour flips from white to a dark, step-9-hued colour whenever APCA contrast falls below Lc 40.

The skill computes this rather than remembering it. Its `solidForeground` field measures both candidate foregrounds against the actual solid hex, and it recommended dark text for all four vivid ramps generated during this research. On the rule itself, everyone agrees.

Put dark, warm, near-black text on your yellow solids, and let the skill's `solidForeground` confirm it for each ramp rather than assuming. **On a yellow solid, dark text is the rule across every system studied.**

---

## WCAG 2 on yellow

WCAG 2 is unreliable here, by Radix's account: Radix designs its yellow steps against APCA instead, and the skill now reports both, keeping WCAG 2 as the gate.

Radix documented a 4.5:1 ratio for step 11 text on a step 3 background. [An issue](https://github.com/radix-ui/colors/issues/41) measured it failing for yellow, amber and orange: 4.33, 4.44 and 4.13.

The maintainer's response wasn't to fix the values but to reject the meter: WCAG 2 ratios "are not good at predicting the contrast of yellow and orange hues". The scales are designed against APCA, whose model of perceived contrast handles high-luminance hues better.

That matches the skill's own documented experience, where yellow has been the standing exception to cross-scale contrast claims.

Until 1.4.0 the skill's position was lopsided. It gated its AAA warnings on WCAG 2, correctly, since WCAG 2 is the normative standard audits use. It emitted APCA Lc at the text steps. But it computed its `solidForeground` recommendation from WCAG 2 ratios alone, the one instrument the field's yellow specialists say misjudges these hues.

Comparing two candidates against the same solid partially cancelled the formula's bias. The cancellation was luck, not design.

Version 1.4.0 made it a dual report. `recommend` stays WCAG 2-derived and primary, and `apcaRecommend`, with signed `apcaVsWhite` and `apcaVsDarkText` values, sits beside it. For the lime ramp from [Lime versus yellow](#lime-versus-yellow), both say light text on step 9 (WCAG 5.36 against 2.54; APCA Lc −81.9 against 21.5), so the two agree there. The skill's APCA implementation is validated against the published `#888888`-on-white check value of 63.06.

Report APCA beside WCAG 2 for the text on a yellow solid, and keep WCAG 2 as the gate, since that is what compliance means. **When the two disagree about a yellow, read the APCA verdict.** Dark-on-yellow is consensus; making APCA the deciding metric, as Radix does, is a judgement the skill hasn't taken.

---

## Ramps or solved swatches

Three architectures ship, and the skill already spans the first two and borrows from the third where it matters, so no structural change is warranted.

A generator can promise that each hue keeps its character, or that every step passes contrast against the next, everywhere. Yellow is where the two promises pull hardest against each other: a solver that needs Lc 75 from a yellow has nowhere to go but brown or olive.

**Fixed lightness ramps** assign each step a lightness and let contrast be a measured consequence. The skill's fixed L tables with a measured `contrastWarning` are this, as are Radix's and Tailwind's hand-tuned steps; Spectrum's too.

**Tone arithmetic** makes contrast a theorem. Material documents that a tone difference of 40 guarantees 3.0:1 and 50 guarantees 4.5:1. USWDS's grade system does the same with its magic numbers (40+ for AA Large, 50+ for AA, 70+ for AAA), so "grade 50 passes against white and black" is a property of the number, not a measurement.

**Contrast-targeted generation** inverts the flow. Leonardo takes target ratios, including negative ratios for outputs lighter than the background, and solves for the colours. Harmony's published yellow carries an APCA value per step, with mirrored light and dark contrast pairs.

The trade-off is between guarantees and identity. Tone arithmetic and ratio solving make contrast bulletproof across every hue at once, and pay for it in hue fidelity, which is exactly where yellow suffers. Fixed ramps preserve each hue's character and pay in per-hue verification, which is why yellow was the skill's documented contrast exception.

The skill holds a hybrid position: fixed ramps for identity, measured warnings for honesty, and text steps whose lightness is solved per hue to hit the achromatic luminance targets. That last part is the Material and USWDS idea, applied only to the three steps where contrast is normative.

Luminance targeting was opt-in until it became the default in 2.0.0 (25 September 2026). That resolved the skill's documented yellow exception: text-on-background pairings now read alike for yellow and every other hue. `--oklch-text` reproduces a pre-2.0 ramp.

Leonardo's remaining distinctive ideas, deriving a whole theme from a background lightness knob and choosing swatch counts by ratio, solve a theming product's problem rather than a scale generator's.

Keep the hybrid if you generate scales for a Figma-first token workflow, where step identity is load-bearing. **Fixed ramps, measured warnings and luminance-targeted text steps together cover what each pure architecture gives up.** This is consensus by triangulation: each pure architecture's owners have documented the costs the hybrid avoids.

---

## Adopted so far

The lime hold, APCA beside WCAG 2, luminance-targeted text steps and a yellow-against-orange check have landed, vivid placement went another way through `--peak`, and one guard is open: a warning for the disliked dark yellow-green band.

The comparison above points to six changes to the skill. Here is where each stands in version 2.3.0.

| Change | Status in 2.3.0 | Where |
|---|---|---|
| Hue-scaled drift so lime holds | landed, 1.4.0 | [Lime versus yellow](#lime-versus-yellow); `yellowHueScale()` |
| APCA in `solidForeground` | landed as a dual report, WCAG 2 primary, 1.4.0 | [WCAG 2 on yellow](#wcag-2-on-yellow) |
| Bright-solid placement at step 9 | not adopted; `--peak N` in free mode answers the non-brand case, 1.5.0 | [Vivid brand yellows](#vivid-brand-yellows) |
| Luminance-targeted text steps | default since 2.0.0 (was opt-in) | [Ramps or solved swatches](#ramps-or-solved-swatches) |
| Warning for dark steps in H 90 to 111 at meaningful chroma | open; the band is cited in a code comment only | [Lime versus yellow](#lime-versus-yellow) |
| Yellow landing on the palette's orange | per-source check, `--collide-with` and `--tail-rate`, 2.2.0 and 2.3.0 | [Drift onto orange](#drift-onto-orange) |

Some of the skill's choices should stay as they are, on the evidence:

- **The yellow and amber drift itself.** Five independent systems converge on it, and the skill's landing hues sit inside the shipped band ([Hold or drift](#hold-or-drift)).
- **The verbatim anchor guarantee.** It's the strongest in the field; every alternative weakens the contract to protect a different invariant ([Vivid brand yellows](#vivid-brand-yellows)).
- **The background chroma cap and its taper.** No studied generator has an equivalent mechanism to compare against; the closest analogue is that every fixed ramp keeps light-step chroma low by hand. The taper's measured effect (near-uniform deltas into the anchor) stands on the skill's own regression evidence.
- **The fixed-lightness architecture with measured warnings** ([Ramps or solved swatches](#ramps-or-solved-swatches)).
- **sRGB-only scope.** Radix and Harmony ship P3 variants and mark them; the skill documents sRGB as a boundary. Revisit it only when the Figma-to-CSS pipeline this skill feeds asks for P3 output, because gamut expansion changes every pinned value.

If you maintain the skill, add the disliked-zone warning next: when any generated ramp's dark steps land in H 90 to 111 at meaningful chroma, say so. It's cheap, backed by shipped code at Google, and would have caught the lime case before a reader did. **With the lime hold in place, the warning becomes the guard that keeps the zone empty for future sources.** Everything else in the table is done or deliberately left.

---

## Cheat sheet

| Situation | What the field ships, or the skill does | Source of record |
|---|---|---|
| Dark end of a yellow or amber ramp | Drift hue into gold/brown, landing H ≈ 45-77 | Tailwind theme.css, Radix amber, Spectrum tokens, Primer primitives |
| Yellow below H 96 beside an orange ramp | Check steps 9-12 for a collision; lower the tail rate if they meet | skill `--collide-with`, `--tail-rate` (toolkit's own sweep) |
| Dark end of a lime ramp | Hold hue ≈ 117-129, mossy olive | Radix lime source; skill 1.4.0 `yellowHueScale()` |
| Vivid yellow as solid/accent | Dark (near-black warm) foreground text | Radix scale docs; Spectrum using-color; skill's solidForeground |
| Contrast measurement for yellows | APCA beside WCAG 2; WCAG 2 known to mispredict | Radix issue #41; skill's `apcaRecommend` |
| Brand yellow must appear exactly | Only lightness-matched (skill anchored) or slot-9 (Radix generator) placement guarantees it | generate-radix-colors.tsx; skill's anchor guard |
| Palette yellow, no brand mandate | Place the chroma peak at its vivid step, never anchor | skill `free --peak N` |
| Brand yellow through Material | Expect it to vanish; T40 primary of #FFE629 is #6A5F00 | Flutter fromSeed docs, issues #98658/#77 |
| Very light yellows (step 1-2 zone) | Held hue, tiny chroma; Material special-cases T99 for yellow | material-color-utilities commit 998b611d |
| "Is this dark yellow-green safe?" | Avoid H 90-111 at C > 16 (CAM16), tone < 65 | DislikeAnalyzer source |

---

## The short version

Yellow is the hue where colour geometry runs out. Saturated yellow exists only light, a fact as old as the Munsell solid, so the dark half of every yellow ramp is an invention, and your real decision is which hue that invention is told to be. The industry has quietly agreed. Hand-tuned systems (Tailwind, Primer, Radix's amber, Spectrum, Stripe) rotate yellow toward orange as it darkens, ending in gold and brown. Algorithmic generators (Material HCT, Harmony, Radix's custom tool) hold the hue and then patch the olive that results, most vividly in Google's DislikeAnalyzer, which detects dark yellow-green and lightens it away. The toolkit's OKLCH skill drifts like the hand-tuners, and its landing hues match theirs. The drift's one cost, measured by the skill itself, is that a yellow below H 96 can land on your palette's orange, so check that pairing for each source.

Lime is not a yellow. Radix holds lime's hue all the way down, Google's code marks the zone a drifted lime lands in as disliked, and no system rotates lime toward orange. The skill corrected this in 1.4.0 by fading its drift to zero between H 105 and 125, leaving every yellow and amber ramp untouched.

Put dark text on yellow solids; that's universal. Radix designs those steps with APCA because WCAG 2 mispredicts yellow, and the skill now reports both, with WCAG 2 as the gate. If a brand yellow must appear exactly, anchored mode's verbatim guarantee is stronger than Material or Leonardo offer; a palette yellow without that mandate takes `--peak`, which places its vividness without breaking lightness order. The one guard still missing is a warning when dark steps land in the disliked yellow-green band. The drift direction, the dark-text rule and the lime hold are consensus; the band edges, the dual APCA report and the peak-versus-anchor split are the skill's calls.

---

## What to re-check later

Researched August 2026, revised November 2026.

- **How claims were checked.** Claims about each system were verified against its own shipped values (token source files fetched from the repos, then converted to OKLCH locally), its documentation, or its generator source code; commentary by tool creators is labelled as commentary. Where a hue number describes another system's ramp, it was computed locally from that system's published hex values.
- **This guide's own history.** The August 2026 version recommended the hue-scaled lime hold, APCA in `solidForeground`, a Radix-style option to pin a vivid yellow at step 9, luminance-targeted text steps, and a disliked-zone warning. The skill adopted three of them in versions 1.4.0 to 2.0.0, answered placement with `--peak` instead, and added the yellow-against-orange collision check after that first version; the lime values were regenerated with 2.3.0 in November.
- **Tailwind and Spectrum token values** move with releases. Re-checked in November 2026: Tailwind's yellow and amber `oklch()` values on main are unchanged; Spectrum's yellow in `@adobe/spectrum-tokens` 15.6.0 (August used 14.15.0) was re-converted and still traces the same s-curve (H 99.9 at 100, 71.2 at 1000, 86.6 at 1600).
- **Radix's lime11 and lime12** were unchanged when re-checked in November 2026.
- **material-color-utilities** was fetched at the ColorSpec2025 era; the npm 0.4.0 ESM build was broken during research (imports without file extensions), so library measurements ran on 0.2.7. Yellow special-cases are being actively edited (commits 998b611d, 1a34bd2d); re-read before citing specifics. Not re-checked in November.
- **Leonardo** added OKLCH/OKLAB interpolation ahead of its README; the README listed seven spaces while the type definitions listed ten. Trust the types. Not re-checked in November.
- **The CAM16/OKLCH hue comparison** in [Lime versus yellow](#lime-versus-yellow) is approximate; the bands agree within a couple of degrees in the yellow-green region (calibrated on #FFE629: 102.4 CAM16 vs 100.9 OKLCH) but were not verified across the whole band.
- **Spectrum documentation quotes** come from a scraped mirror of the Spectrum 1 public docs, because spectrum.adobe.com renders only via JavaScript; the canonical pages should be re-fetched if quoted anywhere normative.
- **Single-source claims:** the Accessible Palette hue-compensation quote rests on one article (its mirror returned HTTP 500 during research); the Radix "designed with APCA" position rests on one maintainer comment, though it is consistent with the generator's Lc-40 switch in code.
- **The skill's state** is quoted from version 2.3.0 (1 November 2026). Its CHANGELOG is the record; re-read it before citing which changes are open.

---

## Sources

**Primary**

- [material-color-utilities: hct.ts](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/hct/hct.ts) (HCT definition, isYellow band, chroma docstring)
- [material-color-utilities: tonal_palette.ts](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/palettes/tonal_palette.ts) (constant hue/chroma, T99 yellow workaround, KeyColor solver)
- [material-color-utilities: core_palette.ts](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/palettes/core_palette.ts) (seed-to-palette chroma floors)
- [material-color-utilities: dislike_analyzer.ts](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/dislike/dislike_analyzer.ts) (disliked dark yellow-green definition and fix)
- [material-color-utilities: color_spec_2025.ts](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/dynamiccolor/color_spec_2025.ts) (yellow special-casing in the 2025 spec)
- [material-color-utilities: concepts/color_spaces.md](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/concepts/color_spaces.md) and [color_terms.md](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/concepts/color_terms.md) (CAM16 rationale, tone-contrast arithmetic, per-hue max chroma)
- [material-color-utilities: concepts/scheme_generation.md](https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/concepts/scheme_generation.md) (fidelity behaviors, dislike application)
- [Flutter ColorScheme.fromSeed API doc](https://api.flutter.dev/flutter/material/ColorScheme/ColorScheme.fromSeed.html) (seed may not appear)
- [flutter/flutter #98658](https://github.com/flutter/flutter/issues/98658) and [material-color-utilities #77](https://github.com/material-foundation/material-color-utilities/issues/77), [#40](https://github.com/material-foundation/material-color-utilities/issues/40), [#125](https://github.com/material-foundation/material-color-utilities/issues/125) (seed-not-in-palette threads)
- [@material/material-color-utilities on npm](https://www.npmjs.com/package/@material/material-color-utilities) (library executed locally for tonal palette and max-chroma measurements)
- [adobe/leonardo: API reference](https://raw.githubusercontent.com/adobe/leonardo/main/skills/leonardo-colors/references/api.md) (Color/Theme/BackgroundColor, colorspace enum, wcag3 formula, createScale)
- [adobe/leonardo: contrast-colors README](https://raw.githubusercontent.com/adobe/leonardo/main/packages/contrast-colors/README.md) and [CHANGELOG](https://raw.githubusercontent.com/adobe/leonardo/main/packages/contrast-colors/CHANGELOG.md) (smooth option, APCA since 1.0.0-alpha.14)
- [adobe/leonardo #149](https://github.com/adobe/leonardo/issues/149) and [#204](https://github.com/adobe/leonardo/issues/204) (key colours not verbatim; maintainer rationale)
- [Adobe Design: Reinventing Adobe Spectrum's colours](https://adobe.design/stories/design-for-scale/reinventing-adobe-spectrum-s-colors) (key-color interpolation, s-curve hue shift, yellow identifiability)
- [adobe/spectrum-design-data color-palette.json](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/color-palette.json) (shipped yellow 100-1600 values, v14.15.0 in August, re-converted from 15.6.0 in November)
- [radix-ui/colors src/light.ts](https://raw.githubusercontent.com/radix-ui/colors/main/src/light.ts) (yellow/amber/lime hexes, converted locally)
- [radix-ui/website understanding-the-scale.mdx](https://raw.githubusercontent.com/radix-ui/website/main/data/colors/docs/palette-composition/understanding-the-scale.mdx) (bright-five dark-foreground note)
- [radix-ui/website generate-radix-colors.tsx](https://github.com/radix-ui/website/blob/main/components/generate-radix-colors.tsx) (custom generator: verbatim step 9, constant hue, APCA Lc-40 text switch)
- [radix-ui/colors #41](https://github.com/radix-ui/colors/issues/41), [#42](https://github.com/radix-ui/colors/issues/42), [#12](https://github.com/radix-ui/colors/issues/12), [#8](https://github.com/radix-ui/colors/issues/8) (WCAG-vs-APCA position, measured misses, non-monotonic confusion)
- [tailwindcss theme.css](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/packages/tailwindcss/theme.css) (yellow/amber oklch values verbatim)
- [primer/primitives light.json5](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/color/light/light.json5) (shipped yellow scale)
- [primer/prism README](https://github.com/primer/prism/blob/main/README.md) (tool status, prior art)
- [GitHub blog: Accelerating GitHub theme creation with colour tooling](https://github.blog/news-insights/product-news/accelerating-github-theme-creation-with-color-tooling/) (Prism mechanics, HSLuv)
- [USWDS design tokens: colour overview](https://designsystem.digital.gov/design-tokens/color/overview/) and [system tokens](https://designsystem.digital.gov/design-tokens/color/system-tokens/) (grades, magic numbers, yellow ramp values)
- [Stripe: Designing accessible colour systems](https://stripe.com/blog/accessible-color-systems) (CIELAB approach, no-dark-yellow statement)
- [evilmartians/harmony source.json via GitHub API](https://github.com/evilmartians/harmony) (held H 90 yellow, per-step APCA)
- [Evil Martians: OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) (gamut asymmetry examples)
- [ardov/huetone README](https://github.com/ardov/huetone) (APCA support; no yellow-specific handling documented)
- [Wikipedia: Munsell colour system](https://en.wikipedia.org/wiki/Munsell_color_system) (light-yellow chroma asymmetry) and [Olive (colour)](https://en.wikipedia.org/wiki/Olive_(color)) (olive as darkened yellow)
- [W3C public-css-archive: HCT summary](https://lists.w3.org/Archives/Public/public-css-archive/2022Jun/0306.html) (Lilley on O'Leary's HCT)

**Commentary**

- [Nate Baldwin: Adaptive colour in Spectrum](https://medium.com/thinking-design/adaptive-color-in-spectrum-adobes-design-system-feeeec89a2c7) (creator; "a dark yellow is no longer yellow")
- [Nate Baldwin: Colorimetry and the cartography of colour](https://medium.com/thinking-design/colorimetry-and-the-cartography-of-color-415ef5315c0a) (creator; hue paths per space)
- [Nate Baldwin: Accessible colour for design systems](https://medium.com/@NateBaldwin/accessible-color-for-design-systems-just-got-easier-40e8420a8371) and [Creating contrast-based themes with Leonardo](https://uxdesign.cc/creating-contrast-based-themes-with-leonardo-32b6219a090f) (creator; key-color mechanics, two-key yellow example)
- [Nate Baldwin: Colour scales for data visualization in Leonardo](https://medium.com/@NateBaldwin/color-scales-for-data-visualization-in-leonardo-bf206feb61b9) (creator; smoothing)
- [Eugene Fedorenko / Wildbit: Accessible Palette, stop using HSL](https://www.wildbit.com/blog/accessible-palette-stop-using-hsl-for-color-systems) (negative hue compensation for yellows; mirror at efedorenko.com returned HTTP 500 during research)

**Toolkit**

- `skills/oklch-color-scale-system/SKILL.md` and `CHANGELOG.md`, version 2.3.0. The lime hold, the dual contrast report, `--peak`, luminance-targeted text steps, and the yellow-against-orange collision sweep (the toolkit's own measurement). The lime values in [Lime versus yellow](#lime-versus-yellow) were generated with its `scripts/generate.js` in November 2026.

**Cited but not resolved to a URL**

- Material Design blog, "The science of colour & design" (m3.material.io/blog/science-of-color-design): page is JavaScript-rendered and archive mirrors were unreachable; its specific hue-linearity claims are not asserted in this guide.
- Synthese (Springer, 2022) paper discussing brown as darkened yellow/orange: behind a redirect wall; the Munsell, olive and Stripe citations carry the claim instead.
