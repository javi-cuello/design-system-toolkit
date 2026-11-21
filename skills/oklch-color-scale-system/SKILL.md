---
name: oklch-color-scale-system
description: Generates perceptually consistent 12-step OKLCH color scales for UI design systems, in both light and dark mode. Use this skill when asked to create a color palette, generate a color scale, build design tokens, or work with OKLCH colors for UI — including alpha/transparent variants. Handles free mode (any color), anchored mode (brand colors that must appear verbatim, light and dark), grey/neutral mode, and a hue-drift technique for nudging a ramp toward a secondary reference without moving its anchor. Applies hue family perceptual rules for blue, indigo, purple, red, orange, yellow, green, cyan, and magenta — 11 rules total, each grounded in sRGB gamut geometry or documented perceptual hue behavior. Guarantees WCAG AAA contrast at text steps in free and grey mode, light and dark; anchored mode can override a text step's lightness with the source's own, so generation measures actual WCAG ratios and returns a contrastWarning whenever a text step falls below 7:1.
---

# OKLCH Color Scale System

**Version 2.4.1** — history in CHANGELOG.md.

This skill generates perceptually consistent 12-step colour scales in OKLCH, light and dark, from any source colour. Each scale covers every UI role, from app-shell background to headings. Its text steps meet WCAG AAA contrast in free and grey mode. The script `scripts/generate.js` builds the scale, and `scripts/recover.js` finds the settings behind an existing one. Use it to create a palette, a colour scale, design tokens or alpha variants, or to re-source or audit a scale that already exists.

## Project context first

A **design system context document**, where one is available, is the authoritative per-project configuration. In Claude Code it is a file in the working folder, which the project's CLAUDE.md names. In claude.ai it comes from Project knowledge or the conversation. Match the connected file's `fileKey` against its registry, and take every setting this skill needs from the matching sections. Run discovery **only** for what the document marks `[TBD]`.

Rulings recorded in the document outrank file evidence: report a conflict rather than deriving the answer again. Record a run's new rulings in the document. Where it is a writable file (Claude Code), update it in place in the same turn. Otherwise, output the updated sections for the maintainer to paste back.

**The one setting this skill reads is the dialect**: the `language` key in the document's `audit-settings` block, which the toolkit's other tools read too. Absent means en-GB. The generator writes one dialect-bearing word, the neutral mode's name in provenance.

- en-GB, the default: `--mode grey`, and descriptions say `grey mode`.
- en-US: pass `--mode gray` and name the scale `Gray`. Values are identical; only the word in `figmaDescription` changes.

Everything else is a pure function of the input.

## Files in this skill

| File | What it is | When to use it |
|---|---|---|
| `SKILL.md` | The workflow and the decisions | Every run |
| `references/` | The rules, the reasons behind them, validation and limits | When a step links one |
| `scripts/generate.js` | The authoritative implementation | Run it to generate a scale; never hand-compute the formulas |
| `scripts/recover.js` | The reverse of `generate.js`: settings from an existing 12-step scale | Re-sourcing or auditing a scale, instead of guessing |
| `tests/test-oklch.js` | The regression suite: reference tables, invariants, fuzzing, recovery accuracy, cross-hue calibration | After any change to `generate.js` or `recover.js`; it exits non-zero on a real failure |
| `tests/reference-scales.md` | Expected L, C, H and hex for six validated sources, 72 values: the fixtures the suite reads | Checking the engine by eye; regenerate it from `generate.js` after a deliberate change |

**If the code and the docs disagree, the code is right, and the docs need updating**. The relationship goes one way. Every formula in `references/` describes what `generate.js` does; none is a second specification. Without code execution, read the source of `generate.js` and `recover.js` as the specification.

## Workflow

**1. Ask for the inputs** before generating.

| Input | Notes |
|---|---|
| Source colour | A hex value, required |
| Mode | Free (the default, any colour) or anchored (a brand colour must appear verbatim) |
| No-ceiling modifier | Indigo, purple and magenta only. It skips the chroma ceiling and relies on gamut clamping alone, for maximum saturation. Off by default. |
| Dark mode | Whether a dark scale is needed too |
| Grey mode | Whether this is a neutral colour: constant C throughout, no curve |
| Alpha tokens | Whether a parallel transparent scale is needed beside the solid one |

