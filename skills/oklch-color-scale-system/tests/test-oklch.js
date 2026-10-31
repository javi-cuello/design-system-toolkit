#!/usr/bin/env node
// Regression test suite for oklch-color-scale-system.
// Run with: node tests/test-oklch.js   (from the skill directory)
// Consolidates every check performed manually during development into a single
// re-runnable suite. Exits non-zero if anything fails — safe to wire into CI.

'use strict';
const fs = require('fs');
const path = require('path');
const {
  generateScale, generateAlphaScale, driftTowardReference, detectFamily, hexToLinear, linearToOKLCH,
  maxChromaAt, usableChromaAt, sourceAtSaturation, oklchToHex, isOutOfGamut, FAMILY_C_CEILING
} = require('../scripts/generate.js');

let pass = 0, fail = 0;
const failures = [];

function check(label, condition, detail) {
  if (condition) { pass++; }
  else { fail++; failures.push(detail ? `${label} — ${detail}` : label); }
}

function hexFromOKLCH(L, C, H) {
  const hRad = H * Math.PI / 180;
  const a = C * Math.cos(hRad), bv = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * bv;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const rl = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055);
  const clamp = x => Math.max(0, Math.min(255, Math.round(x * 255)));
  return '#' + [rl, gl, bl].map(toSrgb).map(clamp).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ============================================================
// 1. Reference scale tables — 72 solid values across 6 scales, read from
//    reference-scales.md so the fixtures have exactly one home
// ============================================================

