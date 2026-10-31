#!/usr/bin/env node
// OKLCH Color Scale System — generation engine.
// Implements oklch-color-scale-system/SKILL.md exactly. Run this instead of hand-computing
// OKLCH math — it's faster and eliminates arithmetic slips from manual simulation.
//
// Each step also carries figmaSuffix (the single step nearest the source in OKLab space
// gets '-anchor' if it reproduces the source hex exactly, '-source' otherwise — see
// SKILL.md "Figma variable naming"; all other steps get '') and figmaDescription (OKLCH value +
// source/mode/light-dark/ceiling provenance) — see SKILL.md "Figma variable naming and
// descriptions" for the convention these implement.
//
// Usage:
//   node scripts/generate.js <hex> [options]
//
// Options:
//   --mode free|anchored|grey|gray   (default: free; gray = grey, en-US spelling)
//   --dark                      generate the dark-mode variant instead of light
//   --no-ceiling                skip chroma ceiling for indigo/purple/magenta
//   --peak <1-12>               free mode only: move the chroma curve's peak to this
//                               step (fixed L scale untouched; nothing verbatim)
//   --alpha                     also compute the alpha (transparent) scale
//   --table                     human-readable table instead of JSON
//   --name <label>              label for output (default: "scale")
//
// Examples:
//   node scripts/generate.js '#1A6FBF'
//   node scripts/generate.js '#1A6FBF' --dark --table
//   node scripts/generate.js '#9747FF' --mode anchored --no-ceiling --alpha
//   node scripts/generate.js '#6A6A6A' --mode grey --alpha --table

'use strict';

// ============================================================
// L SCALES — fixed tables, light/dark × chromatic/neutral
// ============================================================

const LIGHT_L = [0.993, 0.98, 0.95, 0.92, 0.89, 0.79, 0.69, 0.59, 0.52, 0.42, 0.36, 0.30];
const DARK_L = [0.18, 0.21, 0.24, 0.27, 0.30, 0.40, 0.50, 0.60, 0.70, 0.78, 0.85, 0.93];
const LIGHT_L_NEUTRAL = [0.993, 0.98, 0.95, 0.92, 0.89, 0.79, 0.69, 0.59, 0.52, 0.42, 0.33, 0.20];
const DARK_L_NEUTRAL = [0.18, 0.21, 0.24, 0.27, 0.30, 0.40, 0.50, 0.60, 0.70, 0.78, 0.87, 0.97];

const ANCHOR_IDX = 8; // step 9, 0-based
const NEUTRAL_C_THRESHOLD = 0.01;

// Pre-curve chroma ceilings for the three gamut-constrained families (see Hue family
// rules in SKILL.md). One table, three readers: applyFamilyRules, generateScale and
// usableChromaAt. It lived as duplicated literals in the first two for six versions —
// harmless while both sat in this file's own curve path, a real hazard the moment a
// calibration helper joined them, because a helper disagreeing with the generator about
// magenta's ceiling would report a saturation fraction the ramp never renders.
const FAMILY_C_CEILING = { indigo: 0.18, purple: 0.15, magenta: 0.20 };

const ROLES = [
  'Canvas background', 'Page background', 'Subtle background', 'UI element background',
  'Hover background', 'Active/selected background', 'UI border', 'Hovered border',
  'Solid / anchor', 'Muted text', 'Body text', 'Headings'
];

// ============================================================
// COLOR SPACE CONVERSIONS
// ============================================================

