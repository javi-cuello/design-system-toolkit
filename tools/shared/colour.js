// Colour arithmetic, stated once: the sRGB transfer both ways, WCAG 2 relative
// luminance and contrast ratio, and OKLab to linear sRGB. The parity engine
// imports it; the components audit's scanner (scanner/audit.js) and the OKLCH
// scale generator (oklch-color-scale-system's generate.js) keep copies, the
// first because it runs in Figma, which imports nothing, the second because the
// skill ships alone; tools/shared/test-colour.mjs holds each copy to these
// character for character. The contrast matrix's builder (build-matrix-script.py)
// is Python, so its copy is held by its numbers, by that skill's
// tests/test-wcag-copy.mjs.
//
// The threshold is 0.04045, WCAG 2.2's (the definition of relative luminance,
// Note 2: "Before May 2021 the value of 0.04045 in the definition was different
// (0.03928)"); the two disagree only on channel values no 8-bit colour has.
// Channels are 0–1.

export const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export const relativeLuminance = (c) => 0.2126 * srgbToLinear(c.r) + 0.7152 * srgbToLinear(c.g) + 0.0722 * srgbToLinear(c.b);
export const contrastRatio = (a, b) => { const x = relativeLuminance(a), y = relativeLuminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const oklabToLinearSrgb = (L, a, b) => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
};