// Fixtures live in reference-scales.md rather than inline here. One copy, in the
// place a reader looks for expected output, and every column asserted — the C
// column had drifted on two Yellow steps while their hexes still matched, which a
// hex-only suite cannot see. If this file cannot be read the suite fails loudly
// rather than silently checking nothing.
const REFERENCE_SCALES = (() => {
  const md = fs.readFileSync(path.join(__dirname, 'reference-scales.md'), 'utf8');
  const blocks = md.split(/^## /m).slice(1);
  const scales = blocks.map(b => {
    const head = b.split('\n')[0];
    const name = head.split(' — ')[0].trim();
    const hex = head.match(/`(#[0-9A-Fa-f]{6})`/)[1];
    const rows = [...b.matchAll(/^\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)\s*\|\s*(#[0-9A-F]{6})\s*\|/gm)];
    return {
      name, hex,
      mode: /grey mode/.test(head) ? 'grey' : 'free',
      dark: /dark/.test(head),
      expect: rows.map(r => r[6]),
      expectL: rows.map(r => r[2]),
      expectC: rows.map(r => r[4]),
      expectH: rows.map(r => r[5]),
    };
  });
  if (scales.length !== 6 || scales.some(s => s.expect.length !== 12)) {
    throw new Error(`reference-scales.md parsed as ${scales.length} scales / ` +
      `${scales.map(s => s.expect.length).join(',')} steps — expected 6 x 12`);
  }
  return scales;
})();

REFERENCE_SCALES.forEach(r => {
  const scale = generateScale(r.hex, r.mode, { dark: r.dark });
  scale.steps.forEach((s, i) => {
    check(`ref:${r.name} step${i + 1} hex`, s.hex === r.expect[i], `got ${s.hex}, expected ${r.expect[i]}`);
    check(`ref:${r.name} step${i + 1} L`, s.L.toFixed(3) === r.expectL[i],
      `got ${s.L.toFixed(3)}, expected ${r.expectL[i]}`);
    check(`ref:${r.name} step${i + 1} C`, s.C.toFixed(4) === r.expectC[i],
      `got ${s.C.toFixed(4)}, expected ${r.expectC[i]}`);
    check(`ref:${r.name} step${i + 1} H`, s.H.toFixed(2) === r.expectH[i],
      `got ${s.H.toFixed(2)}, expected ${r.expectH[i]}`);
  });
});

// ============================================================
// 2. Alpha reference tables — neutral light (12) + neutral dark (12)
// ============================================================

const NEUTRAL_ALPHA_LIGHT = [0.0086,0.030,0.073,0.1159,0.1545,0.2961,0.4292,0.5579,0.6438,0.7639,0.867,0.91373];
const NEUTRAL_ALPHA_DARK  = [0.0714,0.0952,0.123,0.1508,0.1825,0.2857,0.3929,0.5079,0.627,0.7262,0.8413,0.9722];

{
  const scale = generateScale('#6A6A6A', 'grey', { dark: false });
  const alpha = generateAlphaScale(scale);
  alpha.forEach((a, i) => check(`alpha-light step${i + 1}`, Math.abs(a.alpha - NEUTRAL_ALPHA_LIGHT[i]) < 0.001,
    `got ${a.alpha}, expected ~${NEUTRAL_ALPHA_LIGHT[i]}`));
}
{
  const scale = generateScale('#6A6A6A', 'grey', { dark: true });
  const alpha = generateAlphaScale(scale);
  alpha.forEach((a, i) => check(`alpha-dark step${i + 1}`, Math.abs(a.alpha - NEUTRAL_ALPHA_DARK[i]) < 0.001,
    `got ${a.alpha}, expected ~${NEUTRAL_ALPHA_DARK[i]}`));
}

// ============================================================
// 3. Chromatic alpha — Indigo (anchored, no-ceiling), verified against
//    documented reference including the known +3/255 zero-channel offset
// ============================================================

{
  const scale = generateScale('#9747FF', 'anchored', { dark: false, noCeiling: true, luminanceText: false });
  const alpha = generateAlphaScale(scale);
  const expectBase = ['#5500FF','#4000FF','#4000FF','#4800FF','#4600FF','#5000FF','#5B00FF','#6F00FF','#5600D5','#5100AF','#490096','#370074'];
  alpha.forEach((a, i) => check(`alpha-indigo base step${i + 1}`, a.base === expectBase[i], `got ${a.base}, expected ${expectBase[i]}`));
}

// ============================================================
// 4. No-ceiling flat-spot sweep (indigo/purple/magenta)
//    Excludes the intentional background-cap zone (steps 1-5).
// ============================================================

{
  const families = [{ name: 'indigo', hRange: [270, 300] }, { name: 'purple', hRange: [300, 320] }, { name: 'magenta', hRange: [320, 360] }];
  const lValues = [0.20, 0.45, 0.60, 0.75, 0.90];

  function sweep(cValues) {
    let flatSpots = 0, tested = 0;
    ['free', 'anchored'].forEach(mode => {
      [false, true].forEach(dark => {
        families.forEach(fam => {
          for (let h = fam.hRange[0] + 2; h < fam.hRange[1]; h += 8) {
            cValues.forEach(c => lValues.forEach(l => {
              tested++;
              const hex = hexFromOKLCH(l, c, h);
              const scale = generateScale(hex, mode, { dark, noCeiling: true });
              for (let i = 5; i < scale.steps.length - 1; i++) {
                if (Math.abs(scale.steps[i].C - scale.steps[i + 1].C) < 0.0001 && scale.steps[i].C > 0.01) { flatSpots++; break; }
              }
            }));
          }
        });
      });
    });
    return { flatSpots, tested };
  }

  // Realistic range (up to ~60% above the highest validated real source in this skill, C 0.172) — must be clean.
  const realistic = sweep([0.10, 0.15, 0.20, 0.25, 0.30, 0.35]);
  check('no-ceiling flat-spots, realistic C ≤ 0.35', realistic.flatSpots === 0, `${realistic.flatSpots}/${realistic.tested} flat spots found`);

  // Extreme range — known to occasionally produce a genuine flat spot (e.g. magenta H≈330 at
  // recovered source C≈0.27+, roughly 60% above any validated real source). Not asserted clean;
  // this branch documents the known behavior rather than failing the suite on an unrealistic input.
  const extreme = sweep([0.40, 0.45, 0.50]);
  console.log(`  (info) no-ceiling flat-spots, extreme C 0.40-0.50: ${extreme.flatSpots}/${extreme.tested} — expected to be occasionally nonzero, not a failure`);
}

// ============================================================
// 5. Dark-anchored mode: anchor step L must exactly match the
//    ACTUAL recovered source L (not the requested L, which may be
//    gamut-invalid for extreme synthetic inputs).
// ============================================================

{
  const families = { red: 20, orange: 55, yellow: 100, green: 150, cyan: 195, blue: 245, indigo: 285, purple: 310, magenta: 340 };
  let mismatches = 0, tested = 0;
  Object.entries(families).forEach(([, h]) => {
    [0.20, 0.35, 0.50, 0.65, 0.80].forEach(l => {
      [0.12, 0.16].forEach(c => {
        tested++;
        const hex = hexFromOKLCH(l, c, h);
        const scale = generateScale(hex, 'anchored', { dark: true });
        const actualSourceL = parseFloat(scale.sourceOklch.match(/oklch\(([\d.]+)/)[1]);
        if (Math.abs(scale.steps[scale.anchorIdx].L - actualSourceL) > 0.001) mismatches++;
      });
    });
  });
  check('dark-anchored L-override invariant', mismatches === 0, `${mismatches}/${tested} mismatches`);
}

// ============================================================
// 6. Anchor-verbatim invariant (anchored mode, light + dark)
//
// Covers a gap section 5 doesn't catch: it only checks that the anchor's
// L matches. L alone still passes even when the chroma ceiling, the
// dark-mode 0.85x reduction, or a hue-family nudge has altered C or H
// at the anchor — so the documented "verbatim" guarantee could break
// silently. This asserts the full hex.
// ============================================================

{
  const cases = [
    ['yellow light',      '#FFC53D', false], // anchor at step 5, yellow drift
    ['indigo light',      '#24009B', false], // chroma ceiling 0.18 + H nudge at steps 9-12
    ['indigo dark',       '#E0E7FF', true ], // dark 0.85x reduction
    ['blue light',        '#2228DF', false], // H nudge -4 deg at steps 10-12
    ['blue dark',         '#93B7FF', true ],
    ['green light',       '#2DA05D', false],
    ['green dark',        '#3B955C', true ], // dark 0.85x reduction
    ['purple light',      '#8E4EC6', false], // chroma ceiling 0.15
    ['magenta light',     '#AB4ABA', false], // chroma ceiling 0.20
    ['red light',         '#E5484D', false],
  ];

  cases.forEach(([label, hex, dark]) => {
    [false, true].forEach(noCeiling => {
      const scale = generateScale(hex, 'anchored', { dark, noCeiling });
      const got = scale.steps[scale.anchorIdx].hex;
      check(
        `anchor-verbatim ${label}${noCeiling ? ' (no-ceiling)' : ''}`,
        got === hex.toUpperCase(),
        `anchor step ${scale.anchorIdx + 1} produced ${got}, expected ${hex.toUpperCase()}`
      );
    });
  });

  const sweepFamilies = { red: 20, orange: 55, yellow: 100, green: 150, cyan: 195, blue: 245, indigo: 285, purple: 310, magenta: 340 };
  let sweepFails = 0, sweepTested = 0;
  Object.values(sweepFamilies).forEach(h => {
    [0.30, 0.45, 0.60, 0.75, 0.90].forEach(l => {
      [0.10, 0.16, 0.22].forEach(c => {
        [false, true].forEach(dark => {
          sweepTested++;
          const hex = hexFromOKLCH(l, c, h);
          const scale = generateScale(hex, 'anchored', { dark });
          if (scale.steps[scale.anchorIdx].hex !== hex) sweepFails++;
        });
      });
    });
  });
  check('anchor-verbatim sweep', sweepFails === 0, `${sweepFails}/${sweepTested} anchors not verbatim`);
}

// ============================================================
// 7. Family boundary robustness — no crashes/anomalies at any
//    of the 9 boundaries, at exact cutover and small offsets.
// ============================================================

{
  const boundaries = [0, 40, 70, 130, 170, 220, 270, 300, 320];
  let anomalies = 0, tested = 0;
  boundaries.forEach(b => {
    [-8, -4, -2, -1, 0, 1, 2, 4, 8].forEach(offset => {
      const h = ((b + offset) % 360 + 360) % 360;
      tested++;
      const hex = hexFromOKLCH(0.55, 0.15, h);
      const scale = generateScale(hex, 'free', { dark: false });
      if (scale.steps.some(s => isNaN(s.L) || isNaN(s.C) || isNaN(s.H) || s.C < -0.001)) anomalies++;
    });
  });
  check('family boundary robustness', anomalies === 0, `${anomalies}/${tested} anomalies`);
}

// ============================================================
// 8. Broad fuzz test — random hex, every mode combination,
//    checking for crashes / NaN / malformed output only.
// ============================================================

{
  let crashes = 0, invalid = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const hex = '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0').toUpperCase();
    const mode = ['free', 'anchored', 'grey'][i % 3];
    const dark = i % 2 === 0;
    const noCeiling = i % 5 === 0;
    try {
      const scale = generateScale(hex, mode, { dark, noCeiling });
      const bad = scale.steps.some(s => isNaN(s.L) || isNaN(s.C) || isNaN(s.H) || !/^#[0-9A-F]{6}$/.test(s.hex));
      if (bad) invalid++;
      const alpha = generateAlphaScale(scale);
      if (alpha.some(a => isNaN(a.alpha) || a.alpha < 0 || a.alpha > 1)) invalid++;
    } catch (e) { crashes++; }
  }
  check('fuzz: no crashes', crashes === 0, `${crashes}/${N} crashed`);
  check('fuzz: no invalid output', invalid === 0, `${invalid}/${N} invalid`);
}

// ============================================================
// 9. Drift-toward-reference: anchor must never move, output must
//    always be valid, across random base/reference pairs.
// ============================================================

{
  let anchorMovedWronglyInAnchored = 0, anchorNeverMovedInFree = 0, invalid = 0;
  const N = 500;
  for (let i = 0; i < N; i++) {
    const baseHex = '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0').toUpperCase();
    const refHex = '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0').toUpperCase();
    const mode = i % 2 === 0 ? 'free' : 'anchored';
    const dark = i % 3 === 0;
    const scale = generateScale(baseHex, mode, { dark });
    const before = scale.steps[scale.anchorIdx].hex;
    const drifted = driftTowardReference(scale, refHex);
    const moved = drifted.steps[drifted.anchorIdx].hex !== before;
    // Anchored mode's anchor must NEVER move (protects a real verbatim guarantee).
    // Free mode's "anchor" (curve-peak position, nothing verbatim there) SHOULD move
    // like any other step, unless the reference happens to sit at the same hue already.
    if (mode === 'anchored' && moved) anchorMovedWronglyInAnchored++;
    if (mode === 'free' && !moved) anchorNeverMovedInFree++;
    if (drifted.steps.some(s => isNaN(s.L) || isNaN(s.C) || isNaN(s.H))) invalid++;
  }
  check('drift-toward-reference: anchored mode\'s anchor never moves', anchorMovedWronglyInAnchored === 0, `${anchorMovedWronglyInAnchored}/${N} moved when it shouldn't`);
  // Some fraction of free-mode cases legitimately show no movement (reference hue
  // coincidentally matches, or lands very close) — this just checks it's not ALWAYS
  // frozen, confirming the exemption really was removed for free mode.
  check('drift-toward-reference: free mode\'s anchor drifts like any other step (not universally frozen)', anchorNeverMovedInFree < N / 2, `${anchorNeverMovedInFree}/${N} never moved`);
  check('drift-toward-reference: valid output', invalid === 0, `${invalid}/${N} invalid`);

  // Mode-coherence, third formula tried here: absolute step schedule (fixed line in
  // step-index space, not keyed to distance from the anchor at all). Two anchor-
  // relative formulas were tried and rejected first: L-distance (mode-incoherent,
  // opposite rotation directions between light/dark) and signed step-index distance
  // at a fixed rate (fixed the direction problem, but never actually reached the
  // reference hue anywhere in the ramp unless the anchor sat at step 1 — confirmed by
  // an external review reproducing a case where drift toward a reference 19° away
  // produced a ramp that peaked at the anchor's own hue and never got any closer).
  {
    // Property 1 — the critical regression check: after drift, at least one step's
    // hue must be closer to the reference than the anchor's own hue is. This is
    // exactly the property the signed-fixed-rate formula silently dropped, and it's
    // the property whose absence defines "drift toward reference" not doing what its
    // name says.
    const hrLight = generateScale('#24009B', 'anchored', { dark: false });
    const ref = '#2DAFB8';
    const [, , refH] = linearToOKLCH(...hexToLinear(ref));
    const hrDrifted = driftTowardReference(hrLight, ref);
    const anchorH = hrDrifted.steps[hrDrifted.anchorIdx].H;
    function circDist(a, b) { let d = Math.abs(a - b); return d > 180 ? 360 - d : d; }
    const anchorDistToRef = circDist(anchorH, refH);
    const closestStepDist = Math.min(...hrDrifted.steps.map(s => circDist(s.H, refH)));
    check('drift: at least one step ends up closer to the reference than the anchor is', closestStepDist < anchorDistToRef - 0.5, `anchor dist=${anchorDistToRef.toFixed(1)}°, closest step dist=${closestStepDist.toFixed(1)}°`);

    // Property 2 — reaches the reference exactly at step 1 (index 0), by construction
    // of the schedule: H[0] = anchorH + cap*(11-0)/11 = anchorH + cap = refH exactly.
    check('drift: reaches the reference exactly at step 1', Math.abs(hrDrifted.steps[0].H - refH) < 0.5, `step1 H=${hrDrifted.steps[0].H.toFixed(2)}, refH=${refH.toFixed(2)}`);

    // Property 3 — monotonic everywhere EXCEPT possibly a single spike at the anchor
    // itself (the documented residual: this schedule's natural fixed point is always
    // step 12, so forcing the real anchor back to its verbatim value creates a one-step
    // seam when the anchor isn't at step 12 — but every OTHER step should still follow
    // the smooth schedule). This is a fundamentally different, much narrower failure
    // mode than the V-shape the unsigned-distance formula produced across half the ramp.
    const midRampScale = generateScale('#5B3FA8', 'anchored', { dark: true }); // anchor lands mid-ramp
    const midDrifted = driftTowardReference(midRampScale, '#C94F9F');
    const midAnchorIdx = midDrifted.anchorIdx;
    const huesExcludingAnchor = midDrifted.steps.map(s => s.H).filter((_, i) => i !== midAnchorIdx);
    let monotonicExcludingAnchor = true;
    for (let i = 1; i < huesExcludingAnchor.length; i++) {
      if ((huesExcludingAnchor[i] - huesExcludingAnchor[i - 1]) * (huesExcludingAnchor[1] - huesExcludingAnchor[0]) < -0.5) monotonicExcludingAnchor = false;
    }
    check('drift: monotonic everywhere except the single expected anchor spike', monotonicExcludingAnchor, midDrifted.steps.map(s => s.H.toFixed(0)).join(', '));

    // Property 4 — light and dark get the SAME hue at the SAME step number, since the
    // schedule depends only on step index and the anchor/reference hues, not on where
    // the anchor happens to sit. Divergence should be 0 everywhere except at whichever
    // step index is each mode's own anchor (a "residual" the skill documents as
    // unavoidable, localized to those specific steps, not a whole-ramp shape mismatch).
    const lSrc = generateScale('#5B5BD6', 'anchored', { dark: false });
    const dSrc = generateScale('#5B5BD6', 'anchored', { dark: true });
    const lDrift = driftTowardReference(lSrc, '#C94F9F');
    const dDrift = driftTowardReference(dSrc, '#C94F9F');
    let nonAnchorDivergenceZero = true;
    for (let i = 0; i < 12; i++) {
      if (i === lDrift.anchorIdx || i === dDrift.anchorIdx) continue; // residual steps, expected to diverge
      const div = circDist(lDrift.steps[i].H, dDrift.steps[i].H);
      if (div > 0.5) nonAnchorDivergenceZero = false;
    }
    check("drift: same-step divergence is exactly 0 at every step except each mode's own anchor", nonAnchorDivergenceZero);
  }

  // Note: earlier versions of this test asserted properties specific to the two
  // rejected formulas (unsigned-distance monotonicity, signed-formula constant-offset
  // divergence) — replaced above with tests of the properties the current formula
  // actually has, including the critical "reaches the reference" regression check.

  // Provenance must survive drift — a real bug caught while building this: the first
  // implementation silently dropped every non-anchor step's figmaSuffix and full
  // figmaDescription (falling back to a bare oklch string with no source/mode info)
  // because finalize() wasn't given the original step's provenance to carry forward.
  {
    const scale = generateScale('#1A6FBF', 'free', { dark: false });
    const drifted = driftTowardReference(scale, '#8040FF');
    const desc = drifted.steps[0].figmaDescription;
    check('drift preserves provenance in description', desc.includes('#1A6FBF') && desc.includes('free mode'), desc);
    check('drift preserves figmaSuffix on the source step', drifted.steps[8].figmaSuffix === '-source', drifted.steps[8].figmaSuffix);

    // Drift's one parameter (the reference hex) belongs in the description — without
    // it, a drifted ramp's description implies it's fully reproducible from source and
    // mode alone, when drift is a separate, undocumented-otherwise operation on top.
    check('drift: reference hex appears in drifted steps\' description', drifted.steps[0].figmaDescription.includes('drift toward #8040FF'), drifted.steps[0].figmaDescription);
    // The anchor's description should NOT get the drift note — but only in anchored
    // mode, where the anchor genuinely stays untouched. Free mode's anchor drifts too
    // now (see the anchor-exemption fix above), so it correctly DOES get the note.
    const anchoredScale = generateScale('#1A6FBF', 'anchored', { dark: false });
    const anchoredDrifted = driftTowardReference(anchoredScale, '#8040FF');
    check('drift: reference hex does NOT appear in anchored mode\'s untouched anchor description', !anchoredDrifted.steps[anchoredDrifted.anchorIdx].figmaDescription.includes('drift toward'), anchoredDrifted.steps[anchoredDrifted.anchorIdx].figmaDescription);
  }

  // cap must take the SHORT way around the hue circle. A raw subtraction (anchorH=350,
  // refH=10) gives -340, implying a huge rotation the long way around, when the actual
  // shortest rotation is +20°. Confirmed as a real, independent bug while testing the
  // drift rewrite above — not something the formula change alone would have caught.
  {
    const scale = generateScale('#1A6FBF', 'anchored', { dark: false });
    // Force a synthetic anchor H near 350 isn't directly possible via public API with a
    // real hex, so verify the property algebraically instead: total rotation from step 1
    // to step 12 should never exceed 180° in magnitude for a reference within 20° of the
    // anchor (a small, nearby reference should never imply a near-360° rotation).
    const anchorIdx = scale.anchorIdx;
    const anchorH = scale.steps[anchorIdx].H;
    const nearbyRefH = ((anchorH + 15) % 360 + 360) % 360;
    const nearbyRefHex = (() => {
      const { oklchToHex } = require('../scripts/generate.js');
      return oklchToHex(0.5, 0.15, nearbyRefH);
    })();
    const drifted = driftTowardReference(scale, nearbyRefHex);
    const totalSwing = Math.abs(drifted.steps[11].H - drifted.steps[0].H);
    check('drift: a nearby reference produces a small total swing, not a wraparound-inflated one', totalSwing < 60, `swing=${totalSwing.toFixed(1)}°`);
  }

  // H must always land in [0, 360) — a real bug found by adversarial testing after all
  // the feedback-driven fixes: anchorH + cap*(11-i)/11 can land outside this range (e.g.
  // a small anchorH combined with a large negative cap pushes it negative), and unlike
  // every other hue computation in generate.js, the drift formula didn't normalize the
  // result. The raw negative value leaked verbatim into the oklch() string and
  // figmaDescription — mathematically equivalent to the wrapped angle, but inconsistent
  // with how every other value in this system is presented.
  {
    const { oklchToHex } = require('../scripts/generate.js');
    const nearWhiteHex = oklchToHex(0.993, 0.005, 50); // anchors at step 1 (index 0)
    const scale = generateScale(nearWhiteHex, 'anchored', { dark: false });
    if (scale.anchorIdx === 0) {
      const drifted = driftTowardReference(scale, '#8040FF');
      const allInRange = drifted.steps.every(s => s.H >= 0 && s.H < 360);
      check('drift: H always stays in [0, 360), even when anchor is at step 1', allInRange, drifted.steps.map(s => s.H.toFixed(1)).join(', '));
      const noNegativeInDescription = drifted.steps.every(s => !s.figmaDescription.includes('-') || s.figmaDescription.match(/-\d/) === null || !/oklch\([\d.]+ [\d.]+ -/.test(s.figmaDescription));
      check('drift: no negative H leaks into figmaDescription', noNegativeInDescription);
    } else {
      check('drift H-range test skipped (did not land on anchorIdx=0 this run)', true);
    }
  }
}

// ============================================================
// 11. Mid-ramp discontinuity: the anchor never drifts (correct, by
//    design — see Anchored mode above), so when the anchor sits away
//    from step 12 (the schedule's own natural fixed point under the
//    absolute step schedule), its immediate neighbors follow the smooth
//    schedule while it doesn't, producing a single-step spike. Not a
//    bug to eliminate — a documented consequence of the anchor
//    exemption and a schedule anchored at a fixed step (12) rather than
//    wherever the real anchor sits.
// ============================================================

{
  const scale = generateScale('#CA8A04', 'anchored', { dark: false }); // anchor typically mid-ramp
  const drifted = driftTowardReference(scale, '#8040FF');
  const anchorIdx = drifted.anchorIdx;
  if (anchorIdx > 0 && anchorIdx < 11) {
    // Everything except the anchor index itself should match the smooth schedule exactly.
    let cap = parseFloat(drifted.driftedToward.oklch.match(/oklch\([\d.]+ [\d.]+ ([\d.]+)/)[1]) - drifted.steps[anchorIdx].H;
    if (cap > 180) cap -= 360;
    if (cap < -180) cap += 360;
    const anchorH = drifted.steps[anchorIdx].H;
    let scheduleMatches = true;
    for (let i = 0; i < 12; i++) {
      if (i === anchorIdx) continue;
      const expected = (((anchorH + (cap * (11 - i)) / 11) % 360) + 360) % 360;
      let diff = Math.abs(drifted.steps[i].H - expected);
      if (diff > 180) diff = 360 - diff;
      if (diff > 0.5) scheduleMatches = false;
    }
    check('every non-anchor step matches the absolute schedule exactly', scheduleMatches);
  } else {
    check('mid-ramp jump test skipped (anchor at an end this run)', true);
  }
}

// ============================================================
// 12. Anchor-in-background-zone flag: correctly true when a dark-mode
//    anchored source lands at step index <= 4, correctly false otherwise.
//    Confirmed against a real reproduction: anchor step lands MORE
//    saturated than its capped neighbors when this flag is true (the
//    anchor exemption and the background cap are each correct alone;
//    this is a real, expected consequence of the two interacting).
// ============================================================

{
  const inZone = generateScale('#24009B', 'anchored', { dark: true });
  check('anchorInBackgroundZone true when anchor lands in steps 1-5', inZone.anchorInBackgroundZone === true, `anchorIdx=${inZone.anchorIdx}`);
  if (inZone.anchorInBackgroundZone) {
    const anchorC = inZone.steps[inZone.anchorIdx].C;
    const neighborC = inZone.steps[inZone.anchorIdx - 1] ? inZone.steps[inZone.anchorIdx - 1].C : null;
    if (neighborC !== null) {
      check('anchor-in-background-zone: anchor reads more saturated than capped neighbor', anchorC > neighborC, `anchor C=${anchorC.toFixed(3)}, neighbor C=${neighborC.toFixed(3)}`);
    }
  }

  const outOfZone = generateScale('#1A6FBF', 'anchored', { dark: false });
  check('anchorInBackgroundZone false for a typical mid-ramp anchor', outOfZone.anchorInBackgroundZone === false, `anchorIdx=${outOfZone.anchorIdx}`);

  const freeMode = generateScale('#1A6FBF', 'free', { dark: false });
  check('anchorInBackgroundZone always false in free mode', freeMode.anchorInBackgroundZone === false);
}

// ============================================================
// 13. figmaDescriptionLine — same content as figmaDescription but without
//    the light/dark token, for a Figma variable with separate Light/Dark
//    modes sharing one description field (Figma descriptions are per-
//    variable, not per-mode — a single string can't hold two modes'
//    worth of "· light"/"· dark" without one contradicting the other).
// ============================================================

{
  const light = generateScale('#2DAFB8', 'anchored', { dark: false });
  const dark = generateScale('#2DAFB8', 'free', { dark: true });
  check('figmaDescriptionLine omits the light/dark token', !light.steps[0].figmaDescriptionLine.includes('· light'), light.steps[0].figmaDescriptionLine);
  check('figmaDescriptionLine still has mode and source', light.steps[0].figmaDescriptionLine.includes('anchored mode') && light.steps[0].figmaDescriptionLine.includes('#2DAFB8'));
  check('figmaDescription (non-Line) still has the light/dark token', light.steps[0].figmaDescription.includes('· light') && dark.steps[0].figmaDescription.includes('· dark'));
}

// ============================================================
// 14. recover.js — given an existing 12-step ramp, recover the mode/
//    source/ceiling that reproduces it. Verified against known ground
//    truth (not just "it runs") — mode identification and reconstruction
//    error both checked, across every family and both modes.
// ============================================================

{
  const { recoverParameters } = require('../scripts/recover.js');

  // Exact, hand-picked cases including yellow (both modes) and dark mode — yellow was
  // the one that exposed a real bug: its drift depends on sourceL in a way that made a
  // naive local-search miss the true source by 10+ degrees, recovering the wrong mode.
  const exactCases = [
    { hex: '#1A6FBF', mode: 'free', dark: false },
    { hex: '#2228DF', mode: 'anchored', dark: false },
    { hex: '#9747FF', mode: 'anchored', dark: false, noCeiling: true },
    { hex: '#CA8A04', mode: 'free', dark: false },
    { hex: '#CA8A04', mode: 'anchored', dark: false },
    { hex: '#2228DF', mode: 'anchored', dark: true },
    { hex: '#B91C1C', mode: 'free', dark: true },
  ];
  let exactModeCorrect = 0, exactMaxErr = 0;
  exactCases.forEach(tc => {
    const scale = generateScale(tc.hex, tc.mode, { dark: tc.dark, noCeiling: tc.noCeiling });
    const target = scale.steps.map(s => s.hex);
    const recovered = recoverParameters(target, { dark: tc.dark });
    if (recovered.mode === tc.mode) exactModeCorrect++;
    exactMaxErr = Math.max(exactMaxErr, recovered.err.mean);
  });
  check('recover.js: mode correct on hand-picked cases (incl. yellow both modes)', exactModeCorrect === exactCases.length, `${exactModeCorrect}/${exactCases.length}`);
  check('recover.js: reconstruction error stays low on hand-picked cases', exactMaxErr < 1.0, `worst mean error ${exactMaxErr.toFixed(3)}/255`);

  // Broader sweep — every family, both modes. Known, accepted limitation: orange and
  // cyan have no hue-nudge rule at the anchor, so free mode and anchored-at-step-9 are
  // structurally near-identical at that one step — occasional mode misidentification
  // there is expected and low-cost (sub-1-unit reconstruction error either way), not
  // asserted as zero.
  {
    const families = { red: 20, orange: 55, yellow: 100, green: 150, cyan: 195, blue: 245, indigo: 285, purple: 310, magenta: 340 };
    let total = 0, modeCorrect = 0, worstErr = 0;
    Object.entries(families).forEach(([, h]) => {
      [0.45, 0.60].forEach(l => {
        ['free', 'anchored'].forEach(mode => {
          total++;
          const hex = hexFromOKLCH(l, 0.15, h);
          const scale = generateScale(hex, mode, { dark: false });
          const target = scale.steps.map(s => s.hex);
          const recovered = recoverParameters(target, { dark: false });
          if (recovered.mode === mode) modeCorrect++;
          worstErr = Math.max(worstErr, recovered.err.mean);
        });
      });
    });
    check('recover.js: mode correct on at least 30/36 broad sweep', modeCorrect >= 30, `${modeCorrect}/${total}`);
    check('recover.js: reconstruction error stays low even on broad sweep', worstErr < 2.0, `worst mean error ${worstErr.toFixed(3)}/255`);
  }

  // Grey mode was previously not searched at all — a pure neutral ramp came back
  // misidentified as anchored, with a wrong source and a nonzero error, when an exact
  // grey-mode fit exists. This is the cheapest branch to test: if the recovered grey
  // candidate's error is 0, it should always win over any non-exact alternative.
  {
    const greyTarget = ['#FDFDFD', '#F8F8F8', '#EEEEEE', '#E4E4E4', '#DBDBDB', '#BABABA', '#9B9B9B', '#7D7D7D', '#696969', '#4D4D4D', '#353535', '#161616'];
    const result = recoverParameters(greyTarget, { dark: false });
    check('recover.js: pure neutral ramp recovers as grey mode', result.mode === 'grey', `got ${result.mode}`);
    check('recover.js: grey mode recovery is exact', result.err.mean === 0, `mean error ${result.err.mean}`);
    // The CLI's anchorStep display had a real bug: `null + 1` evaluates to `1` in JS,
    // so grey mode (which has no anchor) displayed "anchorStep: 1" — misleadingly
    // implying an anchor at step 1 rather than no anchor at all.
    check('recover.js: grey mode anchorIdx is null (not coerced to a false anchorStep)', result.anchorIdx === null, `anchorIdx=${result.anchorIdx}`);
  }

  // The anchored-mode invariant (source must reproduce verbatim at its own claimed
  // anchor step) is a free self-check that was previously not enforced — recover.js
  // could return "anchored, source X" where X didn't actually match the target at the
  // claimed anchor step, silently. A drifted ramp (anchored generation + drift applied
  // on top) is exactly the case where the raw best-error fit is likely to violate this.
  // Drift recovery: the drift formula (H[i] = anchorH + cap*(11-i)/11) has exactly one
  // free parameter and inverts in closed form — cap = (H[i]-anchorH)*11/(11-i) for any
  // non-anchor, non-last-index step with enough chroma for hue to be stable. What used
  // to be an unresolvable "warning" case (a drifted ramp) is now a correct answer.
  {
    const base = generateScale('#24009B', 'anchored', { dark: false });
    const drifted = driftTowardReference(base, '#8040FF');
    const target = drifted.steps.map(s => s.hex);
    const result = recoverParameters(target, { dark: false });
    check('recover.js: recovers a drifted ramp as anchored with the exact true source', result.mode === 'anchored' && result.hex.toUpperCase() === '#24009B', `mode=${result.mode}, source=${result.hex}`);
    check('recover.js: drift recovery achieves near-zero error', result.err.mean < 0.5, `mean error ${result.err.mean}`);
    // `driftedToward` is the HEX driftTowardReference() accepts, not a bare hue number.
    // It was a number for one release: usable-looking, but it threw on round-trip, so
    // recovery output couldn't reproduce what it had just recovered. The numeric hue is
    // still available as `driftedTowardHue` for reporting.
    check('recover.js: drift recovery reports the reference as a re-runnable hex', typeof result.driftedToward === 'string' && /^#[0-9A-F]{6}$/i.test(result.driftedToward), JSON.stringify(result.driftedToward));
    check('recover.js: drift recovery also reports the raw reference hue', typeof result.driftedTowardHue === 'number', JSON.stringify(result.driftedTowardHue));

    // A second drifted case, different source/reference/anchor-index, to make sure the
    // first success wasn't a coincidence of this one specific pair.
    const base2 = generateScale('#5B5BD6', 'anchored', { dark: false });
    const drifted2 = driftTowardReference(base2, '#C94F9F');
    const target2 = drifted2.steps.map(s => s.hex);
    const result2 = recoverParameters(target2, { dark: false });
    check('recover.js: drift recovery works on a second, independent case', result2.mode === 'anchored' && result2.hex.toUpperCase() === '#5B5BD6' && result2.err.mean < 0.5, `mode=${result2.mode}, source=${result2.hex}, err=${result2.err.mean}`);
  }

  // The invariant check and warning still matter for adjustments drift-recovery can't
  // model — a genuinely non-drift manual edit (recoloring one step to something
  // arbitrary, not fitting any smooth per-step schedule) should NOT be silently
  // "resolved" into a false low-error anchored result.
  {
    const base = generateScale('#24009B', 'anchored', { dark: false });
    const target = base.steps.map(s => s.hex);
    target[5] = '#FF00FF'; // arbitrary hand-edit, doesn't fit any drift schedule
    const result = recoverParameters(target, { dark: false });
    const invariantHolds = result.mode !== 'anchored' || result.hex.toUpperCase() === target[result.anchorIdx].toUpperCase();
    check('recover.js: never returns an anchored result that violates its own verbatim invariant', invariantHolds, `mode=${result.mode}, source=${result.hex}, target@anchor=${result.mode === 'anchored' ? target[result.anchorIdx] : 'n/a'}`);
    check('recover.js: a genuinely non-drift manual edit is not silently resolved to low error', result.err.mean > 3, `mean error ${result.err.mean}`);
  }

  // The CLI previously discarded the `warning` field entirely — main() constructed a
  // new object with only mode/source/anchorIdx/etc., silently dropping it, so the exact
  // scenario the warning exists to surface loudly was invisible from the documented
  // entry point (SKILL.md documents the CLI as the primary way to use this tool).
  {
    const { buildCliOutput } = require('../scripts/recover.js');
    const base = generateScale('#24009B', 'anchored', { dark: false });
    const target = base.steps.map(s => s.hex);
    target[5] = '#FF00FF'; // same non-drift manual edit as above — genuinely unresolvable
    const apiResult = recoverParameters(target, { dark: false });
    const cliOutput = buildCliOutput(apiResult);
    check('recover.js CLI: surfaces a poor-fit warning for a genuinely unresolvable edit', typeof cliOutput.warning === 'string' && cliOutput.warning.length > 0, JSON.stringify(cliOutput.warning));

    // A clean, non-drifted ramp should have NO warning at all.
    const cleanScale = generateScale('#1A6FBF', 'free', { dark: false });
    const cleanTarget = cleanScale.steps.map(s => s.hex);
    const cleanResult = recoverParameters(cleanTarget, { dark: false });
    const cleanOutput = buildCliOutput(cleanResult);
    check('recover.js CLI: no warning on a clean, undrifted ramp', cleanOutput.warning === undefined, JSON.stringify(cleanOutput));
  }
}

// ============================================================
// 17. Alpha descriptions are now automatic — closing an asymmetry where
//    solid steps got figmaDescription for free but alpha steps required
//    manual composition despite the format already being specified.
// ============================================================

{
  const grey = generateScale('#6A6A6A', 'grey', { dark: false });
  const greyAlpha = generateAlphaScale(grey, 'grey');
  check('alpha description present on neutral alpha steps', typeof greyAlpha[8].figmaDescription === 'string' && greyAlpha[8].figmaDescription.length > 0);
  check('alpha description matches the specified format', greyAlpha[8].figmaDescription === 'oklch(0.20 0.00 0 / 64.38%) · base #161616 · alpha 0.643777 · composites to grey/9 · grey mode', greyAlpha[8].figmaDescription);
  // The CSS form leads the description, mirroring the solid steps' `${oklch} · ${provenance}`.
  check('neutral alpha css uses the published nominal base OKLCH', greyAlpha[8].css === 'oklch(0.20 0.00 0 / 64.38%)', greyAlpha[8].css);
  // Endpoint rule swaps the base, so the nominal OKLCH must swap with it.
  check('endpoint step css uses the pure-black nominal', /^oklch\(0 0 0 \/ \d+\.\d{2}%\)$/.test(greyAlpha[11].css), greyAlpha[11].css);
  // Full-precision alpha must survive into the CSS form: whole-percent rounding moves
  // 7 of 11 steps by 1/255 and reintroduces the seam the alpha scale exists to avoid.
  check('css alpha is 2dp percent, never whole percent', /\/ \d+\.\d{2}%\)$/.test(greyAlpha[8].css), greyAlpha[8].css);

  {
    // Two-mode composition: headings, not inline mode tokens. The line form must NOT
    // carry "· dark", or the heading and the line would state the mode twice.
    const { composeModeDescription } = require('../scripts/generate.js');
    const sL = generateScale('#6A6A6A', 'grey', { dark: false });
    const sD = generateScale('#6A6A6A', 'grey', { dark: true });
    const aL = generateAlphaScale(sL, 'grey'), aD = generateAlphaScale(sD, 'grey');

    check('alpha exposes a mode-token-free line', typeof aL[0].figmaDescriptionLine === 'string' && !/·\s*dark/i.test(aD[0].figmaDescriptionLine), aD[0].figmaDescriptionLine);
    check('solid exposes a mode-token-free line', !/·\s*(light|dark)\b/i.test(sD.steps[0].figmaDescriptionLine), sD.steps[0].figmaDescriptionLine);

    const composed = composeModeDescription({ Light: aL[0].figmaDescriptionLine, Dark: aD[0].figmaDescriptionLine });
    check('composed description uses one heading per mode', /^Light:\n.+\n\nDark:\n.+$/s.test(composed), composed);
    check('composed description repeats no mode token', !/·\s*(light|dark)\b/i.test(composed), composed);
    // Each section must still carry its OWN alpha — the bug that put Light's value in Dark.
    check('sections keep distinct alphas',
          composed.split('Dark:')[0].includes(aL[0].alpha) && composed.split('Dark:')[1].includes(aD[0].alpha),
          composed);
    check('composer skips absent modes', composeModeDescription({ Light: 'x', Dark: null }) === 'Light:\nx');
  }

  {
    // FULL-CHAIN INVARIANT. Parse the emitted CSS string exactly as a consumer would,
    // convert it back through the pipeline, composite at the stated percentage, and
    // require the solid step's own hex. This is the assertion that actually guards the
    // precision decisions — the earlier version composited from `s.base` (the hex) and
    // only read the percentage out of `s.css`, so it never converted the OKLCH triple
    // and would have passed with a wrong lightness in BASE_OKLCH.
    //
    // Covers in one check: base lightness decimals, alpha decimals, and the endpoint
    // rule's base swap. Any of them drifting flips an 8-bit channel and fails here.
    const { oklchToHex } = require('../scripts/generate.js');
    const srgb255 = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);

    const cases = [
      ['Grey  neutral light', '#6A6A6A', 'grey', false],
      ['Grey  neutral dark',  '#6A6A6A', 'grey', true],
      ['Blue  chromatic',     '#1A6FBF', 'free', false],
      ['Red   chromatic',     '#B91C1C', 'free', false],
      ['Indigo chromatic',    '#9747FF', 'anchored', false],
      // Dark chromatic — solved against BLACK (see generateChromaticAlpha's dark
      // branch). These cases didn't exist when the solver was light-only, which is
      // exactly how a white-solved dark scale passed unnoticed: the round-trip only
      // ever composited chromatic scales onto white.
      ['Blue  chromatic dark', '#1A6FBF', 'free', true],
      ['Indigo chromatic dark', '#9747FF', 'anchored', true]
    ];

    let worstMargin = 1;
    for (const [label, src, mode, dark] of cases) {
      const scale = generateScale(src, mode, { dark });
      const alpha = generateAlphaScale(scale, 'scale');
      // Compositing background: white in light mode, black in dark mode.
      const bg = dark ? 0 : 255;
      let bad = 0, worst = 0;
      alpha.forEach((step, i) => {
        const target = scale.steps[i].hex;
        const pctM = step.css.match(/\/ ([\d.]+)%\)/);
        if (!pctM) { bad++; return; }
        const a = parseFloat(pctM[1]) / 100;

        // Recover the base from the CSS string itself, not from step.base.
        let baseHex = null;
        const ok = step.css.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+) \//);
        const rg = step.css.match(/^rgb\((\d+) (\d+) (\d+) \//);
        if (ok)      baseHex = oklchToHex(parseFloat(ok[1]), parseFloat(ok[2]), parseFloat(ok[3]));
        else if (rg) baseHex = '#' + [1,2,3].map(k => (+rg[k]).toString(16).padStart(2,'0')).join('').toUpperCase();
        if (!baseHex) { bad++; return; }

        for (let ch = 0; ch < 3; ch++) {
          const exact = srgb255(baseHex, ch) * a + bg * (1 - a);
          if (Math.round(exact) !== srgb255(target, ch)) bad++;
          worst = Math.max(worst, Math.abs(exact - srgb255(target, ch)));
        }
      });
      // FLOOR=3 on chromatic scales bleeds a documented ≤3/255 into a zero channel,
      // so chromatic gets that tolerance; neutral must be exact.
      const tol = mode === 'grey' ? 0 : 3;
      check('CSS round-trips to the solid step — ' + label,
            bad === 0 || worst <= tol + 0.5,
            'mismatches ' + bad + ', worst ' + worst.toFixed(3) + '/255');
      if (mode === 'grey') worstMargin = Math.min(worstMargin, 0.5 - worst);
    }
    // Neutral scales should sit well clear of the rounding boundary, not scrape it.
    check('neutral composites keep >0.25/255 of rounding headroom', worstMargin > 0.25,
          'tightest margin ' + worstMargin.toFixed(3) + '/255');

    // The base lightness must be the one that actually produces the base hex. Guards
    // against someone "tidying" BASE_OKLCH to a rounder number.
    const gl = generateAlphaScale(generateScale('#6A6A6A', 'grey', { dark: false }), 'g');
    const gd = generateAlphaScale(generateScale('#6A6A6A', 'grey', { dark: true }),  'g');
    [['light', gl], ['dark', gd]].forEach(([m, arr]) => {
      let bad = 0;
      arr.forEach(s => {
        const o = s.css.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+) \//);
        if (!o) { bad++; return; }
        if (oklchToHex(parseFloat(o[1]), parseFloat(o[2]), parseFloat(o[3])).toUpperCase() !== s.base.toUpperCase()) bad++;
      });
      check('nominal OKLCH resolves to its own base hex — ' + m, bad === 0, bad + ' mismatches');
    });
  }
  {
    // Chromatic bases are solved per step and their hue drifts from the scale hue,
    // so they must NOT claim an OKLCH triple — rgb() states the solve exactly.
    const blue = generateScale('#1A6FBF', 'free', { dark: false });
    const blueAlpha = generateAlphaScale(blue, 'blue');
    check('chromatic alpha css is rgb(), not oklch()', /^rgb\(\d+ \d+ \d+ \/ \d+\.\d{2}%\)$/.test(blueAlpha[0].css), blueAlpha[0].css);
    check('chromatic alpha css channels match the solved base', blueAlpha[0].css.indexOf(String(parseInt(blueAlpha[0].base.slice(1,3), 16))) === 4, blueAlpha[0].css + ' vs ' + blueAlpha[0].base);
  }

  const blue = generateScale('#1A6FBF', 'free', { dark: false });
  const blueAlpha = generateAlphaScale(blue, 'blue');
  check('chromatic alpha description composites to the correct name/step', blueAlpha[8].figmaDescription.includes('composites to blue/9'), blueAlpha[8].figmaDescription);

  const noName = generateAlphaScale(blue); // no name provided — should fall back to family, not crash
  check('alpha description falls back to family name when none is given', noName[8].figmaDescription.includes('composites to blue/9'), noName[8].figmaDescription);
}

// ============================================================
// 10. Figma naming/description fields — figmaSuffix marks exactly one
//    step per scale ('-source' in free mode at step 9, '-anchor' in
//    anchored mode at the actual anchor); figmaDescription carries
//    source/mode/light-dark/ceiling provenance, with the anchor step
//    specifically saying "verbatim" rather than a capped/uncapped label
//    that would misrepresent what actually happened to that one step.
// ============================================================

{
  // Free mode: Blue's source L (~0.54) happens to be close to the anchor L (0.52), so
  // step 9 is genuinely the nearest step here — not because free mode hardcodes step 9
  // (it doesn't, since the Green regression test below), but because this particular
  // source's L happens to land there.
  const free = generateScale('#1A6FBF', 'free', { dark: false });
  const sourceSuffixCount = free.steps.filter(s => s.figmaSuffix === '-source').length;
  check('figma: free mode exactly one -source suffix', sourceSuffixCount === 1, `found ${sourceSuffixCount}`);
  check('figma: free mode -source lands on step 9 for this source', free.steps[8].figmaSuffix === '-source', `got '${free.steps[8].figmaSuffix}'`);
  check('figma: free mode description carries source hex', free.steps[0].figmaDescription.includes('#1A6FBF'), free.steps[0].figmaDescription);

  // Every step's description must start with its OWN oklch(L C H) value — checked
  // across every family, mode, light/dark, and ceiling combination, not just spot-checked
  // on a couple of examples. This is the actual guarantee that matters: the description
  // is per-step accurate everywhere, not just present on the examples someone happened to look at.
  {
    const sweepFamilies = { red: 20, orange: 55, yellow: 100, green: 150, cyan: 195, blue: 245, indigo: 285, purple: 310, magenta: 340 };
    let checked = 0, wrong = 0;
    Object.entries(sweepFamilies).forEach(([, h]) => {
      const hex = hexFromOKLCH(0.55, 0.15, h);
      ['free', 'anchored', 'grey'].forEach(mode => {
        [false, true].forEach(dark => {
          [false, true].forEach(noCeiling => {
            const scale = generateScale(hex, mode, { dark, noCeiling });
            scale.steps.forEach(s => {
              checked++;
              const expectedPrefix = `oklch(${s.L.toFixed(4)} ${s.C.toFixed(4)} ${s.H.toFixed(2)})`;
              if (!s.figmaDescription.startsWith(expectedPrefix)) wrong++;
            });
          });
        });
      });
    });
    check('figma: every step description starts with its own correct oklch value', wrong === 0, `${wrong}/${checked} missing or mismatched`);
  }

  // Anchored mode: exactly one '-anchor' suffix, at the dynamic anchorIdx (not always step 9).
  const anchored = generateScale('#2228DF', 'anchored', { dark: false });
  const anchorSuffixCount = anchored.steps.filter(s => s.figmaSuffix === '-anchor').length;
  check('figma: anchored mode exactly one -anchor suffix', anchorSuffixCount === 1, `found ${anchorSuffixCount}`);
  check('figma: anchored mode -anchor lands on the real anchorIdx', anchored.steps[anchored.anchorIdx].figmaSuffix === '-anchor');

  // The anchor step's description must say "verbatim", never a ceiling label — even
  // for a family where the ceiling is actually active on every other step.
  const indigoCapped = generateScale('#9747FF', 'anchored', { dark: false, noCeiling: false, luminanceText: false });
  const anchorDesc = indigoCapped.steps[indigoCapped.anchorIdx].figmaDescription;
  check('figma: anchor description says verbatim, not capped', anchorDesc.endsWith('verbatim'), anchorDesc);
  check('figma: anchor description never says capped/uncapped', !/\b(un)?capped\b/.test(anchorDesc.replace('verbatim','')), anchorDesc);

  // A non-anchor step in that same scale should still show the real ceiling status.
  const nonAnchorDesc = indigoCapped.steps[9].figmaDescription;
  check('figma: non-anchor step in ceilinged family shows capped', nonAnchorDesc.endsWith('capped') && !nonAnchorDesc.endsWith('verbatim'), nonAnchorDesc);

  // no-ceiling modifier should read "uncapped" on non-anchor steps of a ceilinged family.
  const indigoUncapped = generateScale('#9747FF', 'anchored', { dark: false, noCeiling: true, luminanceText: false });
  const uncappedDesc = indigoUncapped.steps[9].figmaDescription;
  check('figma: no-ceiling shows uncapped on non-anchor step', uncappedDesc.endsWith('uncapped'), uncappedDesc);

  // Grey/neutral scales have no ceiling concept — no capped/uncapped label anywhere —
  // but DO get exactly one figma marker now, same as free/anchored: whichever step is
  // nearest the source in OKLab space. #6A6A6A isn't itself one of the neutral scale's
  // own fixed values, so its nearest step (9) is merely close, not exact -> '-source'.
  const grey = generateScale('#6A6A6A', 'grey', { dark: false });
  const greySuffixCount = grey.steps.filter(s => s.figmaSuffix !== '').length;
  check('figma: grey mode gets exactly one marker (unified nearest-step rule)', greySuffixCount === 1, `found ${greySuffixCount}`);
  check('figma: grey mode marks the nearest step as -source when not an exact match', grey.steps[8].figmaSuffix === '-source', grey.steps[8].figmaSuffix);
  check('figma: grey mode description has no ceiling label', !/\b(un)?capped\b/.test(grey.steps[8].figmaDescription), grey.steps[8].figmaDescription);

  // A grey source that DOES exactly match one of the neutral scale's own fixed values
  // gets '-anchor', not '-source' — the distinction is exactness, not mode.
  const exactGrey = generateScale('#696969', 'grey', { dark: false });
  const exactMarked = exactGrey.steps.find(s => s.figmaSuffix !== '');
  check('figma: grey mode marks an exact source match as -anchor', exactMarked && exactMarked.figmaSuffix === '-anchor', exactMarked ? `step${exactMarked.step}${exactMarked.figmaSuffix}` : 'none found');

  // The real bug this rule fixes: free mode's OLD rule always marked step 9, regardless
  // of whether it was actually the closest step to the source. Green source #009070
  // (L 0.581) has step 8 measurably closer (ΔE 0.0187) than step 9 (ΔE 0.0636) — a 3.4x
  // difference — so the old rule pointed at a color visibly farther from the source
  // than its own neighbor.
  const green = generateScale('#009070', 'free', { dark: false });
  const greenMarked = green.steps.find(s => s.figmaSuffix !== '');
  check('figma: free mode marks the ACTUALLY nearest step, not always step 9', greenMarked && greenMarked.step === 8, greenMarked ? `step${greenMarked.step}` : 'none found');
}

// ============================================================
// 15. Cross-hue chroma disparity at dark step 12 — confirms the
//    documented ~3x spread is real and stable, not a one-off measurement.
// ============================================================

{
  const families = { red: 20, orange: 55, yellow: 100, green: 150, cyan: 195, blue: 245, indigo: 285, purple: 310, magenta: 340 };
  const renderedC = Object.entries(families).map(([, h]) => {
    const hex = hexFromOKLCH(0.55, 0.15, h);
    return generateScale(hex, 'free', { dark: true }).steps[11].C;
  });
  const spread = Math.max(...renderedC) / Math.min(...renderedC);
  check('cross-hue chroma spread at dark step12 is at least 2x (real gamut effect, not noise)', spread >= 2.0, `spread=${spread.toFixed(2)}x`);
}

// ============================================================
// 16. Table output must surface anchorInBackgroundZone — the flag
//    existing in the JSON data isn't enough if the more commonly-used
//    --table view never shows it.
// ============================================================

{
  const { buildTable } = require('../scripts/generate.js');
  const inZone = generateScale('#24009B', 'anchored', { dark: true });
  const lines = buildTable(inZone, null);
  check('table output warns when anchor is in the background zone', lines.some(l => l.includes('background zone')), lines[1]);

  const outOfZone = generateScale('#1A6FBF', 'anchored', { dark: false });
  const linesOk = buildTable(outOfZone, null);
  check('table output has no warning when anchor is not in the background zone', !linesOk.some(l => l.includes('background zone')));
}

// ============================================================
// 18. Hue-nudge normalization — a real bug found by broad adversarial
//    fuzzing (not feedback-driven, self-initiated): every family H-nudge
//    rule in applyFamilyRules() computed sourceH ± N with no wraparound
//    normalization. Red (H 0-40) and magenta (H 320-360) both border the
//    wrap point, so a source hue near 0 hit red's -4 nudge and produced
//    a negative H that leaked into oklch() strings and figmaDescription.
// ============================================================

{
  const { oklchToHex } = require('../scripts/generate.js');
  // Reproduce the exact discovered case: a red-family source with H just above 0.
  const nearZeroHex = oklchToHex(0.5, 0.15, 0.5);
  const scale = generateScale(nearZeroHex, 'anchored', { dark: true });
  const allInRange = scale.steps.every(s => s.H >= 0 && s.H < 360);
  check('hue-nudge: H stays in [0,360) for a red-family source near the wrap boundary', allInRange, scale.steps.map(s => s.H.toFixed(2)).join(', '));

  // Same check for magenta (H 320-360), the other family bordering the wrap point.
  const nearWrapHex = oklchToHex(0.5, 0.15, 358);
  const scale2 = generateScale(nearWrapHex, 'anchored', { dark: false });
  const allInRange2 = scale2.steps.every(s => s.H >= 0 && s.H < 360);
  check('hue-nudge: H stays in [0,360) for a magenta-family source near the wrap boundary', allInRange2, scale2.steps.map(s => s.H.toFixed(2)).join(', '));

  // Broad regression sweep — this is the check that would have caught the original bug:
  // random hex across every mode/dark/ceiling combination, asserting H is always in
  // range. Section 7's fuzz test checked for crashes and malformed hex, but never
  // checked the H value's own range — this closes that gap.
  let outOfRangeCount = 0;
  const N = 5000;
  for (let i = 0; i < N; i++) {
    const hex = '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0').toUpperCase();
    const mode = ['free', 'anchored', 'grey'][i % 3];
    const dark = i % 2 === 0;
    const noCeiling = i % 5 === 0;
    const s = generateScale(hex, mode, { dark, noCeiling });
    if (s.steps.some(st => st.H < 0 || st.H >= 360)) outOfRangeCount++;
  }
  check('hue-nudge: H stays in [0,360) across a 5000-case random sweep', outOfRangeCount === 0, `${outOfRangeCount}/${N} out of range`);
}