// Validate and normalize a hex color to '#RRGGBB' (uppercase). Accepts 6-digit with or
// without '#', and expands 3-digit shorthand. Anything else throws — before this guard
// existed, an invalid input (e.g. 'notahex', '#FFF' unexpanded) sailed straight through
// parseInt into a NaN cascade and produced '#NANNANNAN' steps with oklch(NaN NaN NaN),
// silently corrupting output and provenance instead of failing at the boundary.
function parseHex(hex) {
  if (typeof hex !== 'string') throw new Error(`Invalid hex color: ${String(hex)} (expected '#RRGGBB')`);
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex color: '${hex}' (expected '#RRGGBB' or '#RGB')`);
  return '#' + h.toUpperCase();
}

// The sRGB transfer both ways and OKLab to linear sRGB: the toolkit's one formulas
// (tools/shared/colour.js), copied because this skill ships alone, and held to them
// character for character by tools/shared/test-colour.mjs. Every linearisation below
// goes through srgbToLinear: there were three, written out each time.
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const oklabToLinearSrgb = (L, a, b) => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
};

// WCAG 2.x relative luminance and contrast ratio, from an '#RRGGBB' hex. Used only for
// the contrastWarning check — OKLab L is NOT luminance (the mapping is hue-dependent),
// which is exactly why the AAA claim has to be measured from output rather than assumed
// from the fixed L scale whenever anchored mode overrides a text step's L.
function wcagLuminance(hex) {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(srgbToLinear);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrastRatio(hexA, hexB) {
  const la = wcagLuminance(hexA), lb = wcagLuminance(hexB);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// APCA (Accessible Perceptual Contrast Algorithm) Lc, per the 0.0.98G-4g constants —
// the draft contrast model for WCAG 3. Emitted as INFORMATIONAL data only, never as a
// warning threshold: APCA is pre-standard and its constants have shifted between
// releases, so nothing in this system gates on it. It's included because WCAG 2's
// ratio is known to mispredict perceived contrast for light-on-dark polarity — exactly
// where the dark scale lives — and having the number alongside the WCAG ratio costs
// nothing. Sign convention is APCA's own: positive for dark-text-on-light-background,
// negative for light-on-dark. Rough reading guide (current draft): |Lc| ≥ 75 body
// text, ≥ 60 large text, ≥ 45 headlines/bold.
// Implementation verified against the commonly published check value:
// #888888 text on #FFFFFF background = Lc 63.06.
function apcaY(hex) {
  const h = hex.replace('#', '');
  const f = c => Math.pow(parseInt(h.slice(c, c + 2), 16) / 255, 2.4);
  return 0.2126729 * f(0) + 0.7151522 * f(2) + 0.0721750 * f(4);
}

function apcaLc(textHex, bgHex) {
  const softClamp = Y => (Y < 0.022 ? Y + Math.pow(0.022 - Y, 1.414) : Y);
  const Yt = softClamp(apcaY(textHex));
  const Yb = softClamp(apcaY(bgHex));
  if (Math.abs(Yb - Yt) < 0.0005) return 0;
  const S = Yb > Yt
    ? (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14   // normal polarity: dark text / light bg
    : (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14;  // reverse polarity: light text / dark bg
  let Lc;
  if (Math.abs(S) < 0.1) Lc = 0;
  else Lc = (S > 0 ? S - 0.027 : S + 0.027) * 100;
  return Math.round(Lc * 10) / 10;
}

function hexToLinear(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return [r, g, b].map(srgbToLinear);
}

function linearToOKLCH(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(a * a + bv * bv);
  let H = (Math.atan2(bv, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function oklchToLinear(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  return oklabToLinearSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad));
}


function oklchToRgb01(L, C, H) {
  return oklchToLinear(L, C, H).map(v => Math.max(0, Math.min(1, v))).map(linearToSrgb);
}

function oklchToHex(L, C, H) {
  const rgb = oklchToRgb01(L, C, H);
  const clamp = x => Math.max(0, Math.min(255, Math.round(x * 255)));
  return '#' + rgb.map(clamp).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// isOutOfGamut/clampToGamut use a ±0.001 tolerance — this is load-bearing, not decorative.
// See SKILL.md "Gamut clamping" for why: a strict [0,1] check produces different, lower-chroma
// output than every reference table in the skill.
function isOutOfGamut(L, C, H) {
  const [r, g, b] = oklchToLinear(L, C, H);
  return r < -0.001 || r > 1.001 || g < -0.001 || g > 1.001 || b < -0.001 || b > 1.001;
}

function clampToGamut(L, C, H) {
  while (isOutOfGamut(L, C, H) && C > 0) C = Math.max(0, C - 0.001);
  return C;
}

// ============================================================
// FAMILY DETECTION
// ============================================================

// Per-family "avoid" source-hue ranges, mirroring the Family detection table in SKILL.md.
//
// These are NOT stylistic preferences. Each bound is calibrated against that family's own
// hue nudge so the nudge can't push a step out of the family it's defined for. Green is the
// worked example: band 130-170, nudge +4 at steps 9-12, so a source above ~166 lands its
// dark steps at 170+, which is cyan. The documented bound of 165 sits ~1 degree below the
// measured eject point (166.02) — conservative by exactly one degree.
//
// FOUR bounds were miscalibrated for several releases, all in the same way: they permitted
// sources whose own family nudge then ejected steps into a neighbour. Corrected here, with
// the measured eject point in brackets:
//
//   magenta hi  358 -> 356   (+3 nudge, ejects into RED past 357.0 by wrapping through 360)
//   blue    lo  222 -> 225   (-4 nudge, ejects into cyan below 223.9)
//   indigo  lo  272 -> 274   (-3 nudge, ejects into blue below 273.0)
//   purple  lo  302 -> 303   (-2 nudge, ejects into indigo below 302.0 — marginal, but the
//                             other bounds all carry a full degree of margin)
//
// Note the direction split: families nudging POSITIVE (green, magenta) are at risk at the
// TOP of their band, families nudging NEGATIVE (blue, indigo, purple, red) at the BOTTOM.
// Checking only one end passes vacuously for half the table, which is how three of these
// four survived alongside the magenta case that was found by hand.
//
// All bounds verified by sweeping ACTUAL post-gamut-clamp source hue, not the requested
// hue — clamping shifts a requested hue by a degree or more, enough that arithmetic on
// nominal band edges gives the wrong answer.
const FAMILY_AVOID = {
  red:     { lo: 15,  hi: 37  },
  orange:  { lo: 42,  hi: 65  },
  yellow:  { lo: 72,  hi: 125 },
  green:   { lo: 133, hi: 165 },
  cyan:    { lo: 173, hi: 215 },
  blue:    { lo: 225, hi: 268 },
  indigo:  { lo: 274, hi: 298 },
  purple:  { lo: 303, hi: 319 },
  magenta: { lo: 322, hi: 356 }
};

function detectFamily(H) {
  H = ((H % 360) + 360) % 360;
  if (H >= 320) return 'magenta';
  if (H < 40) return 'red';
  if (H < 70) return 'orange';
  if (H < 130) return 'yellow';
  if (H < 170) return 'green';
  if (H < 220) return 'cyan';
  if (H < 270) return 'blue';
  if (H < 300) return 'indigo';
  return 'purple';
}

// ============================================================
// CROSS-HUE CALIBRATION
// ============================================================

// Highest in-gamut chroma at a given L and H. Deliberately implemented as clampToGamut
// walked down from above any real ceiling, rather than as its own bisection: it must
// agree with what the generator will actually render, and the only way to guarantee that
// is to share the predicate and the step size. A bisection with a different tolerance
// answers a slightly different question and drifts from the ramp it is meant to describe.
function maxChromaAt(L, H) {
  return clampToGamut(L, 0.4, H);
}

// The chroma a source can actually USE at this L and H — sRGB's ceiling, or the family's
// own pre-curve ceiling where one binds first. This is the denominator for saturation:
// a magenta at L 0.63 has ~0.285 of sRGB headroom but the generator will never let a
// source past 0.20, so calling 0.285 its maximum would report a fraction the ramp cannot
// render, and every magenta would come out looking under-saturated against its own number.
function usableChromaAt(L, H, noCeiling = false) {
  const srgb = maxChromaAt(L, H);
  const family = FAMILY_C_CEILING[detectFamily(H)];
  return (noCeiling || family === undefined) ? srgb : Math.min(srgb, family);
}

// Re-chroma a source to a fraction of what its own hue can reach, keeping L and H.
//
// This is the answer to "make these read as peers", and it is NOT equal chroma. sRGB's
// headroom varies by more than 2x across hue at the solid step (roughly yellow 0.11,
// green 0.15, magenta 0.24 at L 0.52), so a palette pinned to one absolute chroma is
// pinned to its weakest hue: every other ramp is muted to match, and the set reads flat.
// Equal FRACTION of each hue's own ceiling is what Radix and Tailwind ship — their yellow
// and their magenta are nowhere near the same chroma — and what this function computes.
//
// Returns a hex, so the result feeds straight back into generateScale as an ordinary
// source. That is the point: saturation shapes the SOURCE, not the curve, so the
// normalised hex is fully self-describing and provenance needs no extra token (unlike
// --peak, which changes curve shape and must therefore be recorded).
function sourceAtSaturation(hex, saturation, noCeiling = false) {
  if (typeof saturation !== 'number' || !(saturation > 0) || saturation > 1) {
    throw new Error(`Invalid saturation: ${saturation} (expected a number in (0, 1])`);
  }
  const [L, , H] = linearToOKLCH(...hexToLinear(parseHex(hex)));
  return oklchToHex(L, usableChromaAt(L, H, noCeiling) * saturation, H);
}

// ============================================================
// CHROMA CURVE
// ============================================================

function computeFactor(i, anchorIdx) {
  const exponent = 1.5, min = 0.10;
  if (i === anchorIdx) return 1.0;
  if (i < anchorIdx) return min + (1 - min) * Math.pow((i + 1) / (anchorIdx + 1), exponent);
  return Math.pow(0.93, i - anchorIdx);
}

// ============================================================
// HUE FAMILY RULES
// beyondAnchorOnly: dark-mode generation nudges only steps strictly beyond the anchor,
// to avoid double-shifting hue already baked into the anchor by light-mode rules.
// ============================================================

const TAPER_RADIUS = 3;

// Background-zone (steps 1-5) chroma cap. Flat at 0.10 in free and grey mode — always.
// In anchored mode, the anchor itself is exempt from this cap (verbatim, by construction
// — see the anchor-verbatim guard in generateScale). When that anchor lands in or near
// the background zone, a flat cap on its neighbours produces a one-step spike: the
// anchor at full source chroma next to neighbours flattened at 0.10. This tapers the cap
// up toward the anchor's own (post-ceiling) chroma within TAPER_RADIUS steps of it, so
// the neighbours ramp toward the anchor instead of stopping dead at a flat wall. See
// SKILL.md "Anchored mode — dark" / "the anchor's cap-exemption becomes a liability".
// Only ever LOOSENS the cap — dist > TAPER_RADIUS, or effSrcC <= 0.10, or free/grey mode
// all fall through to the unchanged flat 0.10.
// `designatedPeak` is the ONE flag both cap features key on: true when the ramp has a
// real, user-designated vividness peak — anchored mode's verbatim anchor OR a free-mode
// --peak step. Both mean the same thing to the cap: the peak step is exempt, and its
// cap-zone neighbours taper toward it rather than hitting a flat wall. It replaced a
// (mode, peaked) parameter pair that had to be threaded in lockstep through three
// functions and cost coordination work in three consecutive versions (1.3.0's "both
// cap sites must taper identically", 1.3.1, 1.5.0's threading) — one concept, one flag.
// Plain free and grey ramps pass false and keep the flat 0.10 unconditionally, as ever.
function backgroundCap(i, anchorIdx, effSrcC, designatedPeak) {
  const FLAT = 0.10;
  if (designatedPeak && effSrcC > FLAT) {
    const dist = Math.abs(i - anchorIdx);
    if (dist <= TAPER_RADIUS) {
      return FLAT + (effSrcC - FLAT) * (TAPER_RADIUS - dist) / TAPER_RADIUS;
    }
  }
  return FLAT;
}

// Gamut-clamp a cap-zone step without letting the taper TIGHTEN its rendered chroma.
// clampToGamut's landing point is start-dependent (it decrements from the pre-clamp C
// on a 0.001 grid, and floating-point accumulation interacts with the ±0.001 gamut
// tolerance), so loosening the cap above the flat 0.10 moves the clamp's starting
// point — and at steps where the sRGB wall sits BELOW 0.10, the new grid can land up
// to ~0.001 UNDER where the flat-cap start landed. Found by adversarial fuzzing
// against the pre-taper build (e.g. #00AFFF anchored, step 5: C 0.0600 -> 0.0595),
// not by design review: an output-visible tightening from a rule documented as
// loosen-only. So when the taper actually raised this step's pre-clamp C above the
// flat cap, render BOTH candidates and keep the higher — byte-identical to pre-taper
// output wherever the wall binds below 0.10, the tapered value wherever the taper
// genuinely helps, and a single plain clamp everywhere else (the two starts coincide
// whenever pre-clamp C <= 0.10, which is every non-tapered case).
function clampCapZone(L, C, H, i, anchorIdx, designatedPeak) {
  let out = clampToGamut(L, C, H);
  if (designatedPeak && i <= 4 && i !== anchorIdx && C > 0.10) {
    out = Math.max(out, clampToGamut(L, Math.min(C, 0.10), H));
  }
  return out;
}

function applyFamilyRules(stepIdx, L, C, H, family, sourceH, opts) {
  opts = opts || {};
  const beyondOnly = !!opts.beyondAnchorOnly;
  const noCeiling = !!opts.noCeiling;
  const ease = !!opts.easeHueSnaps;

  // NOTE — this function still special-cases no rule to the anchor STEP itself,
  // deliberately. The anchored-mode anchor never reaches this code at all:
  // generateScale()'s anchor-verbatim guard returns the raw source triple before any
  // per-step processing runs (see SKILL.md, Anchored mode — "don't enumerate exemptions
  // per rule"). An earlier version carried an `isAnchor = stepIdx === ANCHOR_IDX` check
  // here anyway, keyed to the FIXED curve anchor (index 8) rather than the real,
  // possibly-migrated anchored-mode anchor — dead because the background cap's
  // `stepIdx <= 4 && !isAnchor` could never see index 8, misleading because it read like
  // the mechanism protecting "verbatim", which it never was. Removed after verifying
  // byte-identical output across a broad sweep.
  //
  // `opts.anchorIdx` below is a DIFFERENT thing from that old dead check: it feeds the
  // background-cap TAPER (backgroundCap above), which shapes NEIGHBOURING steps toward
  // an anchor that lands near them — it never causes this function to treat stepIdx
  // itself as the anchor. Passed through as the real, possibly-migrated anchorIdx (never
  // the fixed ANCHOR_IDX constant) — using the constant here would silently mis-center
  // the taper for every anchor that isn't step 9, the exact class of bug the old dead
  // isAnchor check illustrates the cost of.
  if (!noCeiling && FAMILY_C_CEILING[family] !== undefined) C = Math.min(C, FAMILY_C_CEILING[family]);

  // A free-mode --peak step landing in the cap zone is exempt from the cap, exactly
  // like the anchored anchor (which never reaches this code): the peak IS the ramp's
  // designated vividness maximum, and capping it would defeat the option's purpose.
  // Its neighbours get the taper via backgroundCap's designatedPeak flag instead.
  // (For anchored ramps stepIdx never equals anchorIdx here — the verbatim guard
  // returns before this code — so the exemption below only ever fires for --peak.)
  if (stepIdx <= 4 && !(opts.designatedPeak && stepIdx === opts.anchorIdx)) {
    C = Math.min(C, backgroundCap(stepIdx, opts.anchorIdx, opts.effSrcC, opts.designatedPeak));
  }

  let H2 = H;
  // The dark-mode gate (`beyondAnchorOnly`) is keyed to the FIXED curve anchor
  // (ANCHOR_IDX, step 9) on purpose — NOT to anchored mode's migrated anchorIdx. The
  // nudge zones themselves are defined in absolute step indices (`stepIdx >= 8/9`,
  // "steps 9-12" in SKILL.md), so the gate that trims them for dark mode must be
  // absolute too: it exists to avoid re-shifting hue at the step the light-mode rules
  // treat as the hue's home (step 9), which is a property of the rule table, not of
  // where a particular anchored source happens to land. The real anchored-mode anchor
  // needs no protection here — see the verbatim guard note above.
  const beyond = stepIdx > ANCHOR_IDX;
  const nudgeGate = beyondOnly ? beyond : true;

  if (!ease) {
    // Default (v1) schedule — DISCRETE nudges, byte-identical to every pinned
    // reference table. The full ±N applies at every step in the tail, which creates
    // a hue snap at the tail's first step (e.g. blue: 4° between steps 9 and 10).
    if (family === 'blue' && stepIdx >= 9 && nudgeGate) H2 = sourceH - 4;
    if (family === 'indigo' && stepIdx >= 8 && nudgeGate) H2 = sourceH - 3;
    if (family === 'purple' && stepIdx >= 8 && nudgeGate) H2 = sourceH - 2;
    if (family === 'green' && stepIdx >= 8 && nudgeGate) H2 = sourceH + 4;
    if (family === 'magenta' && stepIdx >= 8 && nudgeGate) H2 = sourceH + 3;
    if (family === 'red' && stepIdx >= 5 && stepIdx <= 7) H2 = sourceH - 4;
  } else {
    // OPT-IN (versioned) schedule — EASED nudges. Same families, same total rotation
    // N, same endpoints: the tail eases linearly from 0 at the last un-nudged step to
    // the full ±N exactly at step 12, so step 12 matches the discrete schedule and
    // the family-escape calibration (which is governed by the maximum rotation, hit
    // only at step 12) stays valid — intermediate steps rotate strictly LESS than
    // the discrete schedule, never more. This is what yellow's continuous drift
    // already does, generalized: production ramps (Tailwind's hand-tuned OKLCH
    // palettes, Radix) drift hue gradually rather than snapping.
    //
    // Red's mid-step rule snaps IN and OUT (flat -4 at steps 6-8, 0 on both sides);
    // its eased form is triangular — half rotation at steps 6 and 8, full -4 at the
    // peak (step 7) — continuous at both ends.
    //
    // Changing schedules changes hex output for the affected steps, which is why
    // this is a flag and not the default: every pinned table and every shipped ramp
    // was generated on the discrete schedule.
    const tail = { blue: [-4, 9], indigo: [-3, 8], purple: [-2, 8], green: [4, 8], magenta: [3, 8] }[family];
    if (tail) {
      let [N, s] = tail;
      if (beyondOnly && s < 9) s = 9; // dark-mode gate: tail starts at step 10 (see Universal rules)
      if (stepIdx >= s) H2 = sourceH + N * (stepIdx - (s - 1)) / (11 - (s - 1));
    }
    if (family === 'red' && stepIdx >= 5 && stepIdx <= 7) {
      H2 = sourceH - 4 * (stepIdx === 6 ? 1 : 0.5); // -2, -4, -2 across steps 6-8
    }
  }

  // Normalize to [0, 360) — red (H 0-40) and magenta (H 320-360) both border the wrap
  // point, so a ±nudge can push a source hue near that boundary negative or past 360.
  // Found by broad fuzzing, not by design review: sources with H just above 0 hit
  // red's -4 nudge and came out negative (e.g. sourceH=0.99 -> H2=-3.01), leaking
  // straight into the oklch() string and figmaDescription. Every other hue computation
  // in this file already normalizes; this one didn't.
  H2 = ((H2 % 360) + 360) % 360;

  return { L, C, H: H2 };
}

// Hue-dependent scaling of yellow's drift: full strength for true yellows and ambers
// (source H <= 105), fading linearly to ZERO by H 125, so lime-region sources hold
// their hue instead of rotating toward orange. Grounded in what production systems
// ship (see SKILL.md "Yellow" and the yellow-in-color-scale-generators research
// guide): Radix's hand-tuned lime holds H 119-129 across all 12 steps while the SAME
// team drifts its amber to H 54, and Google's material-color-utilities defines dark
// yellow-green at CAM16 hue 90-111 as universally disliked (DislikeAnalyzer) — the
// exact zone an orange-drifted lime lands in. No studied system rotates a lime toward
// orange. The band edges mirror Material's isYellow band (105-125, CAM16; OKLCH hue
// agrees within ~2 degrees in this region). Linear fade rather than a hard cutover so
// two near-identical sources straddling a boundary can't produce structurally
// different ramps.
const YELLOW_DRIFT_FULL_H = 105; // full drift at or below this source hue
const YELLOW_DRIFT_ZERO_H = 125; // zero drift at or above this source hue

function yellowHueScale(sourceH) {
  if (sourceH <= YELLOW_DRIFT_FULL_H) return 1;
  if (sourceH >= YELLOW_DRIFT_ZERO_H) return 0;
  return (YELLOW_DRIFT_ZERO_H - sourceH) / (YELLOW_DRIFT_ZERO_H - YELLOW_DRIFT_FULL_H);
}

function yellowDrift(sourceL, sourceH, L) {
  const deltaL = sourceL - L;
  const drift = Math.max(-45, Math.min(45, 70 * deltaL)) * yellowHueScale(sourceH);
  // Yellow's family range (70-130) combined with the ±45 cap can't currently wrap past
  // 0/360 (worst case lands at H 25 or H 175), but normalize anyway for consistency with
  // every other hue computation in this file — cheap, and removes the assumption from
  // being load-bearing if the range or cap ever changes.
  return ((sourceH - drift) % 360 + 360) % 360;
}

// ============================================================
// SOLID SCALE GENERATION
// ============================================================

// Annotate a finished 12-step array with measured contrast data, and compute the
// solid-step foreground recommendation. Called by BOTH generateScale() and
// driftTowardReference() — drift rebuilds every step object (and can shift hue enough
// to move a ratio at the second decimal), so the annotations must be recomputed there,
// not inherited stale from the pre-drift scale.
//
// Per step: `contrastVsWhite` / `contrastVsCanvas` (WCAG 2 ratio, 2dp — canvas is the
// scale's own step 1). Text steps (10-12) additionally get `apcaVsWhite` /
// `apcaVsCanvas` (informational — see apcaLc above).
//
// `solidForeground` generalizes the yellow foreground-on-solid rule (SKILL.md, "Text
// usage rule") from prose into measured data: instead of "if the solid's L is above
// ~0.65, use dark text" — a threshold a human has to remember exists, stated for one
// family — it computes the actual WCAG ratio of both candidate foregrounds against the
// solid step's real hex and recommends whichever wins. The candidates are white
// ('light') and the scale's own dark end ('dark': step 12 in light mode, step 1 in
// dark mode — the same "family's own dark end" the prose rule names). The solid step
// is the anchor in anchored mode (the prose rule's own instruction: check the anchor's
// actual L, not an assumed step number) and step 9 otherwise.
function annotateContrast(steps, dark, anchorIdx, designatedPeak) {
  const canvas = steps[0].hex;
  const r2 = x => Math.round(x * 100) / 100;
  steps.forEach((s, i) => {
    s.contrastVsWhite = r2(contrastRatio(s.hex, '#FFFFFF'));
    s.contrastVsCanvas = r2(contrastRatio(s.hex, canvas));
    if (i >= 9) {
      s.apcaVsWhite = apcaLc(s.hex, '#FFFFFF');
      s.apcaVsCanvas = apcaLc(s.hex, canvas);
    }
  });
  // The solid step is the anchor in anchored mode, the designated peak under --peak
  // (same rationale as anchored: evaluate the ramp's actual vivid representative, not
  // an assumed step number), and step 9 otherwise.
  const solidIdx = designatedPeak ? anchorIdx : ANCHOR_IDX;
  const darkTextHex = dark ? steps[0].hex : steps[11].hex;
  const solidHex = steps[solidIdx].hex;
  const vsWhite = r2(contrastRatio(solidHex, '#FFFFFF'));
  const vsDarkText = r2(contrastRatio(solidHex, darkTextHex));
  // APCA Lc for the same two candidates (text on the solid), reported alongside the
  // WCAG ratios because WCAG 2's formula is documented — by the people who hand-tune
  // yellow scales — to mispredict contrast for yellow/orange hues (Radix designs its
  // solid steps against APCA and switches to dark text below |Lc| 40; see SKILL.md
  // "Contrast"). `recommend` stays WCAG-derived: WCAG 2 is the normative standard and
  // APCA is pre-standard with shifting constants, so APCA gets its own parallel
  // `apcaRecommend` (larger |Lc| wins) rather than silently changing the primary
  // field's meaning. When the two disagree on a yellow-family solid, trust APCA's
  // reading of legibility and WCAG's reading of compliance — they answer different
  // questions.
  const apcaVsWhite = apcaLc('#FFFFFF', solidHex);
  const apcaVsDarkText = apcaLc(darkTextHex, solidHex);
  return {
    solidForeground: {
      step: solidIdx + 1,
      recommend: vsWhite >= vsDarkText ? 'light' : 'dark',
      vsWhite,
      vsDarkText,
      apcaRecommend: Math.abs(apcaVsWhite) >= Math.abs(apcaVsDarkText) ? 'light' : 'dark',
      apcaVsWhite,
      apcaVsDarkText,
      darkTextHex
    }
  };
}

function generateScale(hex, mode, opts) {
  opts = opts || {};
  const dark = !!opts.dark;
  const noCeiling = !!opts.noCeiling;
  // Versioned generation options. easeHueSnaps is opt-in. luminanceText is ON by
  // default since 2.0.0 — OKLab L is not WCAG luminance, so equal L at the text
  // steps gave hue-dependent contrast; `luminanceText: false` reproduces a ramp
  // generated before 2.0.0. See SKILL.md "Versioned generation options".
  const ease = !!opts.easeHueSnaps;
  const lumText = opts.luminanceText !== false;

  hex = parseHex(hex); // throws on malformed input — see parseHex
  mode = mode || 'free';
  // `gray` is the en-US spelling of grey mode: generation is identical, only the word
  // written into provenance follows the caller's spelling. Internally the mode stays `grey`.
  const modeName = mode;
  if (mode === 'gray') mode = 'grey';
  if (mode !== 'free' && mode !== 'anchored' && mode !== 'grey') {
    // An unknown mode previously fell through all the mode comparisons, silently behaved
    // as free mode, AND stamped the bogus name into figmaDescription provenance (e.g.
    // "· banana mode ·") — corrupting the one record this system promises is truthful.
    throw new Error(`Invalid mode: '${mode}' (expected free, anchored, grey or gray)`);
  }

  // Versioned option: --peak N moves the CHROMA CURVE's peak to step N in free mode,
  // and changes nothing else — the fixed L scale is untouched, nothing is verbatim,
  // no neighbour is smoothed. It exists because the sRGB cusp lightness varies by hue
  // (documented under "Anchor ≠ rendered peak chroma"), so free mode's assumption
  // that every hue's vividness peak belongs at step 9 is false for naturally-light
  // hues — and before this option, the only escape was anchored mode, which drags in
  // verbatim semantics, an L-grid override and midpoint smoothing that a non-brand
  // ramp never asked for. Validated loudly: a peak outside free mode or outside 1-12
  // throws rather than silently ignoring, per the invalid-mode precedent above.
  let peakStep = opts.peakStep == null ? null : opts.peakStep;
  if (peakStep != null) {
    if (mode !== 'free') throw new Error(`--peak is a free-mode option (got mode '${mode}')`);
    if (!Number.isInteger(peakStep) || peakStep < 1 || peakStep > 12) {
      throw new Error(`Invalid peak step: ${peakStep} (expected an integer 1-12)`);
    }
    if (peakStep === 9) peakStep = null; // step 9 IS the free-mode default: byte-identical, no token
  }
  const peaked = peakStep != null;
  // One flag for both cap features (see backgroundCap): the ramp has a designated
  // vividness peak — anchored's verbatim anchor or a --peak step.
  const designatedPeak = mode === 'anchored' || peaked;

  const [rl, gl, bl] = hexToLinear(hex);
  const [srcL, srcC, srcH] = linearToOKLCH(rl, gl, bl);
  const family = detectFamily(srcH);
  const isNeutral = srcC < NEUTRAL_C_THRESHOLD;

  let LSCALE = dark ? DARK_L.slice() : LIGHT_L.slice();
  if (isNeutral) LSCALE = dark ? DARK_L_NEUTRAL.slice() : LIGHT_L_NEUTRAL.slice();

  let anchorIdx = ANCHOR_IDX;
  let effSrcC = srcC;
  if (!noCeiling && FAMILY_C_CEILING[family] !== undefined) effSrcC = Math.min(srcC, FAMILY_C_CEILING[family]);

  if (mode === 'anchored') {
    let minDist = Infinity;
    LSCALE.forEach((L, i) => {
      const d = Math.abs(L - srcL);
      if (d < minDist) { minDist = d; anchorIdx = i; }
    });
    LSCALE[anchorIdx] = srcL;
    if (anchorIdx > 0) {
      const prev = anchorIdx > 1 ? LSCALE[anchorIdx - 2] : LSCALE[0];
      LSCALE[anchorIdx - 1] = (prev + srcL) / 2;
    }
  } else if (peaked) {
    // --peak: only the curve's peak position moves. LSCALE is deliberately NOT touched.
    anchorIdx = peakStep - 1;
  }

  const globalDarkReduction = dark ? 0.85 : 1.0;

  // Luminance targets for the text steps (10-12) when luminanceText is on: the WCAG
  // relative luminance of the ACHROMATIC color at the standard fixed L values. OKLab L
  // is not luminance — at the same L, yellow renders far more luminous than blue —
  // which is why the fixed-L scale's contrast is only approximately hue-independent
  // (and why yellow is the documented exception). Fixing the text steps' Y instead of
  // their OKLab L makes the documented ratios hold for EVERY hue by construction:
  // per hue, per step, L is solved so the rendered color's Y hits the neutral target.
  // Targets use the standard (non-anchored-override, non-neutral-exception) L tables,
  // so the guaranteed ratios are exactly the ones the Contrast section documents.
  let lumTargets = null;
  if (lumText && mode !== 'grey' && !isNeutral) {
    const stdL = dark ? DARK_L : LIGHT_L;
    lumTargets = {};
    for (const i of [9, 10, 11]) lumTargets[i] = wcagLuminance(oklchToHex(stdL[i], 0, 0));
  }

  // Luminance of the continuous (pre-hex-quantization) rendered color — used by the
  // bisection so the solve is smooth; the final quantized hex lands within 1/255.
  const rgb01Luminance = rgb => {
    const lin = rgb.map(srgbToLinear);
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };

  const ceilingApplies = family === 'indigo' || family === 'purple' || family === 'magenta';
  const ceilingLabel = mode === 'grey' || isNeutral ? null : (noCeiling && ceilingApplies ? 'uncapped' : (ceilingApplies ? 'capped' : null));
  // 'peak N' is a provenance token like 'uncapped': a --peak ramp is NOT reproducible
  // from source + mode alone, so the record must carry it (drift-note principle).
  const peakLabel = peaked ? `peak ${peakStep}` : null;
  const provenanceBase = [`source ${hex.toUpperCase()}`, `${modeName} mode`, dark ? 'dark' : 'light', peakLabel].filter(Boolean).join(' · ');
  // Same as provenanceBase but without the light/dark token — for a Figma variable that
  // has separate Light/Dark modes on ONE description field (Figma descriptions are
  // per-variable, not per-mode), the mode label belongs on its own line under a
  // "Light:"/"Dark:" heading instead of baked into the string, which would otherwise
  // read redundant next to a heading that already says which mode it is.
  const provenanceBaseLine = [`source ${hex.toUpperCase()}`, `${modeName} mode`, peakLabel].filter(Boolean).join(' · ');

  const steps = LSCALE.map((baseL, i) => {
    let L = baseL;
    let H = srcH;

    const isTheAnchor = mode === 'anchored' && i === anchorIdx;

    // The anchor is always verbatim regardless of the ceiling setting — labeling it
    // "capped"/"uncapped" would misleadingly imply its chroma was touched by the
    // ceiling logic, when the anchor bypasses that logic entirely by construction.
    // (figmaSuffix is computed in a separate pass after all 12 steps exist — see below;
    // it needs every step's finished hex to determine which one is nearest the source.)
    const provenance = isTheAnchor
      ? [provenanceBase, 'verbatim'].join(' · ')
      : [provenanceBase, ceilingLabel].filter(Boolean).join(' · ');
    const provenanceLine = isTheAnchor
      ? [provenanceBaseLine, 'verbatim'].join(' · ')
      : [provenanceBaseLine, ceilingLabel].filter(Boolean).join(' · ');

    if (mode === 'grey' || isNeutral) {
      let C = srcC;
      C = clampToGamut(L, C, srcH);
      return finalize(i, L, C, srcH, '', provenance, provenanceLine);
    }

    // Anchored mode: the anchor step must reproduce the source verbatim. It is exempt
    // from every chroma ceiling, the dark-mode global reduction, and all hue-family
    // rules — "verbatim" is the entire point of anchored mode.
    if (mode === 'anchored' && i === anchorIdx) {
      return finalize(i, srcL, srcC, srcH, '', provenance, provenanceLine);
    }

    const factor = computeFactor(i, anchorIdx);

    // Renders this step's (C, H) for a candidate L through the exact same rule path
    // the normal pipeline uses below — yellow's drift depends on L, and gamut
    // clamping depends on L, so both must be recomputed per candidate.
    const renderAt = (Lc) => {
      let Cc = effSrcC * factor * globalDarkReduction;
      let Hc = srcH;
      if (family === 'yellow') {
        Hc = yellowDrift(srcL, srcH, Lc);
        if (i <= 4 && i !== anchorIdx) Cc = Math.min(Cc, backgroundCap(i, anchorIdx, effSrcC, designatedPeak));
      } else {
        const adj = applyFamilyRules(i, Lc, Cc, Hc, family, srcH, { noCeiling, beyondAnchorOnly: dark, easeHueSnaps: ease, anchorIdx, effSrcC, designatedPeak });
        Cc = adj.C; Hc = adj.H;
      }
      Cc = clampCapZone(Lc, Cc, Hc, i, anchorIdx, designatedPeak);
      return [Cc, Hc];
    };

    let lumTargeted = false;
    if (lumTargets && i >= 9 && !isTheAnchor) {
      // Bisection: rendered luminance is strictly increasing in L. The anchor step is
      // excluded — verbatim wins over everything, including this (which is why the
      // contrastWarning still exists even under luminanceText: an anchored source
      // whose own L lands in the text zone stays verbatim, and stays warned about).
      // Note this also overrides anchored mode's midpoint smoothing when the smoothed
      // neighbor is a text step: uniform text contrast outranks the smoothing.
      const target = lumTargets[i];
      let lo = dark ? 0.40 : 0.08, hi = dark ? 0.999 : 0.75;
      for (let it = 0; it < 48; it++) {
        const mid = (lo + hi) / 2;
        const [Cc, Hc] = renderAt(mid);
        if (rgb01Luminance(oklchToRgb01(mid, Cc, Hc)) < target) lo = mid; else hi = mid;
      }
      L = (lo + hi) / 2;
      lumTargeted = true;
    }

    let C = effSrcC * factor * globalDarkReduction;

    if (family === 'yellow') {
      H = yellowDrift(srcL, srcH, L);
      if (i <= 4 && i !== anchorIdx) C = Math.min(C, backgroundCap(i, anchorIdx, effSrcC, designatedPeak));
    } else {
      const adj = applyFamilyRules(i, L, C, H, family, srcH, { noCeiling, beyondAnchorOnly: dark, easeHueSnaps: ease, anchorIdx, effSrcC, designatedPeak });
      L = adj.L; C = adj.C; H = adj.H;
    }

    // Eased-hue provenance: marked only on steps whose hue the eased schedule actually
    // changed relative to the default discrete schedule (the two agree at step 12 and
    // at every un-nudged step, and yellow is identical under both). Same principle as
    // the luminance-targeted and drift tokens — a value not reproducible from
    // source + mode + default settings must say so in its own record.
    let hueEased = false;
    if (ease && family !== 'yellow') {
      const discrete = applyFamilyRules(i, L, effSrcC * factor * globalDarkReduction, srcH, family, srcH, { noCeiling, beyondAnchorOnly: dark, anchorIdx, effSrcC, designatedPeak });
      hueEased = Math.abs(discrete.H - H) > 1e-9;
    }

    C = clampCapZone(L, C, H, i, anchorIdx, designatedPeak);
    // The provenance token follows the drift-note principle: any parameter that shaped
    // this step's value and isn't implied by source + mode alone must appear in the
    // record, or the description falsely claims default-settings reproducibility.
    const extra = [lumTargeted ? 'luminance-targeted' : null, hueEased ? 'eased hue' : null].filter(Boolean);
    const p = extra.length ? [provenance, ...extra].join(' · ') : provenance;
    const pl = extra.length ? [provenanceLine, ...extra].join(' · ') : provenanceLine;
    return finalize(i, L, C, H, '', p, pl);
  });

  // Figma naming: mark whichever single step is actually nearest the source color, in
  // OKLab space — computed uniformly across all three modes, rather than three
  // special-cased rules (free mode always step 9, anchored mode the dynamic anchor,
  // grey mode nothing). The previous free-mode rule ("always step 9, since that's where
  // the chroma factor hits 1.0") conflated a curve-shape fact with a proximity claim —
  // confirmed wrong on a real case: source #009070 (L 0.581) has step 8 at ΔE 0.0187
  // from the source, step 9 at ΔE 0.0636 — step 8 is 3.4x closer, so marking step 9
  // pointed at a color measurably farther from the input than its own neighbor. Grey
  // mode previously got no marker at all, despite frequently landing on an EXACT match
  // (grey mode's fixed neutral L-scale corresponds to common round hex values like
  // #696969, #7D7D7D — a source that already is one of those values matches perfectly,
  // even though grey mode discards the source's own L to get there). Anchored mode is
  // unaffected: the nearest step to the source is the anchor by construction (verified
  // across 200 random anchored sources, exact agreement every time), so this unifies to
  // the same behavior anchored mode always had.
  const sourceHexUpper = hex.toUpperCase();
  let nearestIdx = 0, nearestDist = Infinity;
  steps.forEach((s, i) => {
    const a = s.C * Math.cos((s.H * Math.PI) / 180), b = s.C * Math.sin((s.H * Math.PI) / 180);
    const srcA = srcC * Math.cos((srcH * Math.PI) / 180), srcB = srcC * Math.sin((srcH * Math.PI) / 180);
    const dist = Math.sqrt((s.L - srcL) ** 2 + (a - srcA) ** 2 + (b - srcB) ** 2);
    if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
  });
  steps[nearestIdx].figmaSuffix = steps[nearestIdx].hex === sourceHexUpper ? '-anchor' : '-source';

  // Measured contrast annotations (per-step WCAG fields, text-step APCA, and the
  // solid-step foreground recommendation) — see annotateContrast above. Computed
  // before the warnings block so contrastWarning reads the same numbers it emits.
  const { solidForeground } = annotateContrast(steps, dark, anchorIdx, designatedPeak);

  // Anchored mode: the anchor is exempt from the background-zone C cap (correct — see
  // Anchored mode above, verbatim is the whole point). If the anchor lands in the
  // background zone itself (steps 1-5), it stays at full source chroma while its
  // neighbors stay capped — since the taper (backgroundCap above) they ramp toward
  // the anchor rather than holding flat at 0.10, but the anchor still reads MORE
  // saturated than them, the opposite of what a background step should look like.
  // Both rules are individually correct; this flag surfaces the specific combination
  // so callers can decide whether to accept it or pick a different anchor color.
  const anchorInBackgroundZone = mode === 'anchored' && anchorIdx <= 4;

  // Mirror flag for the other end of the ramp: anchored mode overrides a text step's L
  // with the source's own L, and the fixed-L contrast table (and the AAA guarantee built
  // on it) assumes the fixed values. A source anchoring at steps 10-12 is the one case
  // where a text step's L can move — see contrastWarning below for the measured check.
  const anchorInTextZone = mode === 'anchored' && anchorIdx >= 9;

  // Source-hue warnings. The avoid ranges were documented in a prose table but never
  // surfaced at generation time, so the only way to catch a bad source was to consciously
  // look the range up first. detectFamily() would happily return 'green' for a source at
  // H 169.95 and generateScale() would run without complaint, while the +4 nudge quietly
  // pushed steps 9-12 into cyan — a ramp that is green at the top and cyan at the bottom.
  //
  // Two separate checks, because they answer different questions:
  //   - `sourceHueWarning` is ADVISORY: the source is outside the documented safe range for
  //     its family. Might be deliberate.
  //   - `familyEscapeWarning` is FACTUAL: steps in this specific generated scale actually
  //     resolved to a different family. Measured from the output, not predicted from a table.
  // A source can trip the first without the second (guidance is conservative by ~1 degree),
  // which is why the factual check isn't just inferred from the advisory one.
  const warnings = {};
  if (!isNeutral) {
    const avoid = FAMILY_AVOID[family];
    if (avoid && (srcH < avoid.lo || srcH > avoid.hi)) {
      warnings.sourceHueWarning =
        `Source hue ${srcH.toFixed(2)} is outside the recommended range for the ${family} family ` +
        `(${avoid.lo}-${avoid.hi}). It still detects as ${family}, but sits close enough to a ` +
        `neighbouring family that this family's own hue rule may push steps across the boundary.`;
    }
    // Yellow's continuous drift is deliberately exempt from this check for its documented
    // dark-tail behavior only: every other family holds its hue flat and applies a small
    // nudge to a few dark steps, so any escape means something went wrong. Yellow instead
    // drifts continuously across the whole ramp, proportional to L-distance from the source,
    // and it is SUPPOSED to end up in orange at the dark end — this skill's own reference
    // yellow (#CA8A04) puts steps 8-12 at H 69.5 down to 49.2, well inside orange, and
    // warning about that would flag the reference implementation as broken.
    //
    // That exemption does NOT cover every possible escape, though — it was originally
    // written as unconditional, which turned out to hide a different, undocumented case:
    // the same continuous-drift formula pushes LIGHT steps toward HIGHER hue for sources
    // near yellow's own upper boundary, escaping into green rather than orange. Originally
    // confirmed on this skill's own reference lime (#A0C800): under the pre-1.4.0 full
    // drift, its steps 1-5 resolved to green, silently, under the old unconditional
    // exemption. (Since yellowHueScale, lime-region sources hold their hue and #A0C800 no
    // longer escapes at all — the case that still exercises this today is a mid-band
    // source like #6D6700, H 105.6, whose near-full drift still pushes light steps into
    // green.) That's a structurally different symptom from the verified dark-end orange
    // drift — nobody explicitly validated it the way the orange case was validated — so
    // it should warn like any other family would.
    //
    // The exemption covers ORANGE AND RED, because the thing being exempted is a
    // ROTATION, not a destination. The drift is `70 x (L_step - L_src)` capped at 45
    // degrees; for any step darker than the source that rotation is negative, and it
    // runs straight through orange (H 40-70) into red (H 0-40) without changing
    // character. Naming only orange made the exemption's correctness accidental: it
    // held solely because this skill's own reference yellow (#CA8A04) stops at H 40.79
    // in dark mode, 0.79 degrees short of the boundary. Amber #FFC330 — a real
    // production ramp — lands its dark steps 1-2 at H 39.16/39.42 by exactly the same
    // mechanism, and was warned about the behaviour this rule exists to produce. The
    // steps in question render #190F0C and #23140F: near-black at L 0.18/0.21, where
    // the family label is close to meaningless anyway.
    //
    // Direction is what keeps this narrow, and it is already implicit: steps LIGHTER
    // than the source rotate the other way, toward green, so the light-end green escape
    // documented above is untouched and still warns. Only the warm dark-tail drift is
    // exempt; escapes into anything else still surface normally.
    const YELLOW_DRIFT_DESTINATIONS = new Set(['orange', 'red']);
    const escaped = steps
      .map((s, i) => ({ step: i + 1, fam: detectFamily(s.H) }))
      .filter(s => s.fam !== family && !(family === 'yellow' && YELLOW_DRIFT_DESTINATIONS.has(s.fam)));
    if (escaped.length) {
      warnings.familyEscapeWarning =
        `${escaped.length} of 12 steps resolve to a different family than the source: ` +
        escaped.map(s => `step ${s.step} -> ${s.fam}`).join(', ') +
        `. The ramp will read as a blend of ${family} and ${[...new Set(escaped.map(s => s.fam))].join('/')} ` +
        `rather than consistently ${family}.`;
    }
  }

  // Measured AAA check at the text steps (10-12), against the same references the
  // Contrast section documents: white AND step 1 in light mode, step 1 in dark mode.
  // The fixed L scale makes this hold by construction in free and grey mode (verified
  // by sweep — worst free-mode case measured 7.8:1), but anchored mode overrides one
  // step's L with the source's own L: a source at L ~0.44-0.47 anchors at step 10 and
  // lifts it above the fixed 0.42, and for high-luminance hues (yellow/green) the ratio
  // drops below 7:1 (measured down to 6.68:1). Like familyEscapeWarning, this is
  // measured from the generated output, not predicted from the tables — so it also
  // catches anything a future rule change might do to the text steps.
  {
    const AAA = 7;
    const failures = [];
    for (const i of [9, 10, 11]) {
      // Reads the annotated per-step fields so the warning and the emitted data can
      // never disagree. Light mode checks white and step 1; dark mode step 1 only.
      const refs = dark
        ? [['step 1', steps[i].contrastVsCanvas]]
        : [['white', steps[i].contrastVsWhite], ['step 1', steps[i].contrastVsCanvas]];
      for (const [label, ratio] of refs) {
        if (ratio < AAA) failures.push(`step ${i + 1} vs ${label} ${ratio.toFixed(2)}:1`);
      }
    }
    if (failures.length) {
      warnings.contrastWarning =
        `Text steps below WCAG AAA (7:1): ${failures.join(', ')}. ` +
        `This usually means an anchored source's own L landed in the text zone and ` +
        `overrode that step's fixed L — pick a source with L further from the text-step ` +
        `range, or accept AA-level contrast at the listed steps.`;
    }
  }

  // Drift at the steps still placed by OKLCH L (1-9). OKLab L is not luminance,
  // so a saturated step can sit on the other side of a contrast threshold from a
  // neutral at the same L: measured across six hues, step 8 against white spans
  // 3.85-4.50:1 — either side of 4.5. Reported, not corrected: matching these
  // steps' luminance would darken vivid greens and yellows at their most vivid
  // steps. Light mode measures against white, dark mode against step 1, each
  // beside a neutral at the same L on a neutral reference.
  {
    // Raw ratios: WCAG does not round, and a 4.495 printed as 4.50 still fails 4.5.
    const ref = dark ? steps[0].hex : '#FFFFFF';
    const neutralRef = dark ? oklchToHex(steps[0].L, 0, 0) : '#FFFFFF';
    const crossed = [];
    for (let i = 0; i < 9; i++) {
      const own = contrastRatio(steps[i].hex, ref);
      const neutral = contrastRatio(oklchToHex(steps[i].L, 0, 0), neutralRef);
      for (const t of [3, 4.5]) {
        if ((own >= t) !== (neutral >= t)) crossed.push(`step ${i + 1} ${own.toFixed(2)}:1 where a neutral at its L gives ${neutral.toFixed(2)}:1 (${t}:1)`);
      }
    }
    if (crossed.length) {
      warnings.contrastDriftWarning =
        `This hue's luminance moves ${crossed.length === 1 ? 'a step' : 'steps'} across a WCAG threshold against ${dark ? 'step 1' : 'white'}: ${crossed.join('; ')}. ` +
        `OKLCH L places steps 1-9, and it is not luminance — use the measured ratio for any step you rely on for contrast, not its step number.`;
    }
  }

  return {
    source: hex,
    sourceOklch: `oklch(${srcL.toFixed(4)} ${srcC.toFixed(4)} ${srcH.toFixed(2)})`,
    family: isNeutral ? 'neutral' : family,
    mode, modeName, dark, anchorIdx,
    peakStep: peaked ? peakStep : null,
    anchorInBackgroundZone,
    anchorInTextZone,
    solidForeground,
    ...warnings,
    steps
  };
}

