// The dashboard's element and the state more than one module reads and changes.

// The dashboard's element: its state (data-ask, data-first-run,
// data-readonly) lives here, where its stylesheet's :scope rules read it.
export const DASH = document.querySelector("[data-dash]");
// What more than one part of the page reads and changes: the library in
// view, what the last run measured, the rules loaded from the context
// document, the owner filter, and whether Ask can answer.
export const ctx = {
  libKey: null, libName: null, FILE: "", lastMetrics: null, lastRuns: [],
  storedPrints: null, printsLoaded: false, lastMoved: [],
  lastRules: null, BUCKET_OF_RULE: {}, BUCKET_DEFAULT: "b3",
  ownerFilter: "all", askSample: null,
  /*
   * A run is in flight. Every write site in `audit.js` reads `ctx.libKey`
   * lazily, at the moment it files, so switching library mid-run sent the
   * remaining stages' rows — with `full: true` — to the OTHER library's
   * record, which then closed the rows that run had never looked at. The
   * switcher is disabled while this is set; the flag lives here because the
   * button that reads it and the stage that sets it are different modules.
   */
  running: false,
};