// ============================================================
// 19. API/CLI naming aliases — the API historically used hex/err.mean/
//    err.max while the CLI presented source/meanError/maxError for the
//    same values, meaning code written against one didn't read from the
//    other. Both conventions now work directly from the API result.
// ============================================================

{
  const { recoverParameters } = require('../scripts/recover.js');
  const target = ['#FBFDFE', '#F4F9FF', '#E3F0FF', '#D2E7FF', '#C1DEFF', '#92BFF1', '#6A9FDB', '#3F80C5', '#0D67B6', '#005088', '#003F6E', '#002F55'];
  const result = recoverParameters(target, { dark: false });
  check('recover.js API: source alias matches hex', result.source === result.hex, `source=${result.source}, hex=${result.hex}`);
  check('recover.js API: meanError alias matches err.mean (rounded)', result.meanError === Math.round(result.err.mean * 100) / 100, `meanError=${result.meanError}, err.mean=${result.err.mean}`);
  check('recover.js API: maxError alias matches err.max', result.maxError === result.err.max, `maxError=${result.maxError}, err.max=${result.err.max}`);
}

// ============================================================
// 21. Recovered drift must round-trip, and must survive the CLI boundary
//
// Two failures this guards, both found only by using the tool rather than reading it:
//
//   a) `driftedToward` was returned as a bare hue NUMBER. It looked usable but threw
//      (`hex.replace is not a function`) the moment it was fed back into
//      driftTowardReference(), so recovery output could not reproduce what it recovered.
//   b) buildCliOutput() dropped the field entirely — the same boundary bug that once
//      swallowed `warning`, but worse: a drifted ramp recovers at mean/max error 0, so
//      the CLI reported a PERFECT score for parameters that regenerate a visibly
//      different ramp. Zero error gives the reader no reason to look further.
//
// The assertion is deliberately end-to-end (recover -> re-generate -> compare hexes)
// rather than checking the field's type, because the type was never the real problem —
// reproducibility was.
// ============================================================