function finalize(i, L, C, H, figmaSuffix, provenance, provenanceLine) {
  const hex = oklchToHex(L, C, H);
  const rgb01 = oklchToRgb01(L, C, H);
  const oklch = `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)})`;
  return {
    step: i + 1,
    role: ROLES[i],
    L, C, H,
    hex,
    r: rgb01[0], g: rgb01[1], b: rgb01[2],
    oklch,
    figmaSuffix: figmaSuffix || '',
    figmaDescription: provenance ? `${oklch} · ${provenance}` : oklch,
    // For a Figma variable with separate Light/Dark modes on one description field —
    // same content as figmaDescription but without the light/dark token, meant to sit
    // under a "Light:"/"Dark:" heading instead of repeating the mode inline. See SKILL.md
    // "Figma variable naming and descriptions" for the two-mode composition pattern.
    figmaDescriptionLine: provenanceLine ? `${oklch} · ${provenanceLine}` : oklch
  };
}

// ============================================================
// ALPHA SCALES
// Precision note: both base and target MUST be quantized to their 8-bit hex value before
// solving alpha — not the continuous OKLCH conversion. See SKILL.md "Alpha scales" for why
// (the difference is small, a few ten-thousandths, but changes every downstream value).
// ============================================================

// Alpha rendered as a 2-decimal PERCENTAGE in the CSS value. Verified across both
// 12-step neutral ramps: 2dp percent reproduces every composited 8-bit value exactly,
// while whole-percent rounding breaks 17 of the 24 steps. Always padded to 2 decimals —
// "3.00%" rather than "3%" — so a reader can tell it is a 2dp value and not the
// whole-percent rounding this scale exists to avoid. The `alpha` field later in the
// description keeps the raw solve output; this is the presentation form.
function alphaPct(a) { return (Math.round(a * 1e4) / 100).toFixed(2) + '%'; }