**2. Choose the mode and peak**. This is the decision that most often goes wrong.

| The situation | Generate with |
|---|---|
| A brand hex that must appear verbatim in the scale | `--mode anchored` |
| A naturally light hue (yellow, amber, lime, orange, cyan) with no verbatim requirement | `free --peak N` at the hue's vivid step, **never anchored** |
| Any other chromatic colour | `free` (the default) |
| A neutral or grey | `--mode grey` |
| Several scales that must read as peers | The same `--saturation` fraction on each, never a shared absolute chroma |
| Project-wide contrast or hue-schedule variants | The versioned flags, collection-wide |

Anchored mode answers "must this exact hex appear?"; `--peak` answers "where does this hue's vividness live?". Using anchored as a peak workaround stamps `verbatim` provenance on a scale with no brand mandate. The modes and options in full: [modes.md](references/modes.md).

**3. Check which family the source resolves to**, not the one its name implies. Run `detectFamily()`, or check the source's H against the family table. A scale named "Green" with a source at H 177 is cyan, and takes cyan's rules.

Then read [hue-families.md](references/hue-families.md) before generating, not on demand: that family's rules, its avoid bounds and the source-picking guidance. They decide the generation, and a rule left unread is how an agent ends up hand-writing the logic instead.

- The reference sources are engine fixtures, not palette picks. A light hue among them still goes through step 2's table (case A16).
- For several scales at once, calibrate by fraction with `--saturation` ([hue-families.md](references/hue-families.md), *Calibrating a multi-scale palette*).

**4. Run the collision check for a yellow source with H below 96**. Pass the project's orange: `--collide-with <orange hex>`. On a collision, regenerate with the `--tail-rate` the output names as `clearingTailRate`, never moving one step. Detail: [hue-families.md](references/hue-families.md), *Yellow and orange collision*.

**5. Run `generate.js`; never hand-compute the scale**. It is faster, and it removes the arithmetic slips of computing 12 steps of curve, clamp and hue math by hand.

```
node scripts/generate.js '#1A6FBF'                                    # free mode, light, JSON output
node scripts/generate.js '#1A6FBF' --dark                              # dark mode variant
node scripts/generate.js '#9747FF' --mode anchored --no-ceiling --alpha # anchored, no ceiling, + alpha scale
node scripts/generate.js '#6A6A6A' --mode grey --table                 # grey mode, human-readable table
node scripts/generate.js '#1A6FBF' --drift-toward '#8040FF'            # anchor untouched, rest leans toward reference
```

The flags are listed under *Flags* below. Inputs are checked at the boundary. A hex must be 6-digit (`#RRGGBB`, `#` optional; `#RGB` shorthand expands), and the mode one of those listed. Anything else exits with a clear error; it never falls through to NaN steps or a silent free mode.

**6. Read what the scale reports**, before using it. Each field is measured from the output, not predicted from a table.

| Field | Says | Detail |
|---|---|---|
| `contrastWarning` | A text step (10–12) falls below 7:1, in any mode; usually because anchored mode moved its L | [contrast.md](references/contrast.md) |
| `anchorInTextZone`, `anchorInBackgroundZone` | The anchor landed among the text steps, or steps 1–5 | [contrast.md](references/contrast.md), [modes.md](references/modes.md) |
| `contrastDriftWarning` | A step 1–9 crosses 3:1 or 4.5:1 where a neutral at its L does not | [contrast.md](references/contrast.md) |
| `solidForeground` | Light or dark text on the solid step, from measured ratios, WCAG 2 and APCA | [contrast.md](references/contrast.md) |
| `sourceHueWarning`, `familyEscapeWarning` | The source sits outside its family's safe range; steps resolved to another family | [hue-families.md](references/hue-families.md) |
| `collisions`, `clearingTailRate` | Steps 9–12 within 3° of the orange, and the rate that clears them | [hue-families.md](references/hue-families.md) |

- Text is only used at steps 10, 11 and 12, never at steps 1–9.
- Step 9 is the fixed anchor in free mode, but not always the most saturated step. For a source with L above ~0.65 or C above ~0.20, check steps 7–9 ([chroma-and-gamut.md](references/chroma-and-gamut.md)).
- The L tables, the neutral exception and the text rules: [lightness.md](references/lightness.md).

