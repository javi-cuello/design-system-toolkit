# Eval cases — oklch-color-scale-system (v2.2.0)

**Walked: 2026-10-31 for 2.2.0** — A13 added and executed: `node tests/test-oklch.js` 655/655, every pinned hex unchanged; `--collide-with` is additive, so A1–A12 hold as written.

**Walked: 2026-10-31 for 2.1.5, tests only** — `node tests/test-oklch.js` 651/651: the yellow row of the family-escape table no longer counts as a pass (it is not checked), and the two "skipped this run" branches are failures now (the generator is deterministic; both always run).

**Walked: 2026-10-31 for 2.1.5** — `node tests/test-oklch.js` 652/652, every pinned hex unchanged.

**Reviewed against v2.1.4 on 2026-10-14** — no case changed: names that could identify a project are replaced in a fixture, an example or a comment; behaviour unchanged.

**Reviewed against v2.1.1 on 2026-10-02** — citation only; no case changed. `node tests/test-oklch.js` → 652/652; the 2.1.0 line below records 654, but `tests/test-oklch.js` is byte-identical to the 2.1.0 commit (3ef703e6) and that commit runs 652: the 654 was a draft's count, not a lost check.

**Walked: 2026-09-25 — pass.** 2.1.0 adds `contrastDriftWarning`. `node tests/test-oklch.js` → 654/654; no pinned hex moved. A12 added.

**Walked: 2026-09-25 — pass.** 2.0.0 makes luminance-targeted text steps the default. `node tests/test-oklch.js` → 649/649, exit 0; the seven new assertions fail on 1.9.1's default (spread 1.41, default ≠ targeted). Fixtures regenerated from `--table` output; only steps 10–12 moved, grey unchanged. A11 added.

**Reviewed against v1.9.1 on 2026-09-22** — where the dialect is read from (the `language` key); A10's fixture reads it there. No behaviour changed; suite 642/642.

**Walked: 2026-09-22 — pass (10/10).** 1.9.0 adds `--mode gray`. `node tests/test-oklch.js` → 642/642, exit 0. A10 verified live: `#696969` gray and grey JSON outputs differ only in the mode word. A1–A9 unchanged.

**Reviewed against v1.8.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Reviewed against v1.8.0 on 2026-08-19.** 1.8.0 moves the Reference scales table out of `SKILL.md` into `tests/reference-scales.md` and makes `test-oklch.js` read it. A9 added for the defect that move exposed. A1–A8 unchanged; the suite re-run at 637/637, exit 0.


**Reviewed against v1.7.1 on 2026-08-17.** 1.7.1 widens `familyEscapeWarning`'s yellow exemption from orange to orange-or-red — the drift is a rotation, not a destination — after a false positive on a real Amber ramp. A1–A7 unchanged; A8 added for the failure that admitted it.

**Walked: 2026-08-17 — pass (8/8).** `node tests/test-oklch.js` → **421/421 checks passed**, exit 0. A8 verified live: `#FFC330` dark now returns no `familyEscapeWarning` while its steps 1–2 still genuinely resolve to red (both halves pinned, so the fixture cannot quietly stop asserting anything), and `#6D6700` still warns for the light-end green escape. Behaviour change proven confined to warnings by a **22,160-scale diff against the 1.7.0 build**: 0 differing hexes, 200 differing warnings, all 200 asserted to be yellow-family ramps whose only escapes were orange/red — so no previously-generated ramp needs regenerating. A1–A3 unchanged and re-confirmed by the suite; A4–A7 checked by reading.

**Reviewed against v1.7.0 on 2026-08-16.** 1.7.0 adds cross-hue calibration (`--saturation`, `maxChromaAt`, `usableChromaAt`) and dedupes the family chroma ceilings. A1–A6 unchanged; A7 added for the failure that admitted the feature — a palette equalised on absolute chroma rather than on each hue's own fraction.

**Walked: 2026-08-16 — pass (7/7).** `node tests/test-oklch.js` → **419/419 checks passed**, exit 0. The ceiling dedup was proven output-identical by a 19,200-scale diff against the 1.6.0 build (1,500 sources × free/anchored/grey × light/dark × ceiling/no-ceiling, plus 1,200 peak-path scales) — zero differing. A7 verified live: calibrating the motivating trio at `--saturation 0.95` lands all three within 0.05 of the requested fraction while their absolute chromas stay 0.147–0.189 apart, which is exactly what equal-chroma destroys. A1 verified live in both modes at 1.6.0 (`#FFE629` anchored reproduces the source at step 4, `#7B2D8E` anchored dark at step 7); A2 backed by the suite's contrastWarning check; A3 verified live across free and grey × light and dark, zero warnings. A4–A6 checked by reading.

**One finding from the walk, recorded because no checker could have produced it:** the first two probes written for A7's gamut assertion were both vacuous. One round-tripped through `oklchToHex`, which clips channels and so returns a valid-looking hex for an out-of-gamut request (156 false escapes); its replacement used `oklchToRgb01`, which clamps to [0,1] internally and therefore cannot report a breach at all (300 — every case, uniformly, which is the tell). Both *ran*. Only the generator's own `isOutOfGamut` tests the claim, which is why it is now exported. A probe that cannot report the thing it is asked about is a finding about the probe, not a result.