function hexToRgb255(hex) {
  hex = hex.replace('#', '');
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function rgb255ToHex(rgb) {
  return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Neutral (single-base) alpha — only exact for C≈0 scales. Formula:
//   alpha[step] = (1 - target_srgb) / (1 - base_srgb)      [light]
//   alpha[step] = target_srgb / base_srgb                   [dark]
// Endpoint rule: any step whose alpha would round to 1.00 gets its base swapped to the
// true extreme (pure black light / pure white dark) instead, recomputed to hit the same target.
function generateNeutralAlpha(scaleSteps, opts) {
  opts = opts || {};
  const dark = !!opts.dark;
  const name = opts.name || 'scale';
  const modeLabel = opts.modeLabel || 'grey mode';
  const modeLabelLine = opts.modeLabelLine || modeLabel.replace(/\s*·\s*dark$/, '');
  const baseHex = dark ? '#FCFCFC' : '#161616';
  const base255 = hexToRgb255(baseHex)[0]; // R=G=B for a neutral base
  const baseSrgb = base255 / 255;

  // Nominal OKLCH for the fixed neutral bases, exactly as published in SKILL.md's
  // reference tables. These are documented CONSTANTS, not conversions computed from
  // the hex — re-read the precision note above: the 8-bit hex is authoritative input
  // to the alpha solve, and round-tripping it through a continuous OKLCH conversion
  // is the thing this system deliberately avoids. Only the four bases this function
  // can actually emit appear here; anything else must not be guessed.
  const BASE_OKLCH = {
    '#161616': 'oklch(0.20 0.00 0)', '#FCFCFC': 'oklch(0.99 0.00 0)',
    '#000000': 'oklch(0 0 0)',       '#FFFFFF': 'oklch(1 0 0)'
  };

  return scaleSteps.map(step => {
    const target255 = hexToRgb255(step.hex)[0]; // R=G=B for a neutral target
    const targetSrgb = target255 / 255;
    let alpha = dark ? (targetSrgb / baseSrgb) : ((1 - targetSrgb) / (1 - baseSrgb));
    let usedBase = baseHex;

    if (alpha >= 0.9999) {
      // Endpoint rule: swap to the true extreme for this one step only.
      usedBase = dark ? '#FFFFFF' : '#000000';
      alpha = dark ? targetSrgb : (1 - targetSrgb);
    }

    const roundedAlpha = Math.round(alpha * 1e6) / 1e6;
    // Ready-to-use CSS, leading the description so it mirrors the solid steps'
    // `${oklch} · ${provenance}` shape. Carries the full-precision alpha: the
    // "keep at least 2 decimal places" rule above applies to anything that renders
    // this token, documentation included — whole-percent rounding moves 7 of 11
    // steps by 1/255 and reintroduces the seam this scale exists to avoid.
    const cssValue = BASE_OKLCH[usedBase].replace(/\)$/, ' / ' + alphaPct(roundedAlpha) + ')');
    // Alpha steps never get a -source/-anchor suffix (see SKILL.md "Figma variable
    // naming" — an alpha step isn't verbatim anything, it's a base/alpha pair engineered
    // to visually match a solid step when composited, so the source/anchor concept
    // doesn't apply to it the way it does to a solid step).
    const description = `${cssValue} · base ${usedBase} · alpha ${roundedAlpha} · composites to ${name}/${step.step} · ${modeLabel}`;
    // Same content minus the light/dark token — for the "Light:"/"Dark:" heading layout,
    // where a heading already states the mode and repeating it inside the line is noise.
    const descriptionLine = `${cssValue} · base ${usedBase} · alpha ${roundedAlpha} · composites to ${name}/${step.step} · ${modeLabelLine}`;
    return { step: step.step, base: usedBase, alpha: roundedAlpha, css: cssValue,
             figmaDescription: description, figmaDescriptionLine: descriptionLine };
  });
}

// Chromatic (per-step) alpha — required for any C > 0 scale. Formula (light, solved
// against an implied WHITE surface — white contributes 255*(1-alpha) to every channel):
//   FLOOR = 3
//   alpha = 1 - max(min(R,G,B), FLOOR) / 255
//   base_c = round( (target_c - 255*(1-alpha)) / alpha ), clamped 0-255
//
// Dark mode (opts.dark) is the mirror, solved against an implied BLACK surface —
// compositing over black gives result = base*alpha, so a channel above 255*alpha is
// unreachable regardless of base, and the least opacity at which the target is
// reachable is max(R,G,B)/255:
//   alpha = min(max(max(R,G,B), FLOOR), 255 - FLOOR) / 255
//   base_c = round( target_c / alpha ), clamped 0-255
// The (255 - FLOOR) cap is the dark analogue of the light zero-channel rule: a target
// channel at/near 255 would push alpha to 1.0 (a token that isn't translucent at all),
// so it bleeds <= FLOOR/255 into that channel instead — same tradeoff, same magnitude.
// The lower max(..., FLOOR) guard keeps a degenerate near-black target from solving to
// alpha ~0. Before this branch existed, dark scales went through the light formula and
// came out structurally inverted: dark step 1 (the step that should be the MOST
// translucent) solved to a near-black base at alpha 0.95 — a nearly opaque scrim that
// composites over an actual dark surface to something darker than the surface itself.
function generateChromaticAlpha(scaleSteps, floor, opts) {
  floor = floor == null ? 3 : floor;
  opts = opts || {};
  const dark = !!opts.dark;
  const name = opts.name || 'scale';
  const modeLabel = opts.modeLabel || 'free mode';
  const modeLabelLine = opts.modeLabelLine || modeLabel.replace(/\s*·\s*dark$/, '');
  return scaleSteps.map(step => {
    const target = hexToRgb255(step.hex);
    const alpha = dark
      ? Math.min(Math.max(Math.max(...target), floor), 255 - floor) / 255
      : 1 - Math.max(Math.min(...target), floor) / 255;
    const base = dark
      ? target.map(c => Math.round(c / alpha))
      : target.map(c => Math.round((c - 255 * (1 - alpha)) / alpha));
    const roundedAlpha = Math.round(alpha * 1e6) / 1e6;
    const baseHex = rgb255ToHex(base);
    // Deliberately rgb(), NOT oklch(), and the asymmetry with generateNeutralAlpha
    // is the point. A chromatic alpha base is solved per step in 8-bit sRGB, so no
    // nominal OKLCH exists for it the way it does for the two fixed neutral bases —
    // emitting one would mean converting the solved hex, and the base's hue is
    // documented to drift up to 23.8° from the scale's own hue (SKILL.md, "The base's
    // hue drifts"). A converted triple would therefore assert a hue this scale does
    // not own. rgb() states the exact solved channels and the exact alpha, converting
    // nothing. Use the clamped channels from baseHex, not the raw solve, which can
    // land outside 0-255 before clamping.
    const baseRgb = hexToRgb255(baseHex);
    const cssValue = `rgb(${baseRgb[0]} ${baseRgb[1]} ${baseRgb[2]} / ${alphaPct(roundedAlpha)})`;
    const description = `${cssValue} · base ${baseHex} · alpha ${roundedAlpha} · composites to ${name}/${step.step} · ${modeLabel}`;
    const descriptionLine = `${cssValue} · base ${baseHex} · alpha ${roundedAlpha} · composites to ${name}/${step.step} · ${modeLabelLine}`;
    return { step: step.step, base: baseHex, alpha: roundedAlpha, css: cssValue,
             figmaDescription: description, figmaDescriptionLine: descriptionLine };
  });
}

function generateAlphaScale(scale, name) {
  const dark = scale.dark;
  const modeLabel = `${scale.modeName || scale.mode} mode${dark ? ' · dark' : ''}`;
  const modeLabelLine = `${scale.modeName || scale.mode} mode`;
  // The single-base neutral solve is mathematically exact only when every step actually
  // has R=G=B — it reads one channel and assumes the other two match. The family label
  // alone isn't a safe proxy: the neutral classification threshold (C < 0.01) admits
  // faintly tinted sources whose steps have unequal channels, and routing those through
  // the single-base solve produced composite errors up to 11/255 (measured at C=0.009)
  // — an order of magnitude past the 1/255 seams this system exists to prevent. So the
  // routing is decided from the measured output, not the label (the same principle
  // familyEscapeWarning follows): a 'neutral' scale with any unequal-channel step goes
  // through the per-step chromatic solver, which is exact for it.
  const trulyAchromatic = scale.steps.every(s => {
    const [r, g, b] = hexToRgb255(s.hex);
    return r === g && g === b;
  });
  if (scale.family === 'neutral' && trulyAchromatic) {
    return generateNeutralAlpha(scale.steps, { dark, name: name || scale.family, modeLabel, modeLabelLine });
  }
  return generateChromaticAlpha(scale.steps, 3, { dark, name: name || scale.family, modeLabel, modeLabelLine });
}

// ============================================================
// DRIFT TOWARD A SECONDARY REFERENCE
// A rare, targeted correction applied on top of an already-generated scale: the anchor
// is confirmed correct and stays untouched, but the rest of the ramp leans toward a
// second reference color's hue — as a function of absolute step index (not distance
// from the anchor at all). See the function body for the two anchor-relative formulas
// that were tried and rejected first, and why keying to the anchor's position at all
// turned out to be the wrong axis.
// ============================================================

function driftTowardReference(scale, referenceHex) {
  referenceHex = parseHex(referenceHex); // throws on malformed input — see parseHex
  const [rl, gl, bl] = hexToLinear(referenceHex);
  const [refL, refC, refH] = linearToOKLCH(rl, gl, bl);

  const anchorIdx = scale.anchorIdx;
  const anchorStep = scale.steps[anchorIdx];
  const anchorH = anchorStep.H;

  // Keyed to ABSOLUTE step index (not distance from the anchor at all) — the third
  // formula tried here, after two rounds of anchor-relative approaches each fixed one
  // problem and exposed another:
  //   v1, L-distance: mode-incoherent (opposite rotation directions between light/dark).
  //   v2, unsigned |step-index| distance: fixed v1, but produced a V-shaped, non-
  //       monotonic profile when the anchor sat mid-ramp, and escalating same-step
  //       divergence between light/dark when they anchor at different indices.
  //   v3, signed step-index distance at a fixed rate: fixed v2's two problems, but
  //       introduced a worse one — the fixed rate (cap/11) only reaches the reference
  //       hue anywhere in the ramp when the anchor sits at step 1 (index 0). For any
  //       other anchor position the function never gets closer to the reference than
  //       the anchor's own hue does, which defeats the point of a function called
  //       "drift toward reference". Confirmed directly: an anchor at step 12 drifting
  //       toward a reference 19° away produced a ramp that peaked at the anchor's own
  //       hue and never got within 19° of the actual reference anywhere.
  //
  // All three of the above key rotation to the anchor's position, which is exactly
  // the thing that differs between light and dark and made the whole problem hard.
  // This version doesn't use anchorIdx as a distance reference at all — it's a fixed
  // line in step-index space, `H[i] = anchorH + cap × (11 − i) / 11`, which reaches
  // the reference exactly at step 1 and passes through the anchor's own hue exactly
  // at step 12, regardless of where the real anchor sits. Since the schedule depends
  // only on step index and the anchor/reference hues (both identical across modes),
  // light and dark get the same hue at the same step by construction — confirmed at
  // 0° divergence across all 12 steps on a case that previously diverged by up to 30°.
  //
  // The residual: this schedule's own "natural" anchor point is always step 12, not
  // wherever the real anchor actually sits. When the anchor IS at step 12, the
  // verbatim override and the schedule agree already, so there's no seam at all. When
  // the anchor sits elsewhere, forcing that one step back to its verbatim value creates
  // a single-step spike against the smooth schedule — confirmed to be exactly that: a
  // one-step spike, with every OTHER step still monotonic, not a return of v2's V-shape
  // (which broke monotonicity across half the ramp, not one isolated point). When BOTH
  // modes anchor away from step 12, this spike is the only place they still diverge —
  // localized and explainable, not a whole-ramp shape mismatch.
  let cap = refH - anchorH;
  if (cap > 180) cap -= 360;
  if (cap < -180) cap += 360;

  const steps = scale.steps.map((step, i) => {
    // The anchor is exempt from drift ONLY in anchored mode, where it protects a real
    // verbatim guarantee (see the anchor exemption above). In free and grey mode,
    // "anchorIdx" is just the curve's structural peak position (always step 9 for free
    // mode) — nothing is verbatim there, so exempting it from drift protects nothing
    // and only costs mode-coherence. Confirmed directly: a light-anchored/dark-free brand-
    // like scenario showed perfect 0° divergence at every single step EXCEPT the dark
    // side's needlessly-exempted step 9, which alone diverged ~9° — an entirely
    // avoidable, isolated discontinuity from exempting a step that had nothing to protect.
    if (i === anchorIdx && scale.mode === 'anchored') return step; // untouched, by design
    // Normalize to [0, 360) — anchorH + cap*(11-i)/11 can land outside this range
    // (e.g. a small anchorH combined with a large negative cap), and every other hue
    // computation in this file keeps H in [0, 360) via this same normalization. Without
    // it, a negative or >360 H leaks into the oklch() string and figmaDescription
    // verbatim — mathematically equivalent to the wrapped angle, but inconsistent with
    // how every other value in this system is presented, and confusing to read.
    const H = (((anchorH + (cap * (11 - i)) / 11) % 360) + 360) % 360;
    const C = clampToGamut(step.L, step.C, H);
    // Preserve this step's own figmaSuffix and provenance — drift only changes hue,
    // it doesn't change which step is the source/anchor or any generation metadata.
    // (figmaDescription = "oklch(...) · provenance", so strip the stale oklch prefix
    // rather than losing the provenance entirely by not passing it through.)
    const oldOklchPrefix = step.oklch;
    const basedProvenance = step.figmaDescription.startsWith(oldOklchPrefix)
      ? step.figmaDescription.slice(oldOklchPrefix.length).replace(/^ · /, '')
      : null;
    const basedProvenanceLine = step.figmaDescriptionLine.startsWith(oldOklchPrefix)
      ? step.figmaDescriptionLine.slice(oldOklchPrefix.length).replace(/^ · /, '')
      : null;
    // The drift reference is the one parameter that actually shapes this step's hue —
    // without it, a drifted ramp's description implies it's fully reproducible from
    // source + mode alone, when it isn't (drift is a separate, undocumented-in-the-
    // description operation applied on top). Appended only to steps drift actually
    // touched — the anchor's own description is untouched since drift doesn't affect it.
    const driftNote = `drift toward ${referenceHex.toUpperCase()}`;
    const provenance = basedProvenance ? [basedProvenance, driftNote].join(' · ') : driftNote;
    const provenanceLine = basedProvenanceLine ? [basedProvenanceLine, driftNote].join(' · ') : driftNote;
    return finalize(i, step.L, C, H, step.figmaSuffix, provenance, provenanceLine);
  });

  // Drift rebuilds every step object via finalize(), which drops the contrast
  // annotations — and rotating hue at fixed L/C can legitimately move a WCAG ratio at
  // the second decimal, so recompute rather than copying the pre-drift values.
  const { solidForeground } = annotateContrast(steps, scale.dark, anchorIdx, scale.mode === 'anchored' || scale.peakStep != null);

  return { ...scale, steps, solidForeground, driftedToward: { hex: referenceHex, oklch: `oklch(${refL.toFixed(4)} ${refC.toFixed(4)} ${refH.toFixed(2)})` } };
}

// ============================================================
// CLI
// ============================================================

function parseArgs(argv) {
  const args = { mode: 'free', dark: false, noCeiling: false, alpha: false, table: false, name: 'scale', driftToward: null, easeHue: false, luminanceText: true, peak: null, saturation: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mode') args.mode = argv[++i];
    else if (a === '--dark') args.dark = true;
    else if (a === '--no-ceiling') args.noCeiling = true;
    else if (a === '--ease-hue') args.easeHue = true;
    else if (a === '--oklch-text') args.luminanceText = false;
    else if (a === '--peak') args.peak = Number(argv[++i]);
    else if (a === '--saturation') args.saturation = Number(argv[++i]);
    else if (a === '--alpha') args.alpha = true;
    else if (a === '--table') args.table = true;
    else if (a === '--name') args.name = argv[++i];
    else if (a === '--drift-toward') args.driftToward = argv[++i];
    else positional.push(a);
  }
  args.hex = positional[0];
  return args;
}

function buildTable(scale, alphaSteps) {
  const lines = [];
  lines.push(`${scale.family} — ${scale.source} — ${scale.sourceOklch} — mode=${scale.mode}${scale.dark ? ' (dark)' : ''}`);
  if (scale.anchorInBackgroundZone) {
    lines.push(`⚠ anchor (step ${scale.anchorIdx + 1}) lands in the background zone (steps 1-5) — it's exempt from the C cap its neighbors get (their cap tapers toward it, but never reaches it), so it will read MORE saturated than them. See "Anchored mode — dark" in SKILL.md.`);
  }
  if (scale.contrastWarning) {
    lines.push(`⚠ ${scale.contrastWarning}`);
  }
  if (scale.contrastDriftWarning) {
    lines.push(`⚠ ${scale.contrastDriftWarning}`);
  }
  lines.push('');
  const header = alphaSteps
    ? '| Step | Figma name | Role                      | Hex     | Alpha base | Alpha  |'
    : '| Step | Figma name | Role                      | L     | C      | H      | Hex     |';
  lines.push(header);
  lines.push('|------|------------|---------------------------|' + (alphaSteps ? '---------|------------|--------|' : '-------|--------|--------|---------|'));
  scale.steps.forEach((s, i) => {
    const figmaName = String(s.step) + s.figmaSuffix;
    if (alphaSteps) {
      const a = alphaSteps[i];
      lines.push(`| ${String(s.step).padEnd(4)} | ${figmaName.padEnd(10)} | ${s.role.padEnd(25)} | ${s.hex} | ${a.base}     | ${a.alpha.toFixed(6)} |`);
    } else {
      lines.push(`| ${String(s.step).padEnd(4)} | ${figmaName.padEnd(10)} | ${s.role.padEnd(25)} | ${s.L.toFixed(3)} | ${s.C.toFixed(4)} | ${s.H.toFixed(2)} | ${s.hex} |`);
    }
  });
  return lines;
}

function printTable(scale, alphaSteps) {
  buildTable(scale, alphaSteps).forEach(line => console.log(line));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.hex) {
    console.error('Usage: node scripts/generate.js <hex> [--mode free|anchored|grey|gray] [--dark] [--no-ceiling] [--ease-hue] [--oklch-text] [--peak <1-12>] [--saturation <0-1>] [--alpha] [--drift-toward <hex>] [--table] [--name <label>]');
    process.exit(1);
  }

  let scale, alphaSteps, hex = args.hex;
  try {
    // Saturation resolves to a source hex BEFORE generation, so everything downstream —
    // the curve, the provenance string, recover.js — sees an ordinary source and needs
    // no knowledge that the flag exists.
    if (args.saturation !== null) hex = sourceAtSaturation(hex, args.saturation, args.noCeiling);
    scale = generateScale(hex, args.mode, { dark: args.dark, noCeiling: args.noCeiling, easeHueSnaps: args.easeHue, luminanceText: args.luminanceText, peakStep: args.peak });
    if (args.driftToward) scale = driftTowardReference(scale, args.driftToward);
    alphaSteps = args.alpha ? generateAlphaScale(scale, args.name) : null;
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  if (args.table) {
    // Solid table first, then (if requested) the alpha table. A previous version passed
    // alphaSteps to BOTH calls, printing the identical alpha table twice and the solid
    // L/C/H table not at all.
    printTable(scale);
    if (alphaSteps) {
      console.log('');
      printTable(scale, alphaSteps);
    }
  } else {
    const out = { name: args.name, ...scale };
    if (alphaSteps) out.alpha = alphaSteps;
    console.log(JSON.stringify(out, null, 2));
  }
}

if (require.main === module) main();

// Compose one Figma description field from per-mode lines, using a heading per mode.
// Figma descriptions are per-VARIABLE, not per-mode, so a two-mode variable has to fit
// both values in one field. Headings beat inline "· dark" tags: the mode is stated once,
// each line stays short, and the two values line up for comparison. Feed it
// figmaDescriptionLine (no mode token), not figmaDescription.
function composeModeDescription(byMode) {
  return Object.keys(byMode)
    .filter(k => byMode[k])
    .map(k => `${k}:\n${byMode[k]}`)
    .join('\n\n');
}

module.exports = {
  composeModeDescription,
  generateScale, generateNeutralAlpha, generateChromaticAlpha, generateAlphaScale,
  driftTowardReference, buildTable,
  detectFamily, maxChromaAt, usableChromaAt, sourceAtSaturation,
  parseHex, hexToLinear, linearToOKLCH, oklchToHex, oklchToRgb01, isOutOfGamut,
  wcagLuminance, contrastRatio, apcaLc,
  FAMILY_AVOID, FAMILY_C_CEILING,
  backgroundCap, TAPER_RADIUS, yellowHueScale, computeFactor,
  LIGHT_L, DARK_L, LIGHT_L_NEUTRAL, DARK_L_NEUTRAL, ROLES
};