{
  const { recoverParameters, buildCliOutput } = require('../scripts/recover.js');

  // Anchored mode only — see the free-mode limitation asserted at the end of this block.
  const driftCases = [
    ['anchor at step 12 (end)',      '#24009B', 'anchored', false, '#9E7FBF'],
    ['anchor mid-ramp',              '#2DAFB8', 'anchored', false, '#C94F9F'],
    ['uncapped magenta family',      '#BE22D8', 'anchored', true,  '#4264DF'],
  ];

  driftCases.forEach(([label, src, mode, noCeiling, ref]) => {
    const target = driftTowardReference(
      generateScale(src, mode, { dark: false, noCeiling }), ref
    ).steps.map(s => s.hex);

    const rec = recoverParameters(target, { dark: false });

    if (!rec.driftedToward) {
      check(`drift round-trip ${label}`, false, 'no drift recovered at all');
      return;
    }

    // (a) the value must be directly re-runnable — no conversion, no throw
    let rebuilt = null, threw = null;
    try {
      rebuilt = driftTowardReference(
        generateScale(rec.hex, rec.mode, { dark: false, noCeiling: rec.noCeiling }),
        rec.driftedToward
      ).steps.map(s => s.hex);
    } catch (e) { threw = e.message; }

    check(`drift round-trip re-runnable ${label}`, threw === null,
      `driftTowardReference rejected the recovered value: ${threw}`);

    if (rebuilt) {
      const mismatches = rebuilt.filter((h, i) => h !== target[i]).length;
      check(`drift round-trip exact ${label}`, mismatches === 0,
        `${mismatches}/12 steps differ after re-generating from recovered parameters`);
    }

    // (b) the CLI must not drop it
    const cli = buildCliOutput(rec);
    check(`drift surfaced in CLI ${label}`, cli.driftedToward !== undefined,
      'buildCliOutput omitted driftedToward — a zero-error result that does not reproduce the ramp');
  });

  // A clean, undrifted ramp must NOT gain a drift field — the guard has to be specific,
  // not "always report a reference".
  {
    const clean = generateScale('#2DAFB8', 'anchored', { dark: false }).steps.map(s => s.hex);
    const rec = recoverParameters(clean, { dark: false });
    const cli = buildCliOutput(rec);
    check('no spurious drift on a clean ramp',
      rec.driftedToward === undefined && cli.driftedToward === undefined,
      'drift reported for a ramp that was never drifted');
  }

  // KNOWN LIMITATION, asserted so it stays visible rather than being discovered again.
  //
  // Drift recovery is structurally anchored-only. The closed-form inversion needs a
  // known-exact anchor hue to solve `cap` against, and it takes that from the target's
  // own value at the anchor step — which is only trustworthy because anchored mode
  // reproduces the source verbatim there. Free mode has no verbatim step at all (L is
  // always overridden), so there's no anchor hue to invert against, and the free-mode
  // source search is itself confounded by the very rotation being recovered.
  //
  // The requirement is NOT that this case works. It's that it fails LOUDLY — a drifted
  // free ramp must not come back as a confident zero-error fit, the way drifted anchored
  // ramps once did.
  {
    const target = driftTowardReference(
      generateScale('#1A6FBF', 'free', { dark: false }), '#8040FF'
    ).steps.map(s => s.hex);
    const rec = recoverParameters(target, { dark: false });
    const cli = buildCliOutput(rec);
    const loud = cli.warning !== undefined || cli.driftedToward !== undefined;
    check('drifted FREE ramp fails loudly rather than silently',
      loud,
      `no warning and no drift field, yet mean error ${cli.meanError} — a silent wrong answer`);
  }
}