These are behavioural cases for the skill as driven. They sit above `tests/test-oklch.js` (421 checks against `generate.js`), which remains the authority on the maths — run it too; it exits non-zero on any real failure.

## A1 · Anchored mode reproduces the source hex verbatim
Fixture: anchored mode with a brand hex, light and dark.
Assert: the anchor step renders the source hex exactly as supplied — not a nearest-perceptual approximation, in either mode.

Runs: node tests/test-oklch.js — "anchor-verbatim sweep"

## A2 · A sub-7:1 text step raises contrastWarning
Fixture: anchored mode where the source's own lightness pulls a text step below 7:1.
Assert: generation measures the actual WCAG ratio and returns a `contrastWarning` naming the step. The scale is still produced — the warning is surfaced, not silently corrected, because the anchor is the user's decision.

Runs: node tests/test-oklch.js — "contrastWarning fires for an anchored source in the text zone"

## A3 · Free and grey mode hold AAA at text steps
Fixture: free mode and grey mode, both light and dark.
Assert: measured WCAG ratio at every text step is ≥ 7:1, with no `contrastWarning`. A generated scale that needs a warning in free mode is a defect in the ramp, not an acceptable output.

Runs: node tests/test-oklch.js — "no reference scale trips the contrast warning (free, light+dark)"

## A4 · Hand-edited scales are not presented as reproducible (negative case)
Fixture: a ramp with a manual post-generation correction applied.
Assert: the provenance description does not imply the ramp is reproducible from source + mode + ceiling alone. No description field records manual edits, so the edit is stated explicitly instead of inherited silently.

Traced: 2026-08-17 — to SKILL.md's rule that no description field records a manual post-generation edit, so a hand-edited ramp has to say so explicitly.

## A5 · The formulas are never hand-computed in place of the script
Fixture: a request to generate a scale.
Assert: `generate.js` is run. `SKILL.md`'s formulas describe what that file does and are not a second specification to execute by hand.

Traced: 2026-08-17 — to SKILL.md's "Before generating a scale", which sends full scale generation to the bundled `generate.js`.

## A6 · A light hue without a verbatim requirement gets `--peak`, never anchored (negative case)
Fixture: a request for a ramp from a naturally-light source (yellow, amber, lime, orange, cyan region) where the exact hex carries no brand mandate.
Assert: the ramp is generated `free --peak N`, not `--mode anchored`. Anchored answers "must this hex appear verbatim?"; peak answers "where does this hue's vividness live?" — and using anchored as a peak-placement workaround stamps `verbatim` provenance onto a ramp with no brand claim, bends the shared L grid at the anchor, and smooths a neighbour nobody asked to move. Recorded because it happened at scale: five non-brand ramps in one real palette were anchored for exactly this reason before `--peak` existed (1.5.0). The mode-and-peak decision table under "Before generating a scale" is the guardrail this case checks.

Traced: 2026-08-17 — to the mode-and-peak decision table under SKILL.md's "Before generating a scale".

## A7 · A multi-ramp palette is calibrated by fraction, not by absolute chroma (negative case)
Fixture: several ramps that must read as peers, across hues with materially different sRGB headroom (e.g. yellow, green, magenta).
Assert: each source is set to the same *fraction* of its own hue's usable ceiling — `--saturation <f>` / `sourceAtSaturation` — and **not** to one shared chroma value. A shared absolute chroma is pinned to the weakest hue in the set, so every other ramp is muted to reach it. Recorded because it happened: a real trio was equalised at C 0.115 (the yellow's ceiling at the solid step), which cost the magenta ~40% of its chroma and returned a palette the designer rejected as flat. The generator must also not be asked for a fraction of sRGB's raw ceiling where a family ceiling binds first — `usableChromaAt` is the denominator, or every magenta reports as under-saturated against a number it can never reach.

Runs: node tests/test-oklch.js — "sourceAtSaturation: a calibrated trio sits at one fraction, not one chroma"

## A8 · A warning calibrated to one reference source is a defect, even while it passes
Fixture: a yellow-family ramp whose dark tail rotates one degree further than the skill's own reference yellow — e.g. Amber `#FFC330`, dark, whose steps 1–2 land at H 39.16/39.42.
Assert: no `familyEscapeWarning`. The exemption must be expressed as the *rotation* the yellow rule performs (negative for every step darker than the source, running orange → red), not as the one destination the reference source happens to reach. Recorded because it shipped that way: the check named `orange` alone and held only because `#CA8A04` stops at H 40.79, **0.79° short** of the red boundary — so its correctness was luck, and the first real ramp to travel further was warned about the behaviour the rule exists to produce. The paired negative half still binds: a light-end **green** escape (`#6D6700`) rotates the other way and must still warn. **The general lesson is the one to carry: a check whose passing depends on a single fixture's margin is untested, not verified** — ask what happens one degree past the fixture before trusting it.

