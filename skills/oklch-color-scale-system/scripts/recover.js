#!/usr/bin/env node
// Parameter recovery — given an existing 12-step ramp, search for the source hex,
// mode (free/anchored), and ceiling setting that reproduces it.
//
// Without this, "re-source this palette" means guessing — and guessing goes wrong in
// a specific, common way: assuming free mode when a ramp is actually anchored (free
// mode never reproduces any step verbatim, so a ramp that has a clean, unclamped
// step is almost always anchored, not free).
//
// Usage:
//   node scripts/recover.js <hex1> <hex2> ... <hex12>
//   node scripts/recover.js --dark <hex1> ... <hex12>     (search against the dark L scale)
//
// Output: best-fit mode, source hex, anchor index (if anchored), ceiling setting,
// and the mean/max per-channel sRGB error (0-255 scale) against the target.

'use strict';
const { generateScale, hexToLinear, linearToOKLCH, oklchToHex, driftTowardReference, yellowHueScale, computeFactor, LIGHT_L, DARK_L } = require('./generate.js');

function hexToRgb255(hex) {
  hex = hex.replace('#', '');
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function scaleError(candidateSteps, targetHexes) {
  let sumErr = 0, maxErr = 0;
  for (let i = 0; i < 12; i++) {
    const a = hexToRgb255(candidateSteps[i].hex);
    const b = hexToRgb255(targetHexes[i]);
    const channelErrs = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])];
    const stepMean = (channelErrs[0] + channelErrs[1] + channelErrs[2]) / 3;
    sumErr += stepMean;
    maxErr = Math.max(maxErr, ...channelErrs);
  }
  return { mean: sumErr / 12, max: maxErr };
}

function oklchOf(hex) {
  const [r, g, b] = hexToLinear(hex);
  return linearToOKLCH(r, g, b); // [L, C, H]
}

// Try refining a candidate (H, C) with a local grid search — the structural guess
// (take a target step's own OKLCH as the candidate source) is usually close but not
// always exact, since hue nudges and gamut clamping can shift a step slightly away
// from the raw source it came from.
function refine(mode, dark, noCeiling, anchorHexHint, baseH, baseC, targetHexes, peakStep, luminanceText) {
  let best = null;
  const hSteps = [-4, -2, -1, -0.5, 0, 0.5, 1, 2, 4];
  const cSteps = [-0.03, -0.015, -0.005, 0, 0.005, 0.015, 0.03];
  hSteps.forEach(dh => {
    cSteps.forEach(dc => {
      const H = ((baseH + dh) % 360 + 360) % 360;
      const C = Math.max(0.01, baseC + dc);
      // Build a synthetic source hex at this candidate H/C, using the SAME L as the
      // anchor hint if anchored (so the anchor step reproduces close to verbatim),
      // or a mid-range L for free mode (L doesn't matter for free mode's own math,
      // only C and H survive into the generation — but we need a valid hex to feed in).
      const L = anchorHexHint != null ? anchorHexHint : 0.55;
      const hex = oklchToHex(L, C, H);
      let scale;
      try { scale = generateScale(hex, mode, { dark, noCeiling, peakStep: peakStep || null, luminanceText }); } catch (e) { return; }
      const err = scaleError(scale.steps, targetHexes);
      if (!best || err.mean < best.err.mean) best = { hex, mode, noCeiling, anchorIdx: scale.anchorIdx, peak: peakStep || null, err };
    });
  });
  return best;
}