// ============================================================
// 22. Every family's "avoid" bound must sit BELOW its measured family-escape point
//
// The avoid ranges aren't stylistic — each is calibrated so a family's own hue nudge can't
// push steps out of the family it's defined for. Green: band 130-170, nudge +4, bound 165,
// measured escape at 166.02. Conservative by ~1 degree.
//
// Magenta's bound was 358 while its measured escape point is 357.0 — ABOVE rather than
// below, so a source at 358 was "within guidance" yet nudged +3 to 361, wrapping into RED.
// Nothing caught it because the bounds lived only in a prose table, never asserted against
// the behaviour they exist to protect.
//
// This test derives the escape point empirically per family and checks the bound is below
// it, so the whole table is validated rather than the one case that was found by hand.
// ============================================================

{
  const { FAMILY_AVOID } = require('../scripts/generate.js');
  check('FAMILY_AVOID table is exported', !!FAMILY_AVOID, 'not exported from generate.js');

  if (FAMILY_AVOID) {
    // The invariant, stated directly: NO source hue inside a family's documented safe range
    // may produce a family escape. Checking it this way rather than "the bound is below the
    // measured escape point" matters, because families nudge in both directions — blue,
    // indigo and purple nudge NEGATIVE and so risk ejecting at the LOW end of their band,
    // while green and magenta nudge positive and risk the high end. A one-sided check passes
    // vacuously for half the table.
    //
    // Yellow is excluded: its continuous drift crosses into orange by design (see the
    // exemption in generate.js), so "no escapes" is not the right invariant for it.
    Object.entries(FAMILY_AVOID).forEach(([family, bound]) => {
      if (family === 'yellow') { pass++; return; }
      const offenders = [];
      for (let H = bound.lo; H <= bound.hi; H += 0.25) {
        for (const C of [0.10, 0.15, 0.20]) {
          for (const L of [0.45, 0.55, 0.65]) {
            const scale = generateScale(hexFromOKLCH(L, C, ((H % 360) + 360) % 360), 'free', { dark: false });
            if (scale.family !== family) continue;
            const actualH = parseFloat(scale.sourceOklch.match(/oklch\([\d.]+ [\d.]+ ([\d.]+)/)[1]);
            // Gamut clamping moves the realized hue away from the requested one, sometimes
            // by a degree or two. The bound applies to the hue the source ACTUALLY has —
            // which is what detectFamily() and the warning check both see — so a sample
            // that lands outside the range after clamping isn't testing the range at all.
            if (actualH < bound.lo || actualH > bound.hi) continue;
            if (scale.familyEscapeWarning) offenders.push(actualH.toFixed(2));
          }
        }
      }
      check(`no family escape inside the safe range: ${family}`,
        offenders.length === 0,
        `${offenders.length} source hues within the documented range ${bound.lo}-${bound.hi} eject steps into a neighbouring family (e.g. H ${offenders.slice(0, 3).join(', ')})`);
    });
  }
}

// ============================================================
// 20. Source-hue warnings: advisory fires before the fact, and stays quiet when clean
// ============================================================

{
  // The real case this came from: a ramp named "Green" whose source sits at H 169.95 —
  // green by 0.05 degrees — where the +4 nudge sends steps 9-12 into cyan.
  const bad = generateScale('#009070', 'free', { dark: false });
  check('advisory warning fires for an out-of-range source',
    !!bad.sourceHueWarning, 'no sourceHueWarning for H 169.95 in the green family');
  check('factual escape warning names the affected steps',
    !!bad.familyEscapeWarning && /step 9 -> cyan/.test(bad.familyEscapeWarning),
    bad.familyEscapeWarning || 'no familyEscapeWarning');

  // The corrected source: same family, inside the recommended range, no warnings at all.
  const good = generateScale('#109858', 'free', { dark: false });
  check('no warnings for a source inside the recommended range',
    !good.sourceHueWarning && !good.familyEscapeWarning,
    `${good.sourceHueWarning || ''} ${good.familyEscapeWarning || ''}`);

  // Neutrals have no family rules and must never warn.
  const grey = generateScale('#696969', 'grey', { dark: false });
  check('grey mode never warns about source hue',
    !grey.sourceHueWarning && !grey.familyEscapeWarning, 'grey scale produced a hue warning');

  // Every reference scale in this document must be warning-free — if any of the skill's own
  // published sources tripped these, the thresholds would be wrong, not the sources.
  let refWarnings = 0;
  REFERENCE_SCALES.forEach(r => {
    const s = generateScale(r.hex, r.mode, { dark: r.dark });
    if (s.sourceHueWarning || s.familyEscapeWarning) refWarnings++;
  });
  check('no reference scale trips a source-hue warning', refWarnings === 0,
    `${refWarnings} of ${REFERENCE_SCALES.length} reference scales warned`);
}

// ============================================================
// 23. Yellow's familyEscapeWarning exemption was unconditional for one
//    release — it silently suppressed ANY escape, not just the
//    documented, verified dark-tail drift into orange. The same
//    continuous-drift formula also pushes light steps toward green for
//    sources near yellow's upper boundary, which is a structurally
//    different, undocumented case that should still warn. Originally
//    found against the reference lime #A0C800, which green-escaped at
//    steps 1-5 under full drift; since the 1.4.0 hue-scaled drift,
//    lime-region sources hold their hue and #A0C800 no longer escapes
//    at all (asserted in section 33), so the single-case fixture here
//    is a mid-band source (#6D6700, H 105.6) where the scaled drift is
//    still near full strength and the green escape still occurs.
// ============================================================

{
  const yellow = generateScale('#CA8A04', 'free', { dark: false });
  check('yellow reference (#CA8A04): no warning for the documented orange-drift', yellow.familyEscapeWarning === undefined, yellow.familyEscapeWarning);

  const midYellow = generateScale('#6D6700', 'free', { dark: false });
  check('mid-band yellow (#6D6700): DOES warn for the undocumented green-escape', typeof midYellow.familyEscapeWarning === 'string' && midYellow.familyEscapeWarning.includes('green'), midYellow.familyEscapeWarning);

  // Amber #FFC330: the real production ramp that admitted the red half of the exemption
  // (1.7.1). Its dark steps 1-2 land at H 39.16/39.42 — under 40, so nominally red — by
  // the same rotation that carries every yellow's dark tail through orange. #CA8A04 only
  // avoided this by stopping at 40.79, 0.79 degrees short.
  const amberDark = generateScale('#FFC330', 'free', { dark: true });
  check('amber (#FFC330) dark: no warning for the warm drift running past orange into red', amberDark.familyEscapeWarning === undefined, amberDark.familyEscapeWarning);
  check('amber (#FFC330) dark: steps 1-2 really do resolve to red (the fixture is live)',
    detectFamily(amberDark.steps[0].H) === 'red' && detectFamily(amberDark.steps[1].H) === 'red',
    `${detectFamily(amberDark.steps[0].H)}/${detectFamily(amberDark.steps[1].H)}`);

  // Broad check: across a sweep of yellow-family sources, an escape into the warm drift's
  // own path (orange or red) should never warn, but a green (or any other) escape always
  // should. Both modes: the rotation is signed by L-distance, so dark mode is where the
  // tail runs furthest and light mode is where the green escape lives.
  const { oklchToHex } = require('../scripts/generate.js');
  const WARM = new Set(['orange', 'red']);
  let warmOnlyWarned = 0, otherEscapeMissed = 0, tested = 0;
  for (let h = 72; h <= 128; h += 4) {
    for (const l of [0.45, 0.60, 0.75, 0.85]) {
      for (const dark of [false, true]) {
        const hex = oklchToHex(l, 0.15, h);
        const scale = generateScale(hex, 'free', { dark });
        if (scale.family !== 'yellow') continue;
        tested++;
        const escapedFamilies = [...new Set(scale.steps.map(s => detectFamily(s.H)).filter(f => f !== 'yellow'))];
        const onlyWarm = escapedFamilies.length > 0 && escapedFamilies.every(f => WARM.has(f));
        const hasOther = escapedFamilies.some(f => !WARM.has(f));
        if (onlyWarm && scale.familyEscapeWarning) warmOnlyWarned++;
        if (hasOther && !scale.familyEscapeWarning) otherEscapeMissed++;
      }
    }
  }
  check('yellow: warm-drift-only escapes (orange/red) never warn, across a broad sweep', warmOnlyWarned === 0, `${warmOnlyWarned} false positives`);
  check('yellow: non-warm escapes always warn, across a broad sweep', otherEscapeMissed === 0, `${otherEscapeMissed} missed warnings`);
}

// ============================================================
// 24. Input validation at the API boundary. Before parseHex existed, an
//    invalid hex sailed through parseInt into a NaN cascade and produced
//    '#NANNANNAN' steps with oklch(NaN NaN NaN); an unknown mode silently
//    behaved as free mode AND stamped the bogus name into provenance.
// ============================================================

{
  const { parseHex } = require('../scripts/generate.js');

  let threw = false;
  try { generateScale('notahex', 'free'); } catch (e) { threw = /Invalid hex/.test(e.message); }
  check('validation: garbage hex throws a clear error', threw);

  threw = false;
  try { generateScale('#1A6FBF', 'banana'); } catch (e) { threw = /Invalid mode/.test(e.message); }
  check('validation: unknown mode throws instead of stamping provenance', threw);

  // `gray` is grey mode spelled en-US: same values, only the provenance word follows the caller.
  const gb = generateScale('#696969', 'grey'), us = generateScale('#696969', 'gray');
  check('dialect: gray and grey generate identical hexes', us.steps.every((st, i) => st.hex === gb.steps[i].hex));
  check('dialect: gray stays grey internally', us.mode === 'grey', us.mode);
  check('dialect: gray provenance says gray mode', us.steps.every(st => /· gray mode/.test(st.figmaDescription) && !/grey/.test(st.figmaDescription)), us.steps[0].figmaDescription);
  check('dialect: grey provenance unchanged (en-GB default)', gb.steps.every(st => /· grey mode/.test(st.figmaDescription)), gb.steps[0].figmaDescription);
  check('dialect: alpha follows the spelling', generateAlphaScale(us, 'gray').every(a => /gray mode$/.test(a.figmaDescription)));

  check('validation: 3-digit shorthand expands', parseHex('#abc') === '#AABBCC', parseHex('#abc'));
  check('validation: bare 6-digit accepted and normalized', parseHex('1a6fbf') === '#1A6FBF', parseHex('1a6fbf'));

  const s = generateScale('1a6fbf', 'free'); // no '#', lowercase
  check('validation: normalized source appears in provenance', s.steps[0].figmaDescription.includes('#1A6FBF'), s.steps[0].figmaDescription);
  check('validation: no NaN in output for normalized input', s.steps.every(st => !/NaN|NAN/i.test(st.hex + st.oklch)));

  threw = false;
  try { driftTowardReference(generateScale('#1A6FBF', 'free'), 'xyz'); } catch (e) { threw = /Invalid hex/.test(e.message); }
  check('validation: driftTowardReference rejects a malformed reference', threw);
}

// ============================================================
// 25. Dark chromatic alpha semantics — the direction of the solve, not
//    just the round-trip (section 2's extended cases cover exactness).
//    Solved against black: dark step 1 must be the MOST translucent step
//    and alpha must rise toward the light end — the light-formula bug
//    produced the exact inverse (step 1 at alpha 0.95).
// ============================================================

{
  const darkBlue = generateScale('#1A6FBF', 'free', { dark: true });
  const a = generateAlphaScale(darkBlue, 'blue');
  check('dark chromatic alpha: step 1 is genuinely translucent', a[0].alpha < 0.3, `alpha=${a[0].alpha}`);
  check('dark chromatic alpha: alpha rises toward the light end',
        a[11].alpha > a[0].alpha && a[8].alpha > a[3].alpha,
        a.map(x => x.alpha.toFixed(3)).join(','));
  // Compositing over BLACK must reproduce the solid step (within the FLOOR bleed).
  const rgbOf = h => [0, 2, 4].map(i => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  let worst = 0;
  a.forEach((step, i) => {
    const t = rgbOf(darkBlue.steps[i].hex), b = rgbOf(step.base);
    for (let ch = 0; ch < 3; ch++) worst = Math.max(worst, Math.abs(Math.round(b[ch] * step.alpha) - t[ch]));
  });
  check('dark chromatic alpha: composites over black to the solid step (≤3/255 bleed)', worst <= 3, `worst=${worst}/255`);
  // Light behavior must be byte-identical to before the dark branch existed —
  // guarded independently of the reference tables.
  const lightBlue = generateScale('#1A6FBF', 'free');
  const al = generateAlphaScale(lightBlue, 'blue');
  // Pin: light blue step 1 (#FBFDFE) has min channel 0xFB=251, so the white-solved
  // alpha is exactly (255-251)/255. Any change to the light path breaks this.
  check('light chromatic alpha unchanged by the dark branch',
        Math.abs(al[0].alpha - (255 - 251) / 255) < 1e-6, `alpha=${al[0].alpha}`);
  check('light chromatic alpha: step 1 near-transparent as before', al[0].alpha < 0.05, `alpha=${al[0].alpha}`);
}

// ============================================================
// 26. Near-neutral alpha routing — the single-base neutral solve reads one
//    channel and assumes R=G=B, but the neutral classification threshold
//    (C < 0.01) admits faintly tinted sources whose steps have unequal
//    channels. Routed through the single-base solve, a C=0.009 source
//    measured a composite error of 11/255. Routing is now decided from the
//    measured channels, not the family label.
// ============================================================

{
  const { oklchToHex } = require('../scripts/generate.js');
  const tinted = generateScale(oklchToHex(0.52, 0.009, 250), 'free'); // classifies neutral, channels unequal
  check('near-neutral source still classifies as neutral family', tinted.family === 'neutral', tinted.family);
  const a = generateAlphaScale(tinted, 'neutral');
  const rgbOf = h => [0, 2, 4].map(i => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  let worst = 0;
  a.forEach((step, i) => {
    const t = rgbOf(tinted.steps[i].hex), b = rgbOf(step.base);
    for (let ch = 0; ch < 3; ch++) worst = Math.max(worst, Math.abs(Math.round(b[ch] * step.alpha + 255 * (1 - step.alpha)) - t[ch]));
  });
  check('near-neutral alpha composites within FLOOR bleed (was 11/255)', worst <= 3, `worst=${worst}/255`);
  check('near-neutral alpha routed per-step (rgb css), not single-base', a[0].css.startsWith('rgb('), a[0].css);
  // A truly achromatic grey ramp must still take the single-base neutral path —
  // its reference alpha tables are pinned in section 2 and must not re-route.
  const grey = generateScale('#6A6A6A', 'grey');
  const ga = generateAlphaScale(grey, 'grey');
  check('true C=0 grey still routes to the single-base neutral solve', ga[0].css.startsWith('oklch('), ga[0].css);
}

// ============================================================
// 27. Measured AAA contrast warning. Free mode holds by construction
//    (fixed L scale — worst swept case 7.8:1), but anchored mode overrides
//    a text step's L with the source's own L: a source at L ~0.44-0.47
//    anchors at step 10 and lifts it above the fixed 0.42, dropping
//    high-luminance hues below 7:1 (measured to 6.68:1). Like
//    familyEscapeWarning, the check is measured from output, not predicted.
// ============================================================

{
  const { oklchToHex, buildTable } = require('../scripts/generate.js');

  // Known-failing case from the calibration sweep: olive-green at L 0.465.
  const failing = generateScale(oklchToHex(0.465, 0.13, 120), 'anchored');
  check('contrastWarning fires for an anchored source in the text zone',
        typeof failing.contrastWarning === 'string' && failing.contrastWarning.includes('step 10'),
        failing.contrastWarning);
  check('anchorInTextZone flag set when anchor lands at steps 10-12',
        failing.anchorIdx >= 9 && failing.anchorInTextZone === true,
        `anchorIdx=${failing.anchorIdx}`);
  check('table output surfaces the contrast warning',
        buildTable(failing).some(l => l.includes('WCAG AAA')),
        buildTable(failing)[1]);

  // Every reference source must stay warning-free in both modes — the guarantee the
  // skill description makes must actually hold where it claims to.
  const refs = ['#1A6FBF', '#109858', '#B91C1C', '#97287C', '#CA8A04', '#A0C800', '#12A594', '#E07000'];
  let spurious = 0;
  refs.forEach(hex => {
    [false, true].forEach(dark => {
      const s = generateScale(hex, 'free', { dark });
      if (s.contrastWarning) spurious++;
    });
  });
  check('no reference scale trips the contrast warning (free, light+dark)', spurious === 0, `${spurious} spurious warnings`);

  const grey = generateScale('#6A6A6A', 'grey');
  check('grey mode trips no contrast warning', !grey.contrastWarning, grey.contrastWarning);
  check('a clean anchored source trips no contrast warning', !generateScale('#1A6FBF', 'anchored').contrastWarning);
}

// ============================================================
// 28. CLI: --table --alpha must print the solid L/C/H table first, then
//    the alpha table — a previous main() passed alphaSteps to both calls,
//    printing the identical alpha table twice and the solid table never.
// ============================================================

{
  const { execSync } = require('child_process');
  const out = execSync(`node ${__dirname}/../scripts/generate.js '#6A6A6A' --mode grey --alpha --table`).toString();
  check('CLI table+alpha: solid L/C/H table present', out.includes('| L     | C '), out.split('\n')[2]);
  check('CLI table+alpha: alpha table present', out.includes('Alpha base'), 'no alpha table');
  const alphaHeaders = (out.match(/Alpha base/g) || []).length;
  check('CLI table+alpha: alpha table printed exactly once', alphaHeaders === 1, `printed ${alphaHeaders} times`);
  // Invalid input must fail with a clear message, not NaN output.
  let failedCleanly = false;
  try { execSync(`node ${__dirname}/../scripts/generate.js 'notahex' 2>&1`); }
  catch (e) { failedCleanly = e.status === 1 && /Invalid hex/.test(e.stdout.toString() + e.stderr.toString()); }
  check('CLI rejects invalid hex with a clear error', failedCleanly);
}

// ============================================================
// 29. Anchored-dark reference pin + gate semantics. The vestigial
//    isAnchor logic in applyFamilyRules() was removed after a 15,600-scale
//    sweep (every family × free/anchored × light/dark × ceiling on/off)
//    confirmed byte-identical output — but anchored DARK output was never
//    pinned anywhere, so this pins one full scale to keep the removal (and
//    the deliberate absolute-index dark gate) from silently changing under
//    a future edit. The gate is keyed to the FIXED curve anchor (step 9),
//    not the migrated anchored-mode anchor, because the nudge zones are
//    defined in absolute step indices — see applyFamilyRules().
// ============================================================

{
  const s = generateScale('#109858', 'anchored', { dark: true, luminanceText: false });
  const expect = ['#0B140E', '#0E1C13', '#0F2517', '#0E2E1B', '#08371E', '#185533',
                  '#277449', '#109858', '#5EB37F', '#78CC9F', '#94E2B7', '#B3FBD2'];
  check('anchored-dark pin: anchor migrates to step 8 for this source', s.anchorIdx === 7, `anchorIdx=${s.anchorIdx}`);
  let bad = 0;
  s.steps.forEach((st, i) => { if (st.hex !== expect[i]) bad++; });
  check('anchored-dark pin: all 12 hexes exact', bad === 0,
        s.steps.map(x => x.hex).join(' '));
  // The gate itself: dark mode nudges only steps STRICTLY beyond the fixed step 9 —
  // dark step 9 keeps the raw source hue even though the light rule says "steps 9-12",
  // and this holds regardless of where the anchored anchor landed (step 8 here).
  check('anchored-dark gate: step 9 keeps raw source hue', Math.abs(s.steps[8].H - 155.05) < 0.01, `H=${s.steps[8].H.toFixed(2)}`);
  check('anchored-dark gate: step 10 carries the +4 green nudge', Math.abs(s.steps[9].H - 159.05) < 0.01, `H=${s.steps[9].H.toFixed(2)}`);
  // And the anchor's protection comes from the verbatim guard alone: the anchor step
  // reproduces the source hex exactly despite sitting inside the dark 0.85x reduction
  // and (for ceilinged families) the ceiling zone.
  check('anchored-dark pin: anchor verbatim', s.steps[7].hex === '#109858', s.steps[7].hex);
}

// ============================================================
// 30. Measured contrast annotations. Per-step WCAG fields, informational
//    APCA at the text steps, and the solidForeground recommendation that
//    generalizes the prose yellow foreground-on-solid rule into measured
//    data. All additive — no pinned hex moves.
// ============================================================

{
  const { apcaLc, contrastRatio, oklchToHex } = require('../scripts/generate.js');

  // APCA implementation validated against published check values, not self-pins.
  check('APCA check value: #888888 on #FFFFFF ~ 63.06', Math.abs(apcaLc('#888888', '#FFFFFF') - 63.06) < 0.3, `got ${apcaLc('#888888', '#FFFFFF')}`);
  check('APCA check value: #FFFFFF on #000000 ~ -107.9', Math.abs(apcaLc('#FFFFFF', '#000000') - (-107.9)) < 0.3, `got ${apcaLc('#FFFFFF', '#000000')}`);

  const b = generateScale('#1A6FBF', 'free');
  // Fields present everywhere; APCA only at text steps (informational scope).
  check('contrast fields on every step', b.steps.every(s => typeof s.contrastVsWhite === 'number' && typeof s.contrastVsCanvas === 'number'));
  check('APCA fields on text steps only',
        [9, 10, 11].every(i => typeof b.steps[i].apcaVsWhite === 'number') &&
        b.steps.slice(0, 9).every(s => s.apcaVsWhite === undefined));
  // Values must match an independent recomputation (the annotation isn't a cache that
  // can drift from the hex it describes).
  const r2 = x => Math.round(x * 100) / 100;
  check('contrastVsWhite matches independent recomputation',
        b.steps.every(s => s.contrastVsWhite === r2(contrastRatio(s.hex, '#FFFFFF'))));
  check('contrastVsCanvas is 1.0 at step 1 (canvas vs itself)', b.steps[0].contrastVsCanvas === 1);
  // Sign convention: dark text on light refs is positive; light text on dark canvas negative.
  check('APCA positive for light-mode text steps vs white', b.steps[11].apcaVsWhite > 0, `${b.steps[11].apcaVsWhite}`);
  const d = generateScale('#1A6FBF', 'free', { dark: true });
  check('APCA negative for dark-mode text steps vs canvas', d.steps[11].apcaVsCanvas < 0, `${d.steps[11].apcaVsCanvas}`);
  // The warning must read the same numbers it emits — trip a known-failing case and
  // confirm the ratio quoted in the warning equals the annotated field.
  const failing = generateScale(oklchToHex(0.465, 0.13, 120), 'anchored');
  check('contrastWarning quotes the annotated ratio',
        failing.contrastWarning.includes(failing.steps[9].contrastVsWhite.toFixed(2)),
        failing.contrastWarning);

  // solidForeground: blue's solid supports white text; a vivid brand yellow anchored
  // high (the prose rule's motivating case — anchor L > ~0.65) flips to dark, and the
  // solid step used is the ANCHOR (step 5 here), not an assumed step 9 — exactly the
  // doc's own instruction to check the anchor's actual L.
  check('solidForeground: blue recommends light', b.solidForeground.recommend === 'light' && b.solidForeground.step === 9, JSON.stringify(b.solidForeground));
  const y = generateScale(oklchToHex(0.87, 0.17, 95), 'anchored');
  check('solidForeground: vivid anchored yellow recommends dark', y.solidForeground.recommend === 'dark', JSON.stringify(y.solidForeground));
  check('solidForeground: anchored mode evaluates the real anchor step', y.solidForeground.step === y.anchorIdx + 1, `step=${y.solidForeground.step}, anchorIdx=${y.anchorIdx}`);
  check('solidForeground: dark-text candidate is the scale\'s own dark end',
        b.solidForeground.darkTextHex === b.steps[11].hex && d.solidForeground.darkTextHex === d.steps[0].hex);

  // Drift rebuilds step objects — annotations must be recomputed, not lost or stale.
  const drifted = driftTowardReference(b, '#8040FF');
  check('drift recomputes contrast annotations', drifted.steps.every(s => typeof s.contrastVsWhite === 'number'));
  check('drift recomputes solidForeground', drifted.solidForeground && drifted.solidForeground.step === 9, JSON.stringify(drifted.solidForeground));
  check('drifted annotations match the drifted hexes, not the originals',
        drifted.steps.every(s => s.contrastVsWhite === r2(contrastRatio(s.hex, '#FFFFFF'))));
}

// ============================================================
// Since 2.0.0 luminanceText is the default. Pins recorded for other features
// (taper, lime hue-hold, anchored dark, peak, capped/uncapped provenance) keep
// running on `luminanceText: false`, the schedule they were measured on — those
// features act on steps 1-9 and are independent of the text-step targeting,
// which section 31 tests on its own.
// 31. Versioned generation options — easeHueSnaps and luminanceText.
//    Both default OFF; the reference-table pins in section 1 already
//    prove default output is untouched. These check the flags' own
//    contracts: easing keeps the discrete schedule's endpoints (step 12
//    identical, family-escape calibration intact) while removing the
//    snap; luminance targeting makes text-step contrast hue-independent
//    while leaving the verbatim anchor (and its warning) alone.
// ============================================================

{
  // --- easeHueSnaps ---
  const gDisc = generateScale('#277C37', 'free');
  const gEase = generateScale('#277C37', 'free', { easeHueSnaps: true });
  check('ease: green tail eases +1/+2/+3/+4',
        [1, 2, 3, 4].every((n, k) => Math.abs(gEase.steps[8 + k].H - (146.69 + n)) < 0.01),
        gEase.steps.slice(8).map(s => s.H.toFixed(2)).join(','));
  check('ease: step 12 identical to the discrete schedule (full N at the end)',
        gEase.steps[11].hex === gDisc.steps[11].hex, `${gEase.steps[11].hex} vs ${gDisc.steps[11].hex}`);
  check('ease: max hue jump between adjacent nudged steps shrinks',
        Math.max(...[8,9,10,11].map(i => Math.abs(gEase.steps[i].H - gEase.steps[i-1].H))) <
        Math.max(...[8,9,10,11].map(i => Math.abs(gDisc.steps[i].H - gDisc.steps[i-1].H))));
  const rEase = generateScale('#BA2C2C', 'free', { easeHueSnaps: true });
  check('ease: red mid-step rule is triangular (-2/-4/-2), continuous both ends',
        Math.abs(rEase.steps[5].H - 24.03) < 0.01 && Math.abs(rEase.steps[6].H - 22.03) < 0.01 &&
        Math.abs(rEase.steps[7].H - 24.03) < 0.01,
        rEase.steps.slice(4, 9).map(s => s.H.toFixed(2)).join(','));
  const bEaseD = generateScale('#1064CD', 'free', { dark: true, easeHueSnaps: true });
  check('ease: dark gate holds — dark step 9 keeps raw source hue under easing',
        Math.abs(bEaseD.steps[8].H - 257.58) < 0.01, bEaseD.steps[8].H.toFixed(2));
  // Eased intermediate steps rotate strictly LESS than the discrete schedule, so the
  // family-escape avoid bounds (calibrated on max rotation, hit only at step 12) hold.
  const nearBound = generateScale(require('../scripts/generate.js').oklchToHex(0.55, 0.15, 164), 'free', { easeHueSnaps: true });
  check('ease: no family escape inside the safe range under easing',
        nearBound.familyEscapeWarning === undefined, nearBound.familyEscapeWarning);

  // --- luminanceText ---
  const refs = [['#1064CD'], ['#277C37'], ['#FFC53D'], ['#BA2C2C']];
  for (const dark of [false, true]) {
    const targeted = refs.map(([h]) => generateScale(h, 'free', { dark, luminanceText: true }));
    for (const i of [9, 10, 11]) {
      const vals = targeted.map(s => dark ? s.steps[i].contrastVsCanvas : s.steps[i].contrastVsWhite);
      const spread = Math.max(...vals) - Math.min(...vals);
      check(`luminance: cross-hue contrast spread < 0.15 at step ${i + 1} (${dark ? 'dark' : 'light'})`,
            spread < 0.15, `spread=${spread.toFixed(2)} (${vals.join(', ')})`);
    }
  }
  const lt = generateScale('#FFC53D', 'free', { luminanceText: true });
  check('luminance: targeted steps carry the provenance token',
        [9, 10, 11].every(i => lt.steps[i].figmaDescription.includes('luminance-targeted')));
  check('luminance: non-text steps carry no token',
        lt.steps.slice(0, 9).every(s => !s.figmaDescription.includes('luminance-targeted')));
  check('luminance: all targeted text steps clear AAA', [9, 10, 11].every(i => lt.steps[i].contrastVsWhite >= 7));
  // The verbatim anchor is exempt — an anchored source in the text zone stays verbatim
  // and stays warned about, even with luminanceText on.
  const { oklchToHex } = require('../scripts/generate.js');
  const anchoredFail = generateScale(oklchToHex(0.465, 0.13, 120), 'anchored', { luminanceText: true });
  check('luminance: verbatim anchor is exempt and contrastWarning survives',
        anchoredFail.steps[anchoredFail.anchorIdx].hex === oklchToHex(0.465, 0.13, 120).toUpperCase() &&
        typeof anchoredFail.contrastWarning === 'string',
        anchoredFail.contrastWarning);
  const grey = generateScale('#CACACA', 'grey', { luminanceText: true, easeHueSnaps: true });
  check('flags are no-ops for grey mode', grey.steps[10].L === 0.33 && grey.steps[11].L === 0.20);

  // Eased-hue provenance token: only on steps the eased schedule actually changed.
  const gE = generateScale('#277C37', 'free', { easeHueSnaps: true });
  check('ease: changed steps carry the eased-hue token',
        [8, 9, 10].every(i => gE.steps[i].figmaDescription.includes('eased hue')));
  check('ease: step 12 carries no token (identical to discrete)',
        !gE.steps[11].figmaDescription.includes('eased hue'), gE.steps[11].figmaDescription);
  check('ease: un-nudged steps carry no token',
        gE.steps.slice(0, 8).every(s => !s.figmaDescription.includes('eased hue')));
  check('ease: default schedule never carries the token',
        generateScale('#277C37', 'free').steps.every(s => !s.figmaDescription.includes('eased hue')));
  const yE = generateScale('#FFC53D', 'free', { easeHueSnaps: true });
  check('ease: yellow (already continuous) never carries the token',
        yE.steps.every(s => !s.figmaDescription.includes('eased hue')));
}

// ============================================================
// 32. Anchor-proximity taper on the background-zone chroma cap
//    (anchored mode only). The anchor is cap-exempt (verbatim); before
//    the taper, a vivid anchor landing in or near steps 1-5 sat at full
//    source chroma against neighbors flattened at C=0.10 — a one-step
//    spike (confirmed: lime #AACF24 anchored at step 6 gave step 5
//    C 0.100 against anchor C 0.185, where the curve alone gives a
//    smooth 0.145). backgroundCap() now tapers the cap toward the
//    anchor's effective source chroma within TAPER_RADIUS steps:
//    cap = 0.10 + (effSrcC - 0.10) × (R - dist) / R. The taper only
//    ever LOOSENS the cap; free and grey mode keep the flat 0.10
//    unconditionally, and every anchored ramp whose anchor sits more
//    than TAPER_RADIUS steps from the cap zone is byte-identical to
//    pre-taper output (verified against the pre-change build; the pins
//    below keep that fixed).
// ============================================================

{
  const { backgroundCap, TAPER_RADIUS, contrastRatio } = require('../scripts/generate.js');
  const approx = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 0.003 : tol);

  // Unit semantics of the cap itself.
  check('taper: radius constant is 3', TAPER_RADIUS === 3);
  // backgroundCap's 4th arg is designatedPeak (boolean) since 1.6.0 — true for
  // anchored anchors AND free --peak ramps, false for plain free/grey. One flag,
  // replacing the (mode, peaked) pair that needed lockstep threading.
  check('taper: cap at the anchor equals effSrcC', approx(backgroundCap(3, 3, 0.2, true), 0.2, 1e-9));
  check('taper: linear ramp at dist 1 and 2',
        approx(backgroundCap(2, 3, 0.2, true), 0.10 + 0.10 * 2 / 3, 1e-9) &&
        approx(backgroundCap(1, 3, 0.2, true), 0.10 + 0.10 * 1 / 3, 1e-9));
  check('taper: flat 0.10 at dist >= TAPER_RADIUS', backgroundCap(0, 3, 0.2, true) === 0.10 && backgroundCap(4, 0, 0.2, true) === 0.10);
  check('taper: never tightens — effSrcC <= 0.10 keeps the flat cap', backgroundCap(2, 3, 0.08, true) === 0.10);
  check('taper: no designated peak always flat (plain free / grey)', backgroundCap(4, 3, 0.2, false) === 0.10 && backgroundCap(4, 3, 0.2, undefined) === 0.10);

  // Yellow #FFE629, anchored light: anchor at step 4, inside the cap zone. Steps 3
  // and 5 ramp toward the anchor instead of flattening at 0.10; steps 1-4 chroma is
  // monotone rising (no step-adjacent drop before the anchor); steps 6-12 are exactly
  // the pre-taper values (dist > radius or cap-irrelevant).
  const y = generateScale('#FFE629', 'anchored', { luminanceText: false });
  check('taper FFE629: anchor at step 4', y.anchorIdx === 3, `anchorIdx=${y.anchorIdx}`);
  check('taper FFE629: step 3 C ~0.126', approx(y.steps[2].C, 0.126), `C=${y.steps[2].C.toFixed(4)}`);
  check('taper FFE629: step 5 C ~0.156', approx(y.steps[4].C, 0.156), `C=${y.steps[4].C.toFixed(4)}`);
  check('taper FFE629: steps 1-4 chroma monotone rising',
        y.steps.slice(0, 4).every((s, i, a) => i === 0 || s.C >= a[i - 1].C),
        y.steps.slice(0, 4).map(s => s.C.toFixed(4)).join(' '));
  const yExpect = ['#FFFFE6', '#FFFCC2', '#FDF28B', '#FFE629', '#F5DC51', '#DFB611',
                   '#C39300', '#A57200', '#8F5D00', '#6F4100', '#5C3100', '#492200'];
  check('taper FFE629: full ramp pinned (steps 6-12 = pre-taper)',
        y.steps.every((s, i) => s.hex === yExpect[i]), y.steps.map(s => s.hex).join(' '));

  // Amber #FFC53D, anchored light: anchor at step 5. Step 4 loosens to ~0.114;
  // steps 1-3 (dist >= 2 but curve chroma already under the tapered cap there)
  // are pre-taper values.
  const a = generateScale('#FFC53D', 'anchored', { luminanceText: false });
  check('taper FFC53D: anchor at step 5', a.anchorIdx === 4, `anchorIdx=${a.anchorIdx}`);
  check('taper FFC53D: step 4 C ~0.114', approx(a.steps[3].C, 0.115), `C=${a.steps[3].C.toFixed(4)}`);
  check('taper FFC53D: steps 1-3 = pre-taper', ['#FFFDF5', '#FFF8E3', '#FFEEBD'].every((h, i) => a.steps[i].hex === h));

  // Lime #AACF24, anchored light: the motivating case. Anchor at step 6, adjacent
  // to the cap zone; step 5 now takes the curve's own smooth 0.145 (the tapered cap
  // no longer binds), step 4 loosens slightly to ~0.109.
  const l = generateScale('#AACF24', 'anchored', { luminanceText: false });
  check('taper AACF24: anchor at step 6', l.anchorIdx === 5, `anchorIdx=${l.anchorIdx}`);
  check('taper AACF24: step 4 C ~0.109', approx(l.steps[3].C, 0.109), `C=${l.steps[3].C.toFixed(4)}`);
  check('taper AACF24: step 5 C ~0.145 (curve value, cap no longer binds)', approx(l.steps[4].C, 0.145), `C=${l.steps[4].C.toFixed(4)}`);

  // Orange #F17300, anchored light: taper reach without taper effect. Anchor at
  // step 7 puts steps 4-5 inside the radius, but sRGB max chroma at L 0.89 / H~50
  // is ~0.065 — under even the flat cap — so the gamut clamp binds first and the
  // whole ramp is byte-identical to pre-taper output. Asserted two ways: the pin,
  // and cap-not-binding directly (rendered C sits below the tapered cap).
  const o = generateScale('#F17300', 'anchored', { luminanceText: false });
  check('taper F17300: anchor at step 7', o.anchorIdx === 6, `anchorIdx=${o.anchorIdx}`);
  const oExpect = ['#FFFCFB', '#FFF6F2', '#FFEADE', '#FFDDCA', '#FFCFB5', '#FFA068',
                   '#F17300', '#C35B00', '#A44C00', '#7B3600', '#632A00', '#4D1E00'];
  check('taper F17300: full ramp pinned (= pre-taper, gamut clamp binds first)',
        o.steps.every((s, i) => s.hex === oExpect[i]), o.steps.map(s => s.hex).join(' '));
  check('taper F17300: rendered C at steps 4-5 sits below even the flat cap',
        o.steps[3].C < 0.10 && o.steps[4].C < 0.10, `C4=${o.steps[3].C.toFixed(4)} C5=${o.steps[4].C.toFixed(4)}`);

  // No-op guarantee: one anchored source per remaining family. All anchor at step 8
  // or 9 in light mode, and the taper's contribution is zero whenever the anchor sits
  // at least TAPER_RADIUS steps from the last cap-zone index (anchorIdx >= 4 +
  // TAPER_RADIUS — at exactly dist 3 the linear factor is (3-3)/3 = 0), so the flat
  // cap applies at every step 1-5 exactly as before the taper existed. (Byte-identity
  // to the pre-change build was verified directly when the taper landed; this keeps
  // the structural condition pinned.)
  for (const h of ['#006ABE', '#BF1E2E', '#007E3D', '#017785', '#229081', '#6351C9', '#893FB7', '#B8196F', '#905B2A']) {
    const s = generateScale(h, 'anchored');
    check(`taper no-op ${h}: light anchor >= ${4 + TAPER_RADIUS} steps index, cap-zone steps hold C <= 0.10`,
          s.anchorIdx >= 4 + TAPER_RADIUS && s.steps.slice(0, 5).every(st => st.C <= 0.10 + 1e-9),
          `anchorIdx=${s.anchorIdx}`);
  }

  // Dark mode: same rule, same radius (dark cap zone is also steps 1-5). A vivid red
  // anchoring at dark step 7 puts step 5 at dist 2: previously flat 0.100, now the
  // curve's own 0.1056 under a tapered cap of ~0.131 — ramping toward the anchor.
  const d = generateScale('#BF1E2E', 'anchored', { dark: true });
  check('taper dark BF1E2E: anchor at step 7', d.anchorIdx === 6, `anchorIdx=${d.anchorIdx}`);
  check('taper dark BF1E2E: step 5 loosened above the flat cap, below the anchor',
        d.steps[4].C > 0.10 && d.steps[4].C < d.steps[6].C, `C=${d.steps[4].C.toFixed(4)}`);
  check('taper dark BF1E2E: step 5 pinned', d.steps[4].hex === '#570D12', d.steps[4].hex);

  // Clamp-grid guard: the taper must never TIGHTEN rendered chroma. clampToGamut's
  // landing point is start-dependent (0.001 decrement grid + FP accumulation against
  // the ±0.001 tolerance), so loosening the pre-clamp C above 0.10 at a step whose
  // sRGB wall sits BELOW 0.10 could land up to ~0.001 under the pre-taper value —
  // found by adversarial fuzzing against the pre-taper build (#00AFFF anchored,
  // step 5: C 0.0600 -> 0.0595), fixed by clampCapZone() rendering both the tapered
  // and flat-cap starts and keeping the higher. Two pins hold the fix: #00AFFF
  // (wall binds below 0.10 at every taper-reach step -> byte-identical to
  // pre-taper), #FFB300 (wall does not bind at step 5 -> genuine loosening there,
  // pre-taper everywhere else).
  const cyan = generateScale('#00AFFF', 'anchored', { luminanceText: false });
  const cyanExpect = ['#FBFDFF', '#F3FAFF', '#DFF1FF', '#CCE9FF', '#B7E1FF', '#79C9FF',
                      '#00AFFF', '#0186C4', '#0070A6', '#005477', '#004360', '#00324B'];
  check('taper guard 00AFFF: anchor at step 7, ramp byte-identical to pre-taper (wall binds)',
        cyan.anchorIdx === 6 && cyan.steps.every((s, i) => s.hex === cyanExpect[i]),
        cyan.steps.map(s => s.hex).join(' '));
  check('taper guard 00AFFF: step 5 keeps the pre-taper clamp landing', approx(cyan.steps[4].C, 0.0600, 1e-9), `C=${cyan.steps[4].C.toFixed(4)}`);
  const amber = generateScale('#FFB300', 'anchored', { luminanceText: false });
  const amberExpect = ['#FFFDF6', '#FFF8E6', '#FFEDC3', '#FFE1A2', '#FFCB69', '#FFB300',
                       '#D68700', '#B56700', '#9D5200', '#7B3600', '#672600', '#531700'];
  check('taper guard FFB300: anchor at step 6, only step 5 differs from pre-taper (genuine loosening)',
        amber.anchorIdx === 5 && amber.steps.every((s, i) => s.hex === amberExpect[i]),
        amber.steps.map(s => s.hex).join(' '));
  check('taper guard FFB300: step 5 C ~0.130 (was flat 0.100 pre-taper)', approx(amber.steps[4].C, 0.1298), `C=${amber.steps[4].C.toFixed(4)}`);

  // recover.js inherits the taper automatically (it recovers by regenerating
  // candidates through generateScale): the new tapered FFE629 output round-trips
  // to anchored mode, the exact source, at zero error.
  const { recoverParameters } = require('../scripts/recover.js');
  const rec = recoverParameters(y.steps.map(s => s.hex), { dark: false });
  check('taper recover: FFE629 tapered output round-trips exactly',
        rec.mode === 'anchored' && rec.source === '#FFE629' && rec.err.mean === 0 && rec.err.max === 0,
        `${rec.mode} ${rec.source} err ${rec.err && rec.err.mean}`);

  // WCAG guard: every step the taper changed, measured against its own step 12,
  // must not sit more than 0.1 below its pre-taper ratio (pre-change values
  // measured before the taper landed; actual movement was <= 0.05).
  const preTaper = [
    [y, 2, 12.09], [y, 4, 10.03],   // FFE629 steps 3, 5
    [a, 3, 10.50],                   // FFC53D step 4
    // AACF24 re-pinned at 1.4.0: the hue-scaled drift (lime holds hue) moved both the
    // cap-zone steps and step 12, shifting these ratios by ~0.1-0.3. Still far above
    // any usable threshold; the guard keeps them from silently eroding further.
    [l, 3, 10.84], [l, 4, 9.04],     // AACF24 steps 4, 5
  ];
  for (const [scale, i, oldRatio] of preTaper) {
    const r = contrastRatio(scale.steps[i].hex, scale.steps[11].hex);
    check(`taper WCAG: ${scale.source} step ${i + 1} vs step 12 holds (pre-taper ${oldRatio})`,
          r >= oldRatio - 0.1, `now ${r.toFixed(2)}`);
  }
}

// ============================================================
// 33. Hue-scaled yellow drift (lime holds hue) + APCA in solidForeground.
//    Both from the yellow-in-color-scale-generators research (Aug 2026).
//    (1) yellowDrift is scaled by yellowHueScale(sourceH): full strength
//    at H <= 105, fading linearly to zero at H >= 125, so lime-region
//    sources hold their hue instead of rotating into the dark
//    yellow-green zone Google's DislikeAnalyzer marks as universally
//    disliked (CAM16 hue 90-111, chroma > 16, tone < 65). Radix's
//    hand-tuned lime holds H 119-129 across all 12 steps while the same
//    team drifts amber to H 54 — the hue, not the house style, decides.
//    Yellow/amber sources (H <= 105) are byte-identical to 1.3.1
//    (verified against the pre-change build; the section-1 and taper
//    pins keep that fixed). (2) solidForeground now dual-reports APCA
//    alongside WCAG 2, because WCAG 2 is documented by Radix's
//    maintainers to mispredict contrast for yellow/orange hues;
//    `recommend` stays WCAG-derived (normative), `apcaRecommend` is the
//    parallel APCA verdict.
// ============================================================

{
  const { yellowHueScale } = require('../scripts/generate.js');

  // Scale-function semantics.
  check('hueScale: full drift at and below H 105', yellowHueScale(80) === 1 && yellowHueScale(105) === 1);
  check('hueScale: zero drift at and above H 125', yellowHueScale(125) === 0 && yellowHueScale(129) === 0);
  check('hueScale: linear midpoint', Math.abs(yellowHueScale(115) - 0.5) < 1e-9, `got ${yellowHueScale(115)}`);

  // Lime #AACF24 anchored: hue held (residual drift within Radix's own 119-129
  // wobble), dark steps out of the disliked band, no green escape, full ramp pinned.
  const l = generateScale('#AACF24', 'anchored', { luminanceText: false });
  const lExpect = ['#FAFFF2', '#F1FFDA', '#E4F8BF', '#D6F19F', '#C0E06F', '#AACF24',
                   '#8DAA00', '#738800', '#617200', '#485400', '#3A4200', '#2C3200'];
  check('lime: full anchored ramp pinned (hue-hold values)', l.steps.every((s, i) => s.hex === lExpect[i]), l.steps.map(s => s.hex).join(' '));
  check('lime: every step holds H within 117-125', l.steps.every(s => s.H >= 117 && s.H <= 125), l.steps.map(s => s.H.toFixed(0)).join(' '));
  check('lime: dark steps sit above the disliked 90-111 band', l.steps.slice(8).every(s => s.H > 111), l.steps.slice(8).map(s => s.H.toFixed(1)).join(' '));
  check('lime: no familyEscapeWarning under hue hold', l.familyEscapeWarning === undefined, l.familyEscapeWarning);
  check('lime: anchor still verbatim', l.steps[5].hex === '#AACF24', l.steps[5].hex);

  // Reference lime #A0C800 (H 122.9): the old full drift pushed steps 1-5 into green;
  // held hue keeps the whole ramp yellow-family with no warning.
  const ref = generateScale('#A0C800', 'free');
  check('reference lime (#A0C800): no green escape under hue hold', ref.familyEscapeWarning === undefined, ref.familyEscapeWarning);

  // recover.js: the drift inversion now solves the piecewise hue scale. The anchored
  // lime round-trips to the exact source at zero error (the verbatim anchor gives
  // recovery an exact hex to find); the free-mode ramp has no verbatim step, so its
  // bound is sub-1/255 via the light-step chroma estimate (was 3.11/255 before it).
  const { recoverParameters } = require('../scripts/recover.js');
  const rl = recoverParameters(l.steps.map(s => s.hex), { dark: false });
  check('lime recover: anchored round-trip exact', rl.mode === 'anchored' && rl.source === '#AACF24' && rl.err.mean === 0, `${rl.mode} ${rl.source} err ${rl.err && rl.err.mean}`);
  const rf = recoverParameters(ref.steps.map(s => s.hex), { dark: false });
  check('reference lime recover: free round-trip stays exact', rf.mode === 'free' && rf.err.mean < 1.0, `${rf.mode} ${rf.source} err ${rf.err && rf.err.mean}`);

  // solidForeground APCA fields: present, numeric, and agreeing with WCAG on the
  // clear-cut cases (vivid yellow -> dark, mid blue -> light). APCA sign convention:
  // negative for light-on-dark, positive for dark-on-light.
  const y = generateScale('#FFE629', 'anchored', { luminanceText: false });
  const b = generateScale('#1A6FBF', 'free');
  check('solidForeground: APCA fields present and numeric',
        typeof y.solidForeground.apcaVsWhite === 'number' && typeof y.solidForeground.apcaVsDarkText === 'number');
  check('solidForeground: apcaRecommend dark for vivid yellow, light for blue',
        y.solidForeground.apcaRecommend === 'dark' && b.solidForeground.apcaRecommend === 'light',
        JSON.stringify([y.solidForeground.apcaRecommend, b.solidForeground.apcaRecommend]));
  check('solidForeground: WCAG and APCA verdicts agree on the clear-cut cases',
        y.solidForeground.recommend === y.solidForeground.apcaRecommend && b.solidForeground.recommend === b.solidForeground.apcaRecommend);
}

// ============================================================
// 34. --peak (free-mode chroma-curve peak placement), v1.5.0. Born from
//    a real palette where five non-brand ramps were being generated in
//    anchored mode purely to move the vividness peak off step 9 — the
//    sRGB cusp lightness varies by hue (see "Anchor ≠ rendered peak
//    chroma"), and free mode had no way to act on that. --peak moves
//    ONLY the chroma curve's peak: fixed L grid untouched, nothing
//    verbatim, no midpoint smoothing. The peak step inherits the
//    anchored anchor's cap-zone semantics (exemption + neighbour taper)
//    because it IS the designated vividness maximum. Provenance carries
//    'peak N'; solidForeground evaluates the peak step; recover.js
//    identifies peak ramps via the observed chroma argmax (see the
//    seeding notes there — three real bugs live in that comment).
// ============================================================

{
  const { LIGHT_L } = require('../scripts/generate.js');
  const hexes = s => s.steps.map(x => x.hex).join(',');

  // peak 9 IS the default: byte-identical, no token, null field.
  const p9 = generateScale('#1DAAC4', 'free', { peakStep: 9 });
  check('peak: 9 collapses to the free default', hexes(p9) === hexes(generateScale('#1DAAC4', 'free')) && p9.peakStep === null && !p9.steps[0].figmaDescription.includes('peak'));

  // Validation is loud, per the invalid-mode precedent.
  const throws = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  check('peak: anchored mode throws', throws(() => generateScale('#1DAAC4', 'anchored', { peakStep: 7 })));
  check('peak: grey mode throws', throws(() => generateScale('#6A6A6A', 'grey', { peakStep: 7 })));
  check('peak: out-of-range and non-integer throw',
        throws(() => generateScale('#1DAAC4', 'free', { peakStep: 0 })) &&
        throws(() => generateScale('#1DAAC4', 'free', { peakStep: 13 })) &&
        throws(() => generateScale('#1DAAC4', 'free', { peakStep: 6.5 })));

  // Core semantics on the cyan that motivated the option.
  const c = generateScale('#1DAAC4', 'free', { peakStep: 7, luminanceText: false });
  check('peak: L grid untouched (all 12 steps on the fixed scale)', c.steps.every((s, i) => Math.abs(s.L - LIGHT_L[i]) < 1e-12));
  let maxC = 0, maxAt = 0; c.steps.forEach((s, i) => { if (s.C > maxC) { maxC = s.C; maxAt = i + 1; } });
  check('peak: chroma maximum lands at the peak step', maxAt === 7, 'max at ' + maxAt);
  check('peak: provenance carries the token', c.steps[0].figmaDescription.includes('· peak 7'), c.steps[0].figmaDescription);
  check('peak: peakStep field set and solidForeground evaluates the peak', c.peakStep === 7 && c.solidForeground.step === 7);
  check('peak: nothing verbatim (anchored-only guarantee)', c.steps[6].L === LIGHT_L[6]);

  // Cap-zone peak: exemption + neighbour taper, mirroring the anchored anchor.
  const y = generateScale('#FDE335', 'free', { peakStep: 4 });
  check('peak: cap-zone peak step exempt from the flat 0.10 cap', y.steps[3].C > 0.10, 'C=' + y.steps[3].C.toFixed(3));
  check('peak: cap-zone neighbours taper toward the peak', y.steps[2].C > 0.10 && y.steps[4].C > 0.10 && y.steps[2].C < y.steps[3].C,
        [y.steps[2].C, y.steps[3].C, y.steps[4].C].map(v => v.toFixed(3)).join(' '));

  // Recovery: all five real re-derive ramps round-trip with mode, peak and low error.
  // Amber is the load-bearing case: its curve peaks at 5 but RENDERS its maximum at 6
  // (fixed-L step 5 is lighter than the source, and the gamut clamp bites there), so
  // the argmax heuristic alone picks the wrong peak, a source seeded at the peak
  // step's L cannot even encode the true chroma, and the hue seed needs the drift
  // zero-point at the argmax L — the three bugs the seeding comment in recover.js
  // records. This pins all three fixes at once.
  const { recoverParameters } = require('../scripts/recover.js');
  for (const [hex, peak] of [['#FDE335', 4], ['#FFC330', 5], ['#ADCE2C', 6], ['#EA7111', 7], ['#1DAAC4', 7]]) {
    const s = generateScale(hex, 'free', { peakStep: peak });
    const r = recoverParameters(s.steps.map(st => st.hex), { dark: false });
    check('peak recover ' + hex + ': free mode, peak ' + peak + ', low error',
          r.mode === 'free' && r.peak === peak && r.err.mean < 0.5,
          `got ${r.mode} peak ${r.peak} err ${r.err.mean.toFixed(2)}`);
  }
  // Non-peak ramps must NOT pick up a spurious peak.
  const plain = recoverParameters(generateScale('#2D82F8', 'free').steps.map(s => s.hex), { dark: false });
  check('peak recover: plain free ramp carries no peak', plain.mode === 'free' && !plain.peak, JSON.stringify({ mode: plain.mode, peak: plain.peak }));
  const anch = recoverParameters(generateScale('#1DAAC4', 'anchored').steps.map(s => s.hex), { dark: false });
  check('peak recover: genuinely anchored ramp still recovers as anchored', anch.mode === 'anchored' && anch.err.mean === 0, JSON.stringify({ mode: anch.mode, err: anch.err.mean }));
}

// ============================================================
// Cross-hue calibration — maxChromaAt / usableChromaAt / sourceAtSaturation
// ============================================================
{
  const ok = h => linearToOKLCH(...hexToLinear(h));

  // The ceiling must be the ceiling: renderable at it, genuinely out of gamut above it.
  // "Out of gamut" must be asked of isOutOfGamut — the generator's own predicate, the one
  // maxChromaAt is built on. Two other readings were tried and both were vacuous: round-tripping
  // through oklchToHex CLIPS channels, so an out-of-gamut request returns a valid-looking hex
  // (156 false escapes), and oklchToRgb01 clamps to [0,1] internally, so it can never report a
  // breach at all (300 — every case failing for the same wrong reason). A probe that cannot
  // report the thing it is asked about is a finding about the probe.
  let worstAtCeiling = 0, aboveInGamut = 0;
  for (let i = 0; i < 300; i++) {
    const H = (i * 1.7) % 360, L = 0.3 + ((i * 7) % 60) / 100;
    const ceil = maxChromaAt(L, H);
    const [, rendered] = ok(oklchToHex(L, ceil, H));
    worstAtCeiling = Math.max(worstAtCeiling, Math.abs(rendered - ceil));
    if (!isOutOfGamut(L, ceil + 0.02, H)) aboveInGamut++;
  }
  check('maxChromaAt: renders what it promises', worstAtCeiling < 0.005, `worst drift ${worstAtCeiling.toFixed(4)}`);
  check('maxChromaAt: chroma above the ceiling is out of gamut', aboveInGamut === 0, `${aboveInGamut} escaped`);

  // The family ceiling is the binding one for the three constrained families, and only
  // for those three. This is the mistake the helper exists to prevent: reporting a
  // magenta as under-saturated because sRGB's ~0.28 was used as the denominator.
  for (const H of [335, 310, 285]) {
    const fam = detectFamily(H);
    check(`usableChromaAt: ${fam} is capped by its family ceiling`,
          Math.abs(usableChromaAt(0.63, H) - FAMILY_C_CEILING[fam]) < 1e-9,
          `${usableChromaAt(0.63, H)} vs ${FAMILY_C_CEILING[fam]}`);
    check(`usableChromaAt: ${fam} --no-ceiling falls back to sRGB`,
          usableChromaAt(0.63, H, true) === maxChromaAt(0.63, H));
  }
  for (const H of [25, 55, 90, 150, 195, 250]) {
    check(`usableChromaAt: ${detectFamily(H)} is bounded by sRGB alone`,
          usableChromaAt(0.63, H) === maxChromaAt(0.63, H));
  }

  // A calibrated source lands at the requested fraction of its own hue's headroom,
  // preserving L and H. 8-bit quantisation is the only slack allowed.
  // Measured against the SOURCE HEX's own L and H, not the L/C/H the fixture asked for.
  // A fixture built by oklchToHex is already gamut-clipped, so at H 219.6 the requested
  // hue arrives as 226.28 before sourceAtSaturation ever sees it; comparing to the
  // request blamed the function for 6.78 degrees of the fixture's own drift.
  let worstFrac = 0, worstLH = 0;
  for (const sat of [0.5, 0.8, 0.95, 1.0]) {
    for (let i = 0; i < 60; i++) {
      const src = oklchToHex(0.45 + (i % 30) / 100, 0.12, (i * 6.1) % 360);
      const [sL, , sH] = ok(src);
      const [oL, oC, oH] = ok(sourceAtSaturation(src, sat));
      worstFrac = Math.max(worstFrac, Math.abs(oC / usableChromaAt(oL, oH) - sat));
      worstLH = Math.max(worstLH, Math.abs(oL - sL), Math.min(Math.abs(oH - sH), 360 - Math.abs(oH - sH)));
    }
  }
  check('sourceAtSaturation: hits the requested fraction', worstFrac < 0.05, `worst ${worstFrac.toFixed(3)}`);
  check('sourceAtSaturation: preserves L and H', worstLH < 2.0, `worst ${worstLH.toFixed(2)}`);

  // Loud on invalid input, per the invalid-mode precedent.
  for (const bad of [0, -0.5, 1.5, 'x', null, undefined, NaN]) {
    let threw = false;
    try { sourceAtSaturation('#448252', bad); } catch (e) { threw = /Invalid saturation/.test(e.message); }
    check(`sourceAtSaturation: rejects ${JSON.stringify(bad)}`, threw);
  }

  // The point of the whole feature: equal FRACTION reads as peers where equal CHROMA
  // cannot. Calibrating three hues with very different headroom to the same fraction
  // must leave each near its own ceiling — whereas one shared absolute chroma is
  // forced down to the weakest hue. Pinned because a real palette was flattened this
  // way before the helper existed.
  const trio = ['#DEC37A', '#448252', '#CB50B9'].map(h => sourceAtSaturation(h, 0.95));
  const fracs = trio.map(h => { const [L, C, H] = ok(h); return C / usableChromaAt(L, H); });
  check('sourceAtSaturation: a calibrated trio sits at one fraction, not one chroma',
        fracs.every(f => Math.abs(f - 0.95) < 0.05), JSON.stringify(fracs.map(f => f.toFixed(3))));
  const chromas = trio.map(h => ok(h)[1]);
  check('sourceAtSaturation: that trio does NOT share an absolute chroma (negative)',
        Math.max(...chromas) - Math.min(...chromas) > 0.02, JSON.stringify(chromas.map(c => c.toFixed(3))));
}

// ============================================================
// 2.0.0 — the text steps target luminance by default.
// OKLab L is not WCAG luminance: at equal L the text steps' contrast varied by
// hue. Targeting became the default so new ramps ship with it; the old schedule
// stays reproducible, and recovery says which one a ramp is on.
// ============================================================

{
  const { recoverParameters } = require('../scripts/recover.js');
  // The cross-hue spread is asserted under `luminanceText: true` in section 31;
  // this makes that the default.
  check('2.0 default equals luminanceText: true',
    generateScale('#1A6FBF').steps.every((st, i) => st.hex === generateScale('#1A6FBF', 'free', { luminanceText: true }).steps[i].hex));
  check('2.0 luminanceText: false reproduces the pre-2.0 blue step 10',
    generateScale('#1A6FBF', 'free', { luminanceText: false }).steps[9].hex === '#005088');
  const cli = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'generate.js'), '#1A6FBF', '--oklch-text'], { encoding: 'utf8' });
  check('2.0 --oklch-text reproduces the pre-2.0 ramp', JSON.parse(cli).steps[9].hex === '#005088');
  const older = recoverParameters(generateScale('#109858', 'free', { luminanceText: false }).steps.map((st) => st.hex), { dark: false });
  const current = recoverParameters(generateScale('#109858').steps.map((st) => st.hex), { dark: false });
  check('2.0 recovery marks a pre-2.0 ramp oklchText (free mode recovers within 1/255, as before)', older.oklchText === true && older.err.max <= 1, JSON.stringify({ o: older.oklchText, e: older.err }));
  check('2.0 recovery leaves a current ramp unmarked', !current.oklchText && current.err.max <= 1, JSON.stringify({ o: current.oklchText, e: current.err }));
}