Runs: node tests/test-oklch.js — "amber (#FFC330) dark: no warning for the warm drift running past orange into red"

## A9 · A fixture column nothing asserts is not a fixture
Fixture: the Reference scales table as it stood at v1.7.1 — six scales, 72 rows, each carrying L, OKLCH and hex — beside `test-oklch.js`, which inlined its own copy of the same six scales and asserted **hex only**.
Assert: every published column is asserted, or it is not published. Two of Yellow's chroma values had drifted from the engine — step 8 by 0.0001 and step 10 by 0.0015 — while their hexes still matched to the byte, so the suite passed throughout and the drift was invisible to every check in the repo. It was found by diffing the table against `generate.js` output during an unrelated move, not by any test.
Assert the second half, which is why the columns drifted at all: **two copies of one fixture set is one copy too many.** The markdown and the JS array were the same six scales maintained by hand in two places; only one of them was executed. There is now a single source, read by the suite.
Assert the guard is not vacuous: a `reference-scales.md` that parses to anything but 6 scales of 12 steps must **throw**, not quietly assert nothing. A first attempt to prove this planted a heading that still parsed cleanly, and the unchanged pass was almost read as the guard holding — a fixture that changes nothing reports the same as a check that does nothing.
Walked 2026-08-19, three directions by exit code: a wrong chroma fails one named check and exits 1; a deleted row aborts the run and exits 1; the restored file passes 637/637 and exits 0.

Walked live: 2026-08-19 — the reference fixture holed three ways by exit code: a wrong chroma fails one named check, a deleted row aborts the run, the restored file passes 637/637.

## A10 · The provenance word follows the project's dialect
Fixture: a project whose context document's `audit-settings` carries `"language": "en-US"`, generating a neutral ramp.
Assert: the run reads the dialect from the context document and passes `--mode gray`; every solid and alpha description says `gray mode` and none says `grey`; values are byte-identical to `--mode grey`. With no context document, or one saying en-GB, the default `grey mode` is written. Recorded because a real en-US switch left 24 `Palette/Gray` descriptions reading `grey mode`.

Runs: node tests/test-oklch.js — "dialect: gray provenance says gray mode"

## A11 · Contrast comes from luminance, not from OKLCH L

Fixture: six hues at the same OKLCH L — `#BD00BE`, `#0E8D00`, `#1C83F9`, `#E5B800`, `#D93025`, `#00A3A3` — generated in free mode.

Assert: the default equals `luminanceText: true`, whose cross-hue spread section 31 holds under 0.15 (these six measured 8.40–8.50:1 at step 10 against white, against 8.03–9.44:1 on the old schedule). With `--oklch-text` / `luminanceText: false`, `#1A6FBF` step 10 is the pre-2.0 `#005088`. `recover.js` returns `oklchText: true` for a ramp generated on the old schedule and leaves a current one unmarked. A drifted anchored ramp round-trips exactly on both schedules. `SKILL.md` never claims equal L makes contrast consistent across hues. Found by an article (Design Systems Journal, "Stop using OKLCH lightness…") whose claim reproduced here: the Overview said the opposite, and the schedule that fixed it was opt-in, so a ramp got it only if someone knew to ask.
Runs: node tests/test-oklch.js — "2.0 default equals luminanceText: true", "2.0 --oklch-text reproduces the pre-2.0 ramp", "2.0 recovery leaves a current ramp unmarked"

## A12 · Steps placed by OKLCH L say when their hue moved them across a threshold

Fixture: `#BD00BE` and `#D93025` in free mode, and `#6A6A6A` in grey mode.

Assert: violet's `contrastDriftWarning` names step 8 at 4.50:1 where a neutral at its L gives 4.12:1, across 4.5:1. Red's step 8 is 4.496:1 raw, so red gets no warning even though `contrastVsWhite` reads `4.5`. A grey ramp never gets one. `--table` prints it. No generated hex changes.
Runs: node tests/test-oklch.js — "2.1 drift: violet step 8 crosses 4.5:1 where a neutral does not, and is named", "2.1 drift: a neutral ramp never drifts", "2.1 drift: --table prints the warning"

## A13 · The collision and the round-trip are computed, never done by hand

Fixture: `#AC731A` and `#D5BF36` in free mode against `#E07000`; eight sources across every mode, light and dark.

Assert: `#AC731A` names steps 11 and 12 within 3° of the orange, each with both hues; `#D5BF36` names none; `--collide-with --table` prints the warning. Every step's hex converts back to its L within 0.01.
Runs: node tests/test-oklch.js — "2.2 collision: a low-H yellow names each of steps 9-12 within 3° of orange, with both hues", "2.2 collision: a yellow well clear of orange names none", "2.2 collision: --collide-with --table prints the steps and both hues", "2.2 round-trip: every step's hex converts back to its L within 0.01, light and dark, in every mode"