function recoverWith(targetHexes, opts, luminanceText) {
  opts = opts || {};
  const dark = !!opts.dark;
  if (targetHexes.length !== 12) throw new Error('recoverParameters requires exactly 12 hex values');

  const targetOklch = targetHexes.map(oklchOf); // [[L,C,H], ...] per step

  const candidates = [];

  // Grey mode — cheapest to test, and should be tried first: if all 12 inputs are
  // achromatic, this is almost certainly the answer, and free/anchored mode can't
  // represent it at all (both apply a non-trivial chroma curve; grey mode holds C
  // constant at the source's own value). Any step works as the source guess since a
  // genuine grey ramp has the same C at every step by construction — step 9 is used
  // for consistency with the free-mode guess above, not because it's special here.
  {
    const [L9, C9, H9] = targetOklch[8];
    const greySourceHex = oklchToHex(L9, C9, H9);
    try {
      const scale = generateScale(greySourceHex, 'grey', { dark, luminanceText });
      const err = scaleError(scale.steps, targetHexes);
      candidates.push({ hex: greySourceHex, mode: 'grey', noCeiling: false, anchorIdx: null, err });
    } catch (e) { /* skip */ }
  }

  // Free mode candidates: step 9's own C as a chroma starting point, but H needs care.
  // Yellow's continuous drift shifts H even at the anchor (the base drift depends only
  // on sourceL and the step's own fixed L — see yellowDrift() in generate.js), so step
  // 9's raw observed H can be 10+ degrees away from the true source H. The relationship
  // is observedH9 = srcH - D * yellowHueScale(srcH), where D = clamp(70 * (srcL -
  // 0.52), -45, 45) and yellowHueScale fades the drift from 1 at srcH <= 105 to 0 at
  // srcH >= 125 (the lime-region hold). yellowHueScale is piecewise linear in srcH, so
  // instead of one closed-form inversion there are up to three regional solutions:
  // solve each region, keep the ones the authoritative yellowHueScale() confirms are
  // self-consistent (so a future edit to the scale's constants in generate.js breaks
  // this loudly instead of silently diverging), and refine every survivor.
  {
    const [, C9, H9] = targetOklch[8];
    const freeAnchorL = dark ? 0.70 : 0.52;
    const lGuesses = dark ? [0.30, 0.50, 0.70, 0.80, 0.90] : [0.45, 0.52, 0.55, 0.65, 0.75, 0.85];
    // Second chroma estimate, from the LIGHT-MID steps. Step 9's observed chroma is the
    // usual source-C guess (factor = 1.0 there), but for a vivid source the gamut clamp
    // can crush step 9 hard — a lime at C 0.190 renders step 9 at C 0.125 (L 0.52 has
    // far less chroma headroom than the source's own lightness), and every candidate
    // seeded from that reads 3+/255 off with no way for the ±0.03 refine grid to bridge
    // the gap. Steps 5-7 sit at wider-gamut lightness and their chroma is effSrcC ×
    // computeFactor(i, 8) with no clamp binding, so C_i / factor(i) recovers the true
    // source chroma almost exactly (measured 0.1902/0.1904/0.1892 against a true
    // 0.190). The median of the three is robust to one of them clamping after all.
    // Only added as an EXTRA candidate when it meaningfully exceeds C9 — when nothing
    // clamped, the two estimates coincide and the extra refine is skipped.
    const cLight = [4, 5, 6]
      .map(i => targetOklch[i][1] / computeFactor(i, 8))
      .sort((a, b) => a - b)[1];
    const cEstimates = cLight > C9 + 0.01 ? [C9, cLight] : [C9];
    ['normal', 'uncapped'].forEach(variant => {
      lGuesses.forEach(lGuess => {
        const D = Math.max(-45, Math.min(45, 70 * (lGuess - freeAnchorL)));
        const raw = [];
        raw.push(H9 + D);                                  // scale = 1 region (srcH <= 105)
        raw.push(H9);                                      // scale = 0 region (srcH >= 125)
        const denom = 1 + D / 20;                          // mid region: h = (H9 + 6.25*D) / (1 + D/20)
        if (Math.abs(denom) > 1e-6) raw.push((H9 + D * 125 / 20) / denom);
        const consistent = raw.filter(h => Math.abs((h - D * yellowHueScale(h)) - H9) < 0.01);
        const hues = [...new Set((consistent.length ? consistent : [H9 + D]).map(h => ((h % 360) + 360) % 360))];
        for (const invertedH of hues) {
          for (const cGuess of cEstimates) {
            const best = refine('free', dark, variant === 'uncapped', lGuess, invertedH, cGuess, targetHexes, null, luminanceText);
            if (best) candidates.push(best);
          }
        }
      });
      // Also keep the plain (non-inverted) guess as a fallback for non-yellow families,
      // where H9 already IS the true source H and no inversion is needed.
      for (const cGuess of cEstimates) {
        const plain = refine('free', dark, variant === 'uncapped', null, H9, cGuess, targetHexes, null, luminanceText);
        if (plain) candidates.push(plain);
      }
    });
  }

  // Free-mode --peak candidates. A peak ramp's chroma maximum is OBSERVABLE: it sits
  // at whichever step renders the highest chroma (gamut clamping can shave the true
  // peak for very vivid sources, but the argmax still lands at or next to the real
  // peak step). Rather than sweeping all twelve possible peaks (a 12x cost multiplier
  // on the free search), the observed argmax is tried as THE peak candidate, seeded
  // from that step's own C and H — the curve factor is 1.0 at the peak, so for an
  // unclamped ramp the peak step's chroma IS the effective source chroma, and refine's
  // grid covers the clamped residue. Skipped when the argmax is already step 9, where
  // the default free search covers it.
  {
    let peakIdx = 0;
    targetOklch.forEach(([, C], i) => { if (C > targetOklch[peakIdx][1]) peakIdx = i; });
    if (peakIdx !== 8) {
      // The argmax and BOTH its neighbours are tried as the candidate peak: gamut
      // clamping can shave the true peak step harder than the step beside it (a light
      // amber's curve peaks at step 5 but renders its chroma maximum at 6, because
      // fixed-L step 5 is lighter than the source and the clamp bites there), so the
      // rendered argmax is only guaranteed to land within one step of the real peak.
      //
      // Seeding — every part of which reads from the ARGMAX step, deliberately.
      // The candidate peak step itself may not be able to hold the source chroma at
      // all (that is exactly WHY the rendered maximum moved off it: a light amber's
      // peak-5 step sits at fixed L 0.89 where C 0.163 is out of gamut, so
      // oklchToHex would clip a source built there and corrupt the candidate). The
      // argmax step, by contrast, provably rendered its chroma unclamped:
      //   L — the source hex is built at the argmax step's fixed L, where the seeded
      //     chroma is guaranteed encodable.
      //   C — the argmax step's chroma with the curve factor unwound relative to the
      //     candidate peak (C_argmax / computeFactor(argmax, pi)) recovers the true
      //     source chroma even when the real peak step was clamped.
      //   H — the argmax step's observed hue: for yellow, drift is zero at zero
      //     L-distance from the source, and building the source at the argmax L makes
      //     that step the zero point; any residual source-L mismatch is a uniform
      //     hue offset that refine's grid absorbs as a source-hue shift.
      const lScaleForHint = dark ? DARK_L : LIGHT_L;
      const cSeedBase = targetOklch[peakIdx][1];
      const hSeed = targetOklch[peakIdx][2];
      const lHint = lScaleForHint[peakIdx];
      for (const pi of [peakIdx - 1, peakIdx, peakIdx + 1]) {
        if (pi < 0 || pi > 11 || pi === 8) continue;
        const cSeed = cSeedBase / computeFactor(peakIdx, pi);
        ['normal', 'uncapped'].forEach(variant => {
          const best = refine('free', dark, variant === 'uncapped', lHint, hSeed, cSeed, targetHexes, pi + 1, luminanceText);
          if (best) candidates.push(best);
        });
      }
    }
  }

  // Anchored mode candidates: try EVERY step index as the presumed anchor, using that
  // step's own OKLCH directly as the source guess (anchor = verbatim, so this should
  // already be very close if that step really is the anchor). Tag each with whether it
  // actually satisfies the anchored-mode invariant (source reproduces verbatim at the
  // anchor step) — a candidate that doesn't satisfy this isn't a valid anchored fit
  // regardless of its reconstruction error; see the invariant check below.
  for (let presumedAnchor = 0; presumedAnchor < 12; presumedAnchor++) {
    const [L, C, H] = targetOklch[presumedAnchor];
    ['normal', 'uncapped'].forEach(variant => {
      const best = refine('anchored', dark, variant === 'uncapped', L, H, C, targetHexes, null, luminanceText);
      if (best && best.anchorIdx === presumedAnchor) {
        best.anchorVerbatimOk = best.hex.toUpperCase() === targetHexes[presumedAnchor].toUpperCase();
        candidates.push(best);

        // Drift recovery: the current drift formula (H[i] = anchorH + cap*(11-i)/11)
        // has exactly one free parameter and inverts in closed form —
        // cap = (H[i] - anchorH) * 11 / (11 - i) — for any non-anchor, non-last-index
        // step. Tried for every candidate whose raw fit isn't already excellent (a
        // poor anchored fit is exactly what drift, applied on top of an otherwise-
        // correct anchor, produces) — using the TARGET's own value at presumedAnchor
        // directly as the drift-recovery source, not refine()'s possibly-perturbed
        // guess. This matters: refine() optimizes its guess against the whole (already
        // drifted) 12-step target, so for a genuinely drifted ramp it rarely lands
        // exactly on the true anchor even when that position IS correct — gating this
        // on `best.anchorVerbatimOk` (which checks refine()'s guess) meant the gate
        // almost never fired for the exact case it exists to catch. Using the target's
        // own raw value sidesteps that: if this position really is the anchor, that
        // value IS verbatim by definition, trivially.
        if (best.err.mean > 0.5) {
          const anchorSourceHex = targetHexes[presumedAnchor];
          const rebuilt = generateScale(anchorSourceHex, 'anchored', { dark, noCeiling: variant === 'uncapped', luminanceText });
          const anchorH = rebuilt.steps[presumedAnchor].H;
          const impliedCaps = [];
          for (let i = 0; i < 12; i++) {
            if (i === presumedAnchor || i === 11) continue;
            // Guard: hue is numerically unstable at very low chroma (near the
            // achromatic center, small measurement noise swings H wildly) — skip
            // steps where the TARGET's own chroma is too low to trust its hue.
            const [, targetC] = targetOklch[i];
            if (targetC < 0.03) continue;
            const [, , targetH] = targetOklch[i];
            let diff = targetH - anchorH;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            const cap = (diff * 11) / (11 - i);
            impliedCaps.push(cap);
          }
          if (impliedCaps.length >= 2) {
            impliedCaps.sort((a, b) => a - b);
            const medianCap = impliedCaps[Math.floor(impliedCaps.length / 2)];
            const refH = ((anchorH + medianCap) % 360 + 360) % 360;
            // The median cap lands within about a degree, not exactly: the target's
            // hues are read back from 8-bit hexes. A small search around it finds
            // the reference that reproduces the ramp, where the median alone left
            // steps a unit off in one channel.
            let refHex = null, err = null;
            for (let d = -2; d <= 2; d += 0.1) {
              const h = ((refH + d) % 360 + 360) % 360;
              const hx = oklchToHex(0.5, 0.15, h); // only H matters to driftTowardReference; L/C are placeholders
              const e = scaleError(driftTowardReference(rebuilt, hx).steps, targetHexes);
              if (!err || e.mean < err.mean) { refHex = hx; err = e; }
            }
            if (err.mean < best.err.mean) {
              candidates.push({
                hex: anchorSourceHex, mode: 'anchored', noCeiling: variant === 'uncapped',
                anchorIdx: presumedAnchor, err, anchorVerbatimOk: true,
                // `driftedToward` is the HEX that driftTowardReference() itself accepts, so a
                // recovered result feeds straight back into the generator without conversion.
                // An earlier version returned the bare hue number here, which looked usable but
                // threw (`hex.replace is not a function`) the moment anyone tried to round-trip
                // it — recovery output should be directly re-runnable by construction. The raw
                // hue is kept alongside for reporting/diffing, not as the primary value.
                driftedToward: refHex,
                driftedTowardHue: oklchOf(refHex)[2]
              });
            }
          }
        }
      }
    });
  }

  candidates.sort((a, b) => a.err.mean - b.err.mean);

  // The anchored-mode invariant is a free self-check: by definition, an anchored
  // candidate's source hex must equal the target's own value at the claimed anchor
  // step. A candidate that violates this isn't a valid anchored fit no matter how low
  // its reconstruction error is — most often it means the ramp had drift or another
  // manual adjustment applied on top of generation, which recovery has no model for
  // (see "Parameter recovery" in SKILL.md). Prefer the best candidate that actually
  // satisfies its own mode's invariant; if the overall best-error candidate doesn't,
  // surface that loudly as a warning rather than silently returning a self-contradictory
  // "anchored" result.
  const validCandidates = candidates.filter(c => c.mode !== 'anchored' || c.anchorVerbatimOk !== false);
  const best = validCandidates[0] || candidates[0] || null;
  if (best && candidates[0] && best !== candidates[0]) {
    best.warning = `A lower-error fit exists (mean error ${candidates[0].err.mean.toFixed(2)}) but was rejected because it claims anchored mode without reproducing the source verbatim at its own anchor step — the ramp likely had drift or a manual adjustment applied on top of generation, which recovery cannot model. This result is the best fit that doesn't contradict its own mode's definition.`;
  }
  // The API (hex/err.mean/err.max) and the CLI (source/meanError/maxError) have used
  // different names for the same values since the CLI was first built for readability
  // — anything written against one didn't read the other. Rather than rename either
  // (risking existing code that already reads the original names), add the CLI's
  // names here too, additively, so both conventions work from the API result directly.
  if (best) {
    best.source = best.hex;
    best.meanError = Math.round(best.err.mean * 100) / 100;
    best.maxError = best.err.max;
  }
  return best;
}

