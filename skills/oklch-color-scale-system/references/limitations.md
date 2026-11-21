# Known limitations and edge cases

What the system does not do by design, what has been swept and characterised, and what is still open. [SKILL.md](../SKILL.md) points here from its References table.

## Contents

- [By design, not gaps](#by-design-not-gaps)
- [Tested and characterised](#tested-and-characterised)
- [Open](#open)

## By design, not gaps

These are deliberate scope boundaries, not things left to fix.

| Area | Boundary |
|---|---|
| Wide-gamut displays (P3, Rec2020) | Constrained to sRGB throughout |
| High-contrast themes | AAA is guaranteed at text steps 10–12 only, not at every step |
| Colour-blind-safe themes | Hue substitutions for colour vision deficiency are not handled |
| Semantic role assignment | Which scale maps to success, warning, error or info is a design decision this skill does not make |

## Tested and characterised

Each of these was swept systematically, with the method and finding stated. They are documented behaviour, not open questions.

| Area | Sweep | Finding |
|---|---|---|
| Hue-nudge normalisation | 8,000 random sources (fuzzing), then a 5,000-case sweep | Red (H 0–40) and magenta (H 320–360) border the 0/360 wrap, so `sourceH ± N` could leave [0, 360). Both nudge functions, `applyFamilyRules()` and `yellowDrift()`, now normalise to [0, 360). Zero out-of-range results after. No validated reference source sat near enough the wrap to show it. |
| Anchor is not always peak rendered chroma | Every family × 5 source L (0.45–0.85) × 3 source C (0.15–0.25), ~500+ combinations | Affects every family except indigo, purple and magenta, at 8% (red) to 77% (cyan) when source L and C are high ([chroma-and-gamut.md](chroma-and-gamut.md)) |
| Gamut clamping tolerance | Four clamp strategies (decrement or bisect × strict or tolerance) against all 72 reference steps | The ±0.001 band is needed to reproduce the tables exactly; a strict [0,1] check gives lower-chroma output ([chroma-and-gamut.md](chroma-and-gamut.md)) |
| Alpha scale precision | 143 reference values (72 solid + 71 alpha) | All exact. The 8-bit hex, not the continuous conversion, must be used for base and target ([alpha.md](alpha.md)) |
| Yellow and orange collision | 1,620 synthetic yellow sources (H 72–128 × C 0.10–0.20 × L 0.40–0.85, free and anchored) against the project's orange; rates 20–70 | 46–50% collide at H 72–84, falling to 0% by H 96. No global rate removes the risk and still corrects the olive drift ([hue-families.md](hue-families.md)) |
| No-ceiling modifier | 2,940+ synthetic sources across indigo, purple and magenta at C ≤ 0.35 | Zero flat spots. At C 0.40–0.50 (a recovered source chroma around 0.27+) a real flat spot occurs, near H 330 for magenta. Not a practical risk; `tests/test-oklch.js` tracks it as informational. |
| Boundary source colours | 81 tests across all 9 family boundaries, at the cutover and ±1/2/4/8° | Zero crashes, NaN values or anomalous hue jumps; detection switches cleanly. H 68, H 168 and H 218 confirmed clean in all 4 mode combinations. |
| Dark anchored mode | 90 synthetic sources: 9 families × 5 L (0.20–0.80) × 2 C | The anchor's L equals the recovered source L every time |
| Drift toward a reference | 1,000 random base and reference pairs (fuzzing) | The anchor never moves and the output is always valid |
| Crash resistance | 5,000 random hex inputs in every mode combination, plus alpha on each | Zero crashes and zero invalid output |
| Anchored text-zone contrast | Free mode across the full hue circle; anchored at L 0.44–0.465 | Free: worst text step 7.82:1. Anchored at step 10: down to 6.68:1 for high-luminance hues, now measured as `contrastWarning` ([contrast.md](contrast.md)) |
| Dark chromatic alpha direction | Solved alphas checked against the neutral dark profile | A white-only solver inverted dark tokens (step 1 at α 0.95). A black-solved branch fixes it; the suite composites dark cases onto black and checks step 1 is translucent ([alpha.md](alpha.md)) |
| Near-neutral alpha routing | A `C = 0.009` source | 11/255 composite error through the single-base solve. Routing now reads the rendered channels, not the family label ([alpha.md](alpha.md)) |
| Hue-scaled yellow drift | 3,000 cases (fuzzing) | Only yellow-family sources above H 105 changed. A gamut-crushed step-9 chroma seed was fixed in recovery; the lime set recovers 28/28 mode-correct, worst 0.47/255 ([recovery.md](recovery.md)) |

**Cross-hue chroma disparity at the dark text steps**. At dark step 12 (L 0.93), sRGB's ceiling varies a lot by hue. From a matched C=0.15 source per family, green renders C 0.103 and indigo only C 0.034. That is a 3.0× spread across the 9 families, at identical source chroma and target L. So a green dark heading can read more vivid than a blue or indigo one; neither scale is wrong.

- Do not normalise it away by default: a chroma suited to each hue is usually the more honest choice.
- Where cross-hue vividness parity matters more than per-hue fidelity, apply a shared chroma cap at steps 10–12.
- That cap will under-use the headroom the wider-gamut hues have.

**Drift can erase a hue-family nudge**. Drift sets each step's hue from the anchor's hue and the schedule, so a nudge the step already had is replaced. Only an anchored-mode anchor is exempt; in free and grey mode the anchor step drifts too. Steps near step 12 get little drift, and step 12 none, by construction ([modes.md](modes.md)).

**The anchor-proximity cap taper**. The background cap tapers toward a designated peak, an anchored anchor or a `--peak` step, over `TAPER_RADIUS` steps ([chroma-and-gamut.md](chroma-and-gamut.md)). Three findings are pinned in the suite:

- **A hue-aware cap was prototyped and rejected**. At steps 1–3 the curve's chroma is already below 0.10 for realistic sources. The cap binds only next to a vivid peak, so the condition is proximity, not hue.
- **Orange cancels the taper through gamut geometry**. For `#F17300`, sRGB's maximum chroma within the taper's reach sits below even the flat cap, so the clamp binds first. This is asserted.
- **A loosen-only violation, found by fuzzing**. The decrement clamp depends on its start. So a tapered step could land ~0.001 *below* its pre-taper value. `clampCapZone()` renders both starts and keeps the higher.

Pinned examples: `#00AFFF` anchored, where the sRGB wall binds, stays byte-identical to the untapered cap; `#FFB300` genuinely loosens.

## Open

These need more testing than has been done, or something other than testing.

| Area | What is open |
|---|---|
| Very low-chroma sources | Near-neutral sources above the C ≈ 0.01 neutral threshold are less tested than the 9 core families |
| Neutral dark step 11 | Weaker support than every other pin: the only comparable reference (Radix `gray-dark-11`, L 0.770) sits well below L 0.87. It needs a second source from another production system, which is research, not a sweep. |
| Manual edits after generation | No description field records them, so a hand-edited scale must say so in its description ([figma-output.md](figma-output.md)) |
| Perceptual ambiguity at family boundaries | Computational robustness is confirmed. Whether a boundary colour reads as one family or the other is a perceptual judgement, which needs a person looking at it, not another test. |