**7. Generate the alpha scale where asked**, with `--alpha` or `generateAlphaScale(scale, name)`. Read [alpha.md](references/alpha.md) before generating it, not on demand. Its rules decide the base, the precision and the routing; skipping them is how alpha values get hand-solved wrongly.

- Always pass the real variable or collection name as `name`.
- A single base serves only a true neutral; every other scale is solved per step.

**8. Write the Figma variables from the generator's output**, never by hand. The generator writes each solid step's `figmaSuffix`, `figmaDescription` and `figmaDescriptionLine`. It writes `modeDescriptions` for a two-mode variable.

- Exactly one step per scale carries `-anchor` or `-source`, and alpha variables never do.
- A two-mode variable's name follows the collection's default mode. Its description holds one block per mode, headed by the collection's exact mode names (`--light-name`, `--dark-name`).
- A scale edited by hand after generation says so in its description: no field records it.
- Detail: [figma-output.md](references/figma-output.md).

**9. For an existing scale, run `recover.js`** rather than guessing its mode and source. Pass the 12 hexes, with `--dark` for a dark scale. Read its `warning` whenever one is set. Detail: [recovery.md](references/recovery.md).

## Flags

| Flag | Does | Detail |
|---|---|---|
| `--mode <mode>` | The mode: free (default), anchored, grey, or gray (grey in en-US) | [modes.md](references/modes.md) |
| `--dark` | The dark scale | [lightness.md](references/lightness.md) |
| `--no-ceiling` | Skips the indigo, purple or magenta chroma ceiling | [hue-families.md](references/hue-families.md) |
| `--peak <1-12>` | Free mode: moves the chroma curve's peak | [modes.md](references/modes.md) |
| `--saturation <0-1>` | Re-chromas the source to a fraction of its hue's ceiling | [hue-families.md](references/hue-families.md) |
| `--ease-hue` | Versioned opt-in: continuous hue nudges | [modes.md](references/modes.md) |
| `--oklch-text` | Reproduces a scale generated before 2.0.0 | [modes.md](references/modes.md) |
| `--alpha` | Also computes the alpha scale | [alpha.md](references/alpha.md) |
| `--drift-toward <hex>` | Applies the secondary-reference drift on top | [modes.md](references/modes.md) |
| `--collide-with <hex>`, `--collide-mode <mode>` | Steps 9–12 within 3° of that colour's scale, and the tail rate that clears them | [hue-families.md](references/hue-families.md) |
| `--tail-rate <n>` | Yellow's drift rate at steps 9–12 | [hue-families.md](references/hue-families.md) |
| `--light-name <name> --dark-name <name>`, `--dark-gen-mode <mode>` | Each step's two-mode description | [figma-output.md](references/figma-output.md) |
| `--table` | Readable output instead of JSON | |
| `--name <label>` | The scale's label | |

## References

| File | Read it for |
|---|---|
| [lightness.md](references/lightness.md) | OKLCH in brief, the light and dark L tables and their derivation, the text rules, the neutral exception |
| [chroma-and-gamut.md](references/chroma-and-gamut.md) | The chroma curve, the background cap and taper, rendered peak against anchor, gamut clamping |
| [modes.md](references/modes.md) | Free, anchored and grey mode, drift toward a reference, `--peak`, `--ease-hue`, luminance-targeted text |
| [hue-families.md](references/hue-families.md) | Family detection, avoid bounds, the 11 rules, yellow and its collision check, picking and calibrating sources |
| [contrast.md](references/contrast.md) | The contrast fields and warnings, `solidForeground`, the AAA guarantee and its anchored exception |
| [alpha.md](references/alpha.md) | Neutral and chromatic alpha scales, with reference tables |
| [figma-output.md](references/figma-output.md) | Token names, Figma suffixes, descriptions, the two-mode block, alpha descriptions |
| [recovery.md](references/recovery.md) | What `recover.js` returns, how it searches, its warnings and accuracy |
| [limitations.md](references/limitations.md) | Scope boundaries, what has been swept, what is still open |