// ============================================================
// 2.1.0 — drift at the steps OKLCH L still places (1-9) is reported.
// The article's advice: build in OKLCH, measure in luminance. Steps 1-9 keep
// their L; a step whose hue moves it across 3:1 or 4.5:1 from a neutral at the
// same L is named, from raw ratios.
// ============================================================

{
  const { contrastRatio } = require('../scripts/generate.js');
  const violet = generateScale('#BD00BE');
  check('2.1 drift: violet step 8 crosses 4.5:1 where a neutral does not, and is named',
    /step 8 4\.50:1 where a neutral at its L gives 4\.12:1 \(4\.5:1\)/.test(violet.contrastDriftWarning || ''), violet.contrastDriftWarning);
  const red = generateScale('#D93025');
  check('2.1 drift: red step 8 at 4.496:1 is compared raw, so it does not count as passing',
    contrastRatio(red.steps[7].hex, '#FFFFFF') < 4.5 && !red.contrastDriftWarning, red.contrastDriftWarning);
  check('2.1 drift: a neutral ramp never drifts', !generateScale('#6A6A6A', 'grey').contrastDriftWarning);
  check('2.1 drift: dark mode measures against step 1 without throwing', typeof generateScale('#0E8D00', 'free', { dark: true }) === 'object');
  const table = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'generate.js'), '#BD00BE', '--table'], { encoding: 'utf8' });
  check('2.1 drift: --table prints the warning', /⚠ This hue's luminance moves a step across/.test(table));
}

// ============================================================
// Report
// ============================================================

console.log(`${pass}/${pass + fail} checks passed`);
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
} else {
  console.log('All checks passed.');
  process.exit(0);
}
