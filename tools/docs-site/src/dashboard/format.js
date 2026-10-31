// Small text helpers the dashboard's modules share. The three the whole site
// shares — a date, a count with its noun, HTML escaping — come from
// ../lib/format.js, because both modules render into one page and this file's
// own date said something different: no UTC, so a run at 22:13Z read as the
// next day, which is the bug ../lib/format.js was fixed for and this copy
// never heard about. Only the browser-only helpers stay here.
export { date as fmtDate, plural, esc, num, percent } from "../lib/format.js";
export const cssEsc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'));
// Model- and API-written messages end with punctuation about half the time,
// and joining one to a sentence of ours produced "…not found Nothing was
// stamped". Close it before appending.
export const sentence = (s) => {
  const t = String(s || "").trim();
  return !t ? "" : (/[.!?:]$/.test(t) ? t : t + ".");
};
// How a scroll the page makes itself moves: smoothly, unless the reader has
// asked for less motion, when it jumps (design-standard's motion rule).
export const scrollMotion = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
