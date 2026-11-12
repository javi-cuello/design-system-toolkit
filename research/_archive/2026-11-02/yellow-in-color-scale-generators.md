# Yellow in color scale generators

How Material, Leonardo, Radix, Tailwind, Spectrum and the contrast-first tools handle yellow and yellow-adjacent hues, measured against this toolkit's OKLCH scale skill, with a verdict on what the skill should adopt.

Researched August 2026. Claims about each system were verified against its own shipped values (token source files fetched from the repos, then converted to OKLCH locally), its documentation, or its generator source code; commentary by tool creators is labelled as commentary. Where a hue number describes another system's ramp, it was computed locally from that system's published hex values and is marked as such.

---

## What this answers

- Why yellow breaks scale generators that handle every other hue fine
- What dark yellow should become: olive, gold, or nothing, and what shipping systems chose
- Whether lime belongs in the yellow family, and what that means for the skill's hue drift
- Where a vivid brand yellow should live in a 12-step scale, and what each generator guarantees about reproducing it
- Why every system puts dark text on yellow solids, and whether WCAG 2 can be trusted to say so
- Which of these systems' techniques the skill should adopt, and which of its own choices are already ahead of the field

The cheat sheet is section 8, and section 9 is a standalone short version.

---

## 1. Why is yellow the hard hue for a scale generator?

**The short answer.** Saturated yellow only exists at high lightness. Every other part of building a ramp is the same for yellow as for blue; the dark half is where yellow has no good options, because the colors a generator would like to put there are physically outside the gamut.

The geometry is not a quirk of sRGB. The Munsell color system, built from perceptual measurements a century before display gamuts, records that light yellows have considerably more potential chroma than light purples, and its color solid bulges accordingly: yellow's chroma peak sits near the top of the value axis, blue's near the bottom. Digital gamuts inherit the same shape. Google's material-color-utilities, asked for the maximum chroma available at each tone for a yellow hue, answers that hue 102 peaks at chroma 67.7 at tone 90, and can deliver only 39.9 of a requested 64.25 by tone 40. Evil Martians make the same point from the OKLCH side: at 44% lightness, only blue still has high-chroma colors on an sRGB screen. Stripe, redesigning their palette in CIELAB, put it most plainly: "there's no such thing as 'very colorful dark yellow'".

So when a ramp darkens a yellow, something has to give, and there are only three candidates:

