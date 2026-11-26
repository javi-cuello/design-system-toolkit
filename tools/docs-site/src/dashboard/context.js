// The dashboard's element and the state more than one module reads and changes.

// The dashboard's element: its state (data-ask, data-first-run,
// data-readonly) lives here, where its stylesheet's :scope rules read it.
export const DASH = document.querySelector("[data-dash]");
// the Audits hero holds the actions and the files, outside DASH; it is a second root of the stylesheet's
// @scope, so DASH's state is copied onto it whenever it changes.
const HERO = document.querySelector(".dash-hero");
if (DASH && HERO) {
  let copied = [];
  // only what it copied is taken back, so the hero's own data-* (Astro's dev attributes) stay
  const mirror = () => { for (const n of copied) HERO.removeAttribute(n); copied = [];
    for (const a of DASH.attributes) if (a.name.startsWith("data-") && a.name !== "data-dash") { HERO.setAttribute(a.name, a.value); copied.push(a.name); } };
  mirror(); new MutationObserver(mirror).observe(DASH, { attributes: true });
}
// What more than one part of the page reads and changes: the library in
// view, what the last run measured, the rules loaded from the context
// document, the owner filter, and whether Ask can answer.
export const ctx = {
  libKey: null, libName: null, FILE: "", lastMetrics: null, lastRuns: [],
  storedPrints: null, printsLoaded: false, lastMoved: [],
  lastRules: null,
  ownerFilter: "all", sevFilter: "all", statusTab: "open", askSample: null,
  /*
   * A run is in flight. Every write site in `audit.js` reads `ctx.libKey`
   * lazily, at the moment it files, so switching library mid-run sent the
   * remaining stages' rows — with `full: true` — to the OTHER library's
   * record, which then closed the rows that run had never looked at. The
   * switcher is disabled while this is set; the flag lives here because the
   * button that reads it and the stage that sets it are different modules.
   */
  running: false,
  // main.js sets it: make `key` the library in view (record, queue, prints).
  switchLib: null,
};