// A ramp generated before 2.0.0 has its text steps at the fixed OKLCH L; one
// generated since has them luminance-targeted. Both are tried, and the better
// fit says which — `oklchText` marks the older schedule, the flag that
// reproduces it. On a tie the current default wins.
function recoverParameters(targetHexes, opts) {
  const current = recoverWith(targetHexes, opts, true);
  const older = recoverWith(targetHexes, opts, false);
  if (older && (!current || older.err.mean < current.err.mean)) return Object.assign(older, { oklchText: true });
  return current;
}

// Builds the CLI's output object, including the warning surfacing and general
// poor-fit threshold — separated from main() so it's testable without spawning a
// subprocess, the same pattern used for generate.js's buildTable().
function buildCliOutput(result) {
  const meanError = Math.round(result.err.mean * 100) / 100;
  const maxError = result.err.max;

  // A general poor-fit threshold, separate from the invariant-violation warning above:
  // even when no anchored candidate was rejected for self-contradiction, a high error
  // means something about the ramp isn't well-explained by any searched combination of
  // mode/source/ceiling — most often a manual adjustment (drift or otherwise) that
  // recovery has no model for. Thresholds are not exact science; they're calibrated
  // against what "clean" fits look like elsewhere in this file's own test suite (well
  // under 1.0 mean error) versus what a known-drifted ramp measures (5+ mean, 20+ max).
  const poorFit = meanError > 3 || maxError > 20;

  const out = {
    mode: result.mode,
    source: result.hex,
    anchorIdx: result.anchorIdx,
    anchorStep: result.anchorIdx === null ? null : result.anchorIdx + 1,
    noCeiling: result.noCeiling,
    meanError,
    maxError
  };
  // A --peak ramp's parameters are incomplete without the peak — same boundary
  // principle as driftedToward below: anything needed to regenerate the ramp must
  // appear in the CLI output.
  if (result.peak) out.peak = result.peak;
  // Same boundary principle: the older text schedule is a regeneration parameter.
  if (result.oklchText) out.oklchText = true;
  // Drift was computed by recoverParameters() but dropped by this CLI entry point —
  // the same boundary bug that once swallowed `warning`, and worse in its effect. A
  // drifted ramp recovers with mean/max error 0, so the CLI reported a *perfect* score
  // for parameters that do NOT regenerate the input: plain anchored '#24009B' produces
  // a visibly different ramp from the drifted one it was recovered from. A zero-error
  // result gives the reader no reason to look further, so the omission is silent in a
  // way even a poor fit isn't. Anything the API recovers that's needed to reproduce the
  // ramp has to appear here, because this document treats the CLI as the primary entry point.
  if (result.driftedToward) {
    out.driftedToward = result.driftedToward;
    out.driftedTowardHue = Number(result.driftedTowardHue.toFixed(2));
  }
  // The invariant-violation warning (set by recoverParameters itself) was previously
  // computed by the API but silently dropped by this CLI entry point — the exact
  // scenario the warning exists to surface loudly was invisible from the documented
  // entry point. Surfaced here, plus a general poor-fit note when error is high even
  // without an invariant violation, since a max error of 20+ out of 255 is a poor fit
  // regardless of whether any specific rule was broken.
  if (result.warning) out.warning = result.warning;
  else if (poorFit) out.warning = `This is a poor fit (mean error ${meanError}, max error ${maxError} out of 255) even though no specific invariant was violated. The ramp likely has a manual adjustment (drift or otherwise) applied on top of generation that this tool has no model for — treat the recovered parameters as approximate, not exact.`;

  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const dark = argv.includes('--dark');
  // Accept hexes with or without a leading '#' — in most shells an unquoted '#…'
  // argument is a comment, so requiring the '#' silently ate every unquoted hex and
  // reported "exactly 12 required". Validate the format instead of the prefix; a
  // malformed value (e.g. '#FFF') previously passed the old startsWith('#') filter
  // straight into a NaN cascade.
  const hexes = argv.filter(a => a !== '--dark');
  const bad = hexes.filter(a => !/^#?[0-9a-fA-F]{6}$/.test(a));
  if (hexes.length !== 12 || bad.length) {
    if (bad.length) console.error(`Invalid hex value(s): ${bad.join(', ')} (expected 6-digit hex like '#1A6FBF')`);
    console.error("Usage: node scripts/recover.js [--dark] <hex1> <hex2> ... <hex12>  (exactly 12 six-digit hex values; quote them — unquoted '#' starts a shell comment)");
    process.exit(1);
  }
  // Normalize to '#RRGGBB' before recovery — the anchored-verbatim invariant compares
  // candidate hex (always '#'-prefixed) against the target strings verbatim, so a
  // '#'-less input would spuriously fail the invariant for every anchored candidate.
  const normalized = hexes.map(h => '#' + h.replace(/^#/, '').toUpperCase());
  const result = recoverParameters(normalized, { dark });
  if (!result) {
    console.log('No fit found.');
    process.exit(1);
  }
  console.log(JSON.stringify(buildCliOutput(result), null, 2));
}

if (require.main === module) main();

module.exports = { recoverParameters, scaleError, buildCliOutput };