- **Hold the hue and let chroma collapse.** The result is olive. Olive (#808000) is literally the color named for darkened yellow, and it drags associations the Material team considered strong enough to encode in code (section 3).
- **Rotate the hue toward orange while darkening.** The result is gold, then brown. Brown is what human vision already calls darkened orange-yellow, so the ramp reads as one warm family.
- **Refuse to darken it.** Keep yellow light wherever it appears and solve dark contexts some other way. Adobe Spectrum's static palette exists for exactly this: its stated purpose is that a lighter color such as yellow remains a light value regardless of theme.

A worked example with one real color. Take #FFE629 (OKLCH L 0.918, C 0.184, H 100.9) down to L 0.42, the lightness of a step-10 text color:

| Strategy | Result at L 0.42 | Reads as |
|---|---|---|
| Hold hue at 100.9 | #584E00 | olive |
| Drift hue to 66 (the skill's step 10) | #6F4100 | brown-gold |
| Material tonal palette, tone 40 | #6A5F00 | dark olive |

All three are legitimate colors; none of them is yellow. The design decision is which one the ramp should tell the reader it is.

**What to do.** Accept that the dark half of a yellow ramp is a choice of destination hue, not a fidelity problem a better color space will solve. Choose olive or gold deliberately per hue family, and write the choice down. This is consensus across every system studied; the per-family split in section 3 is where judgment enters.

---

## 2. Hold the hue or drift it toward orange? What do shipped dark yellows actually do?

**The short answer.** Hand-tuned systems drift yellow toward orange as it darkens; algorithmic generators hold the hue and then patch the olive consequences. The skill drifts, which matches what the hand-tuners ship, and its landing hues sit inside the same gold band as theirs.

The two camps, from the shipped values (hue numbers converted locally from each system's published hexes unless noted):

**Hold camp.** Material HCT's TonalPalette is documented as "constant in hue and chroma, but vary in tone", and measures that way: a #FFE629 palette moves from CAM16 hue 102.4 to 103.3 across the whole tone range, going olive purely through chroma clamping. Evil Martians' Harmony holds its yellow at exactly H 90 at every one of its eleven steps, in its own source.json. Radix's custom palette generator sets every step's hue to the input hue in its source (color.coords[2] = source.coords[2]). USWDS's yellow-vivid holds H 87 to 93 through the whole usable range and only breaks to 63.7 at its final step, where chroma is already down to 0.044.

**Drift camp.** Tailwind v4's yellow, published directly in oklch(), runs H 102.2 at yellow-50 to 53.8 at yellow-950, a 48-degree rotation into orange-brown; its amber runs 95.3 to 45.6. GitHub Primer's yellow drifts its stored hue from 52.8 to 35.6 (HSLuv), ending brown. Radix's own hand-tuned amber runs 98 to 54, and its yellow puts the step-11 text color at H 77, gold. Adobe Spectrum documents the intent explicitly, an s-curve hue shift as colors lighten citing the Bezold-Brücke effect, and its shipped yellow measures H 100 at the light end, 71 through the dark middle, curling back to 87 near black, exactly the documented s-curve. Eugene Fedorenko's Accessible Palette article states the rule as an instruction: bright yellow gets a greenish shade as it darkens, so "to shift them a little closer to orange, I use a negative Hue compensation."

Two things make this split trustworthy rather than an echo. First, the drift camp arrived independently: Tailwind tunes by eye in OKLCH, Primer in HSLuv, Fedorenko in LCh, Spectrum in CAM02, Stripe in CIELAB, five teams in five color spaces converging on the same rotation. Second, the hold camp is not really disagreeing about perception; it is what generators do when hue is a held parameter, and both major holders then compensate downstream. Harmony's held hue is 90, which is already the gold side of yellow, so its dark steps are gold by starting position. Material holds hue and then ships a DislikeAnalyzer that detects the resulting dark olive and lightens it away (section 3).

The skill sits in an unusual position: it is an algorithmic generator that encodes the hand-tuners' judgment. Its yellowDrift rotates hue continuously toward orange in proportion to how far a step's lightness has travelled from the source (rate 70, capped at 45 degrees), so its reference yellow #CA8A04 lands step 12 at H 49, and the four vivid ramps generated alongside this research land their dark ends between H 45 and 87. Tailwind's landing zone is 46 to 54, Radix's text steps 54 to 77, Spectrum's dark middle 71: the skill's destinations sit inside the shipped band.

**What to do.** Keep the drift for yellow and amber; it reproduces what five independently tuned production systems ship, and the landing hues already match. This is the consensus reading of the evidence, not a judgment call. The judgment call is lime, next section.

---

## 3. Is lime a yellow? Where the skill's family boundary is wrong

**The short answer.** No. The shipped evidence says lime holds its hue when darkening, and yellow's drift-toward-orange applied to lime lands its dark steps in exactly the zone Google's code flags as universally disliked. This is the one place the skill's yellow handling contradicts the field.

Three independent lines of evidence point the same way.

**Radix ships a held-hue lime.** Converting the twelve light-mode lime hexes from the radix-ui/colors source: hue stays between 119 and 129 across the entire scale, including the dark text steps (lime11 #5c7c2f at H 129, lime12 #37401c at H 121). The same team drifts its amber to H 54. That is one hand-tuning culture making opposite choices for the two hues, which is the strongest kind of evidence that the choice is about the hue, not the house style.

**Material's DislikeAnalyzer names the failure zone.** material-color-utilities ships a module whose docstring defines disliked as "a dark yellow-green that is not neutral": CAM16 hue 90 to 111, chroma above 16, tone below 65, with a documented rationale citing universal distaste in color-preference research. The library does not just warn; fixIfDisliked raises the tone to 70, and scheme generation applies it so a tertiaryContainer "should not be disliked."

**The skill's lime lands inside that zone.** Lime #AACF24 enters at H 122. The drift pulls its dark steps down through the nineties: steps 8 through 11 measure H 107.4, 102.5, 95.5, 91.3, all inside the 90-to-111 band, with step 12 at 87.1 just past it. (Caveat on the comparison: Material's band is CAM16 hue and these are OKLCH hues; in this region the two agree closely, e.g. #FFE629 measures 102.4 in CAM16 and 100.9 in OKLCH, so the placement is approximate by a degree or two, not by tens.) Held at the source hue instead, those same steps would sit at H 122, above the band, and would match what Radix ships.

Before and after, with real values, steps 9 to 12 of the #AACF24 ramp:

| Step | Shipped today (drift) | Held hue (H 122) |
|---|---|---|
| 9 | #756B00 (H 102) | #5D7310 |
| 10 | #5C4C00 (H 96) | #435500 |
| 11 | #4C3B00 (H 91) | #354400 |
| 12 | #3B2B00 (H 87) | #273400 |

The left column is golden-olive drifting toward the disliked zone; the right is mossy green-olive, the Radix direction. Neither is vivid, because section 1 says nothing dark and yellow-green can be, but they are different colors with different family identities, and the shipped evidence is unanimous about which one production systems choose for lime. No counter-example was found: no studied system rotates a lime toward orange as it darkens.

The mechanism behind the correction: the skill's family detection puts H 70 to 130 in one yellow family with one drift rule. Material's own isYellow band is 105 to 125, and the evidence splits inside the skill's band, drift below roughly 105 (yellow, amber, gold), hold above it (lime, chartreuse). A drift factor that scales down linearly from full strength at H 105 to zero at H 125 would reproduce both behaviors from one rule and leave every existing yellow and amber ramp untouched, since those sources sit at H 76 to 101.

**What to do.** Correct the skill: scale the yellow-family drift by source hue so that lime-region sources (above roughly H 115) hold their hue. The direction is consensus (Radix's shipped lime, Material's disliked zone, and the absence of any counter-example); the specific taper shape and band edges are this guide's judgment and need the skill's normal versioned-change treatment, since it changes output for lime sources. Consider also surfacing a warning when any generated ramp's dark steps land in the 90-to-111 hue band at meaningful chroma, Material's zone, since it would have caught this exact case before a reader did.

---

## 4. Where does a vivid brand yellow live in a 12-step scale?

**The short answer.** The field offers three answers: reproduce it at a lightness-matched step (the skill), reproduce it at the designated solid slot regardless of lightness (Radix's generator), or treat it as inspiration and reproduce nothing (Material, and in practice Leonardo). The skill's guarantee is the strictest of the three, and the cost it pays for that guarantee, a vivid step sitting in the background zone, is a cost the alternatives avoid by weakening the guarantee instead.

The ladder, from strongest guarantee to none:

**Verbatim at the lightness-matched step (the skill's anchored mode).** #FFE629 has L 0.918, so it anchors at step 4 and reproduces exactly. The ramp's lightness ordering is preserved: backgrounds stay ordered from step 1 down. The cost is that step 4, a background slot, now holds the most saturated color in the ramp. The skill's recent cap taper softened the approach to it (the adjacent-step deltas around the anchor went from 0.040/0.089 to 0.060/0.066, nearly uniform), but the anchor remains the vivid peak because verbatim requires it to be.

**Verbatim at the solid slot, lightness be damned (Radix custom palette generator).** The generator's source assigns the input color directly to step 9 (accentScaleColors[8] = accent9Color) whatever its lightness. The shipped hand-tuned scales embed the same philosophy: Radix yellow descends to L 0.77 at step 8, then jumps back up to 0.92 at step 9, because step 9 is #FFE629 itself. The scale is openly non-monotonic in lightness. Users noticed: an early issue filed the bright scales' steps 9 and 10 as a bug for being lighter than 7 and 8, and the answer was that it is by design, step 9 means "the pure color," not "the ninth-lightest color." The cost is the reversed ordering and the user confusion it caused; the benefit is that backgrounds 1 through 5 stay quiet and the vivid color sits where solid accents are picked from.

**Approximate pass-through (Leonardo).** Key colors define the interpolation path, but swatches are placed by target contrast ratio, so the output only passes near a key color. Two open feature requests (#149, #204) ask for verbatim inclusion; the creator's answer in the thread is that returning the key color exactly "would lose the ability to specify contrast for the color." The documented workaround is to measure the brand color's actual ratio against the background and add that number to the ratios array, which lands a swatch at the brand color's contrast, close to but not exactly the brand color.

**Inspiration only (Material).** ColorScheme.fromSeed is documented in Flutter with the plain warning that the seed "may not wind up" among the resulting colors. A #FFE629 seed produces T90 #FDE426 as its nearest tonal neighbor and a light-scheme primary of #6A5F00, a dark olive that shares only ancestry with the brand color. Issues asking why (#98658, #77) are closed as working-as-intended, with the fidelity scheme variant offered as the partial remedy, and a commenter in #77 noting the scheme "rarely works for yellow brand colors."

Every system that guarantees less than the skill does so to protect a different invariant: contrast placement for Leonardo, tonal role arithmetic for Material, quiet backgrounds for the skill's own free mode. There is no free verbatim. The choice is which invariant bends.

**What to do.** Keep anchored mode's verbatim guarantee; it is the strongest in the field and it is the honest contract for "this exact brand color must appear." But for vivid accent yellows specifically, the Radix placement answers the "it feels inserted" complaint better than any smoothing can, because it moves the color out of the background zone entirely instead of blending it in. Worth adopting as an option: a bright-solid placement variant of anchored mode that pins the source at step 9 and accepts non-monotonic lightness, documented with the Radix precedent. Consensus on the trade-off space; the recommendation to offer both placements is this guide's judgment. When a brand yellow is genuinely a tint (a pale wash used as background), the current lightness-matched anchor remains the right tool.

---

## 5. Why does every system put dark text on yellow solids, and can WCAG 2 be trusted about it?

**The short answer.** Dark text on yellow is universal across the studied systems, and the skill's measured recommendation agrees. The sharper finding is that Radix considers WCAG 2's formula unreliable for yellow and designs those steps with APCA instead, which the skill currently uses only as informational output.

The consensus first. Radix documents that Sky, Mint, Lime, Yellow and Amber "are designed for dark foreground text" at steps 9 and 10. Spectrum's usage documentation lists yellow, orange, chartreuse and cyan as colors that "must be used with black text," and its static palette assigns black text to backgrounds 100 through 800. Radix's custom generator automates the same rule: step 9's text color flips from white to a dark step-9-hued color whenever APCA contrast falls below Lc 40. The skill computes rather than remembers this, its solidForeground field measures both candidate foregrounds against the actual solid hex, and it recommended dark text for all four vivid ramps generated alongside this research. On the rule itself, everyone agrees.

The instrument disagreement is more interesting. A Radix issue measured the documented 4.5:1 claim failing for yellow, amber and orange (step 11 on step 3: 4.33, 4.44, 4.13), and the maintainer's response was not to fix the values but to reject the meter: WCAG 2 ratios "are not good at predicting the contrast of yellow and orange hues," and the scales are designed against APCA, whose model of perceived contrast handles high-luminance hues better. This matches the skill's own documented experience, where yellow is the standing exception to cross-scale contrast claims.

The skill's current position is defensible but asymmetric: it gates its AAA warnings on WCAG 2 (correctly, since WCAG 2 is the normative standard audits use) and emits APCA Lc as informational data at the text steps, but its solidForeground recommendation is computed from WCAG 2 ratios alone, the one instrument the field's yellow specialists say lies about exactly these hues. The recommendation has been right so far because comparing two candidates against the same solid partially cancels the formula's bias, but the cancellation is luck, not design.

**What to do.** Add APCA to the solidForeground computation, either as the deciding metric with WCAG 2 reported alongside (the Radix position) or as a dual report with a note when the two disagree. Keep WCAG 2 as the normative gate for the AAA warnings, since that is what compliance means. Consensus that dark-on-yellow is the rule; the APCA upgrade is this guide's judgment, backed by Radix's stated practice.

---

## 6. Fixed lightness ramps or contrast-targeted placement?

**The short answer.** Three architectures ship: fixed lightness ramps (the skill, Radix, Tailwind, Spectrum), tone-arithmetic systems where step distance guarantees contrast (Material, USWDS), and contrast-targeted generation where swatches are solved from ratios (Leonardo, Harmony). The skill already spans the first and second and borrows the third's idea where it matters, so no structural change is warranted.

How each works. A fixed ramp assigns each step a lightness and lets contrast be a measured consequence; the skill's fixed L tables with measured contrastWarning are this, as are Radix's and Tailwind's hand-tuned steps. Tone arithmetic makes contrast a theorem: Material documents that a tone difference of 40 guarantees 3.0:1 and 50 guarantees 4.5:1, and USWDS's grade system does the same with its magic numbers (40+ for AA Large, 50+ for AA, 70+ for AAA), so "grade 50 passes against white and black" is a property of the number, not a measurement. Contrast-targeted generation inverts the flow entirely: Leonardo takes target ratios (including negative ratios for lighter-than-background outputs) and solves for the colors, and Harmony's published yellow carries an APCA value per step with mirrored light/dark contrast pairs.

The trade-off is the usual one between guarantees and identity. Tone arithmetic and ratio solving make contrast bulletproof across every hue at once, and pay for it in hue fidelity, which is exactly where yellow suffers (a solver that needs Lc 75 from a yellow has nowhere to go but brown or olive). Fixed ramps preserve per-hue character and pay in per-hue verification, which is why the skill's yellow is its documented contrast exception.

The skill already holds a reasonable position in this space: fixed ramps for identity, measured warnings for honesty, and an opt-in luminanceText flag that solves the text steps' lightness per hue to hit the achromatic luminance targets, which is the Material/USWDS idea applied surgically to the three steps where contrast is normative. Leonardo's remaining distinctive ideas, whole-theme derivation from a background lightness knob and ratio-driven swatch counts, solve a theming product's problem rather than a scale generator's.

**What to do.** No architectural change. The hybrid (fixed ramp, measured warnings, opt-in luminance targeting at text steps) matches what the evidence supports for a Figma-first token workflow, where step identity is load-bearing. This is consensus by triangulation: each pure architecture's owners have documented the costs the hybrid avoids.

---

## 7. What should the skill adopt, correct, or leave alone?

**The short answer.** One correction (lime), two additions (APCA in the foreground recommendation, a disliked-zone warning), one option worth designing (bright-solid placement), and several deliberate non-changes.

**Correct: hue-dependent drift for the yellow family.** The evidence in section 3 is the strongest in this guide: scale the drift from full strength below H 105 to zero by H 125, so lime holds hue like Radix's lime and every existing yellow/amber ramp is byte-identical. Output-changing, so it takes the skill's versioned treatment, a new test pinning a lime ramp, and a reference-table check.

**Add: APCA to solidForeground.** Section 5. Small, additive, aligned with the skill's existing informational APCA output, and it replaces a luckily-cancelling bias with the instrument Radix actually designs those steps with.

**Add: a dark-yellow-green warning.** A warnings entry when generated dark steps land at meaningful chroma inside the hue 90-to-111 band below mid-lightness, citing Material's DislikeAnalyzer bounds. It is cheap, it is evidence-backed by shipped code at Google, and it would have caught the lime complaint that started this research, which is the skill repo's own bar for adding machinery. If the lime correction lands first, the warning becomes the guard that keeps the zone empty for future sources.

**Design, then decide: bright-solid placement.** Section 4. An anchored-mode variant that pins the source at step 9 with non-monotonic lightness, Radix-style, for vivid accent yellows. It answers "the anchor feels inserted" structurally rather than by smoothing. It is also a larger semantic change (step roles stop implying lightness order), so it deserves a written design note and a user decision, not a quiet implementation.

**Leave alone, on evidence:**

- **The yellow/amber drift itself.** Five independent systems converge on it; the skill's landing hues sit inside the shipped band (section 2).
- **The verbatim anchor guarantee.** Strongest in the field; every alternative weakens the contract to protect a different invariant (section 4).
- **The background chroma cap and its taper.** No studied generator has an equivalent mechanism to compare against; the closest analogue is that every fixed ramp keeps light-step chroma low by hand. The taper's measured effect (near-uniform deltas into the anchor) stands on the skill's own regression evidence.
- **The fixed-L architecture with measured warnings.** Section 6.
- **sRGB-only scope.** Radix and Harmony ship P3 variants and mark them; the skill documents sRGB as a boundary. Revisit only when the Figma-to-CSS pipeline this skill feeds actually asks for P3 output, because gamut expansion changes every pinned value.

**What to do.** Land the lime correction first, since it fixes a real shipped ramp; take the two warnings/metrics additions in the same or next version, since both are small and test-backed; write the bright-solid design note before touching placement code. All four recommendations are this guide's judgment; the evidence behind each is cited in its section.

---

## 8. Cheat sheet

| Situation | What the field ships | Source of record |
|---|---|---|
| Dark end of a yellow or amber ramp | Drift hue into gold/brown, landing H ≈ 45-77 | Tailwind theme.css, Radix amber, Spectrum tokens, Primer primitives |
| Dark end of a lime ramp | Hold hue ≈ 120-129, mossy olive | Radix lime source; Material DislikeAnalyzer excludes 90-111 |
| Vivid yellow as solid/accent | Dark (near-black warm) foreground text | Radix scale docs; Spectrum using-color; skill's solidForeground |
| Contrast measurement for yellows | APCA preferred; WCAG 2 known to mispredict | Radix issue #41 maintainer statement |
| Brand yellow must appear exactly | Only lightness-matched (skill) or slot-9 (Radix generator) placement guarantees it | generate-radix-colors.tsx; skill's anchor guard |
| Brand yellow through Material | Expect it to vanish; T40 primary of #FFE629 is #6A5F00 | Flutter fromSeed docs, issues #98658/#77 |
| Very light yellows (step 1-2 zone) | Held hue, tiny chroma; Material special-cases T99 for yellow | material-color-utilities commit 998b611d |
| "Is this dark yellow-green safe?" | Avoid H 90-111 at C > 16 (CAM16), tone < 65 | DislikeAnalyzer source |

---

## 9. The short version

Yellow is the hue where color geometry runs out: saturated yellow exists only light, a fact as old as the Munsell solid, so the dark half of every yellow ramp is an invention. The industry has quietly agreed on what to invent. Hand-tuned systems (Tailwind, Primer, Radix's amber, Spectrum, Stripe) rotate yellow toward orange as it darkens, ending in gold and brown; algorithmic generators (Material HCT, Harmony, Radix's custom tool) hold hue constant and then patch the olive that results, most vividly in Google's DislikeAnalyzer, which detects dark yellow-green and lightens it away. The toolkit's OKLCH skill drifts, like the hand-tuners, and its landing hues match theirs: for yellow and amber it is already doing what the best systems ship.

The one real correction is lime. Radix holds lime's hue all the way down; Google's code marks the zone the skill's drifted lime lands in as universally disliked; no system anywhere rotates lime toward orange. The skill should scale its drift by source hue so lime-region sources hold, a small versioned change that leaves every yellow and amber ramp untouched.

Beyond that: adopt APCA into the foreground-on-solid recommendation (Radix's maintainers are explicit that WCAG 2 mispredicts yellow contrast, and the skill already computes APCA informationally); add a warning when dark steps land in the disliked yellow-green zone; and consider offering a Radix-style placement option that pins a vivid brand yellow at step 9 with non-monotonic lightness, which dissolves the "anchor feels inserted" problem rather than smoothing it. Keep everything else: the verbatim anchor is a stronger guarantee than Material or Leonardo offer, the cap taper has no equivalent to copy from, and the fixed-lightness-plus-measured-warnings architecture is the right hybrid for a Figma-first workflow. Consensus versus judgment: the drift direction, the dark-text rule and the lime hold are consensus; the specific taper bounds, the APCA upgrade and the placement option are this guide's calls.

---

## 10. What to re-check later

- **Tailwind and Spectrum token values** move with releases; the oklch() and rgb() values here are from tailwindcss main and @adobe/spectrum-tokens 14.15.0 as of August 2026.
- **material-color-utilities** was fetched at the ColorSpec2025 era; the npm 0.4.0 ESM build was broken during research (imports without file extensions), so library measurements ran on 0.2.7. Yellow special-cases are being actively edited (commits 998b611d, 1a34bd2d); re-read before citing specifics.
- **Leonardo** added OKLCH/OKLAB interpolation ahead of its README; the README still lists seven spaces while the type definitions list ten. Trust the types.
- **The CAM16/OKLCH hue comparison** in section 3 is approximate; the bands agree within a couple of degrees in the yellow-green region (calibrated on #FFE629: 102.4 CAM16 vs 100.9 OKLCH) but were not verified across the whole band.
- **Spectrum documentation quotes** come from a scraped mirror of the Spectrum 1 public docs, because spectrum.adobe.com renders only via JavaScript; the canonical pages should be re-fetched if quoted anywhere normative.
- **Single-source claims:** the Accessible Palette hue-compensation quote rests on one article (its mirror returned HTTP 500 during research); the Radix "designed with APCA" position rests on one maintainer comment, though it is consistent with the generator's Lc-40 switch in code.
- Revision note: this guide is the first on this topic; no earlier version exists to reconcile.

---

## Sources

### Primary

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
- [adobe/leonardo #149](https://github.com/adobe/leonardo/issues/149) and [#204](https://github.com/adobe/leonardo/issues/204) (key colors not verbatim; maintainer rationale)
- [Adobe Design: Reinventing Adobe Spectrum's colors](https://adobe.design/stories/design-for-scale/reinventing-adobe-spectrum-s-colors) (key-color interpolation, s-curve hue shift, yellow identifiability)
- [adobe/spectrum-design-data color-palette.json](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/color-palette.json) (shipped yellow 100-1600 values, v14.15.0)
- [radix-ui/colors src/light.ts](https://raw.githubusercontent.com/radix-ui/colors/main/src/light.ts) (yellow/amber/lime hexes, converted locally)
- [radix-ui/website understanding-the-scale.mdx](https://raw.githubusercontent.com/radix-ui/website/main/data/colors/docs/palette-composition/understanding-the-scale.mdx) (bright-five dark-foreground note)
- [radix-ui/website generate-radix-colors.tsx](https://github.com/radix-ui/website/blob/main/components/generate-radix-colors.tsx) (custom generator: verbatim step 9, constant hue, APCA Lc-40 text switch)
- [radix-ui/colors #41](https://github.com/radix-ui/colors/issues/41), [#42](https://github.com/radix-ui/colors/issues/42), [#12](https://github.com/radix-ui/colors/issues/12), [#8](https://github.com/radix-ui/colors/issues/8) (WCAG-vs-APCA position, measured misses, non-monotonic confusion)
- [tailwindcss theme.css](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/packages/tailwindcss/theme.css) (yellow/amber oklch values verbatim)
- [primer/primitives light.json5](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/color/light/light.json5) (shipped yellow scale)
- [primer/prism README](https://github.com/primer/prism/blob/main/README.md) (tool status, prior art)
- [GitHub blog: Accelerating GitHub theme creation with color tooling](https://github.blog/news-insights/product-news/accelerating-github-theme-creation-with-color-tooling/) (Prism mechanics, HSLuv)
- [USWDS design tokens: color overview](https://designsystem.digital.gov/design-tokens/color/overview/) and [system tokens](https://designsystem.digital.gov/design-tokens/color/system-tokens/) (grades, magic numbers, yellow ramp values)
- [Stripe: Designing accessible color systems](https://stripe.com/blog/accessible-color-systems) (CIELAB approach, no-dark-yellow statement)
- [evilmartians/harmony source.json via GitHub API](https://github.com/evilmartians/harmony) (held H 90 yellow, per-step APCA)
- [Evil Martians: OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) (gamut asymmetry examples)
- [ardov/huetone README](https://github.com/ardov/huetone) (APCA support; no yellow-specific handling documented)
- [Wikipedia: Munsell color system](https://en.wikipedia.org/wiki/Munsell_color_system) (light-yellow chroma asymmetry) and [Olive (color)](https://en.wikipedia.org/wiki/Olive_(color)) (olive as darkened yellow)
- [W3C public-css-archive: HCT summary](https://lists.w3.org/Archives/Public/public-css-archive/2022Jun/0306.html) (Lilley on O'Leary's HCT)

### Commentary

- [Nate Baldwin: Adaptive color in Spectrum](https://medium.com/thinking-design/adaptive-color-in-spectrum-adobes-design-system-feeeec89a2c7) (creator; "a dark yellow is no longer yellow")
- [Nate Baldwin: Colorimetry and the cartography of color](https://medium.com/thinking-design/colorimetry-and-the-cartography-of-color-415ef5315c0a) (creator; hue paths per space)
- [Nate Baldwin: Accessible color for design systems](https://medium.com/@NateBaldwin/accessible-color-for-design-systems-just-got-easier-40e8420a8371) and [Creating contrast-based themes with Leonardo](https://uxdesign.cc/creating-contrast-based-themes-with-leonardo-32b6219a090f) (creator; key-color mechanics, two-key yellow example)
- [Nate Baldwin: Color scales for data visualization in Leonardo](https://medium.com/@NateBaldwin/color-scales-for-data-visualization-in-leonardo-bf206feb61b9) (creator; smoothing)
- [Eugene Fedorenko / Wildbit: Accessible Palette, stop using HSL](https://www.wildbit.com/blog/accessible-palette-stop-using-hsl-for-color-systems) (negative hue compensation for yellows; mirror at efedorenko.com returned HTTP 500 during research)

### Cited but not resolved to a URL

- Material Design blog, "The science of color & design" (m3.material.io/blog/science-of-color-design): page is JavaScript-rendered and archive mirrors were unreachable; its specific hue-linearity claims are not asserted in this guide.
- Synthese (Springer, 2022) paper discussing brown as darkened yellow/orange: behind a redirect wall; the Munsell, olive and Stripe citations carry the claim instead.
