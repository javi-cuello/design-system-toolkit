// Start-up: read the record, wire every renderer to it, then poll.
import { announce, onRecord, pullRecord, step } from './record.js';
import { DASH, ctx } from './context.js';
import { build, componentFromHash, loadBuckets, paintVerify, queueStatus, state } from './queue.js';
import { loadMeasures, paintFiles, renderLibrary, renderQueuePane, renderRuns } from './measures.js';
import { renderChanged, renderChecks } from './scores.js';
import { loadContext } from './owners.js';
import { loadThread, setAsk } from './ask.js';
import { api, askClaude } from './api.js';
// For its listeners and the stages it registers. The side-effect import stays
// beside the named one: when the named import was removed, the bundler
// dropped the whole module and the served page had no Audit handler (A91).
import './audit.js';
import { paintAuditMenu } from './audit.js';

// Bootstrap. One read of the record, then render; a poll picks up changes a
// session makes to the file while the tab is open.
(async function boot() {
  // Which library the page is reading — BEFORE the first read, because the
  // read asks for that library by name. Chosen after it, the first request
  // went out with no library at all, the service refused to guess between two
  // records, and the page reported the whole service unreachable.
  //
  // One record per library, so this is the only thing that decides what
  // everything below shows — and the last choice is remembered, because a
  // maintainer working through one platform's queue should not land on the
  // other one every morning.
  const libs = window.DASH_LIBS || [];
  const remembered = (() => { try { return localStorage.getItem("dashLib"); } catch (e) { return null; } })();
  // A link to one component's findings, or to one library's area of the
  // queue (`&lib=<key>`), opens the library they are in.
  const linked = componentFromHash();
  const named = (/[?&]lib=([^&]+)/.exec(location.hash) || [])[1];
  ctx.libKey = (libs.find((l) => l.key === (linked && linked.lib)) || libs.find((l) => l.key === named) || libs.find((l) => l.key === remembered) || libs.find((l) => (l.roles || []).includes("components")) || libs[0] || {}).key || null;
  // The file list comes from the project's settings, not from the service, so
  // it paints before the first request and stays up if that request fails.
  paintFiles();
  // The file switch is links to `#queue?lib=<key>`: the address says which
  // file is in view, and a change of it switches the record.
  const markLib = () => {
    for (const a of document.querySelectorAll("[data-lib-choice]"))
      if (a.dataset.libChoice === ctx.libKey) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  };
  markLib();
  for (const a of document.querySelectorAll("[data-lib-choice]")) a.addEventListener("click", (e) => {
    // Never mid-run: the stages file against `ctx.libKey` as they go.
    if (ctx.running) e.preventDefault();
  });
  addEventListener("hashchange", async () => {
    const key = (/[?&]lib=([^&]+)/.exec(location.hash) || [])[1];
    if (!key || key === ctx.libKey || !libs.some((l) => l.key === key) || ctx.running) return;
    ctx.libKey = key;
    try { localStorage.setItem("dashLib", ctx.libKey); } catch (e) {}
    markLib();
    // The queue is the other library's until the record arrives: emptied
    // here so no row from the one survives into the other.
    for (const id of Object.keys(state)) delete state[id];
    ctx.lastMetrics = null; ctx.lastRuns = []; ctx.storedPrints = null; ctx.printsLoaded = false;
    paintFiles();                                // the marked row moves with it
    try { await pullRecord(); } catch (e) { queueStatus("Could not read that library's record — " + e.message, "warn"); }
  });

  try { await pullRecord(); } catch (e) {
    document.getElementById("measuredLine").textContent =
      e && e.code === "bad_copy" ? e.message : "Can't reach the dashboard service — is it running? (" + e.message + ")";
    DASH.dataset.ready = "yes";
    return;
  }

  // No standing status line. It read "Saving as you go" from first paint —
  // a promise about something the reader had not done yet, sitting under a
  // heading on a board with nothing on it. The line says what happened when
  // something happens: "Saved 14:32", or what failed.

  onRecord((rec) => {
    // rows
    for (const id of Object.keys(rec.rows || {})) state[id] = rec.rows[id];
    // Before the queue paints: a bucket with nothing in it says "All clear"
    // only where a run stands behind it, and that is what says so.
    ctx.lastRuns = Object.values(rec.runs || {}).filter((d) => d && d.at);
    step("The queue", build);
    step("The verify button", paintVerify);

    // library + its measures
    //
    // The record names a library only once a run has written one, so a
    // project that has never been audited had no `libId`, nothing below this
    // ran, and the page rendered as an empty shell with no title, no Figma
    // link and no first-run panel — the state every project starts in, shown
    // worse than the state it ends in. The project's own settings name its
    // libraries before any run does (`audit-settings`, the same block the
    // audit reads), so they are the fallback.
    const settings = (window.DASH_CONTEXT && window.DASH_CONTEXT.libraries) || {};
    const libId = ctx.libKey || Object.keys(rec.libraries || {})[0] || Object.keys(settings)[0];
    if (libId) {
      ctx.libKey = libId;
      // No recorded library: one built from the settings, with no metrics,
      // which is exactly what `renderLibrary` reads as "never measured".
      const data = (rec.libraries || {})[libId]
        || { name: (settings[libId] || {}).name || null, figmaUrl: "https://www.figma.com/design/" + libId };
      // A tokens or icon library is checked from the snapshot: no Audit to
      // run and no first-run panel, just its queue.
      const file = (window.DASH_LIBS || []).find((l) => l.key === libId);
      DASH.dataset.scanned = file && !(file.roles || []).includes("components") ? "no" : "yes";
      ctx.lastMetrics = data && data.metrics ? data.metrics : null;
      ctx.FILE = (data && data.figmaUrl) || ("https://www.figma.com/design/" + libId);
      ctx.libName = (data && data.name) || ctx.libName;
      renderLibrary(data);
    }

    const fp = (rec.fingerprints || {})[ctx.libKey] || null;
    ctx.storedPrints = fp && fp.sets ? fp.sets : null;
    ctx.printsLoaded = true;
    // A baseline never contributes moved sets, whatever it happens to carry:
    // the first look at a library has not seen anything change.
    const df = (fp && !fp.baseline && fp.diff) || {};
    ctx.lastMoved = (df.changed || []).concat(df.added || []);
    paintAuditMenu();
    renderChanged(fp);

    renderRuns(ctx.lastRuns);
    renderQueuePane(ctx.lastMetrics, ctx.lastRuns);

    loadContext();
    const t = (rec.asks || {}).thread;
    loadThread(t && t.turns);
  });
  announce();

  // The check catalogue, the buckets and the measures' definitions: baked
  // into the page at build, so the queue paints from them at once. The
  // service's live copy is asked for only when the About view, which reads
  // it, is opened — once — rather than on every load. A page built without
  // them (a scanner file missing at build) asks straight away.
  const paintScripts = (sc) => {
    if (!sc) return;
    renderChecks(sc.checks);
    loadBuckets(sc.buckets);
    loadMeasures(sc.measures);
    announce();                       // repaint the tiles now that they exist
  };
  let scriptsAsked = false;
  const askScripts = () => {
    if (scriptsAsked) return;
    scriptsAsked = true;
    api.scripts().then(paintScripts).catch(() => { /* the catalogue is reading matter; its absence blanks one tab */ });
  };
  const baked = window.DASH_SCRIPTS || {};
  if (baked.buckets) paintScripts(baked); else askScripts();
  const aboutOpen = () => !document.getElementById("view-about").hidden;
  if (aboutOpen()) askScripts();
  addEventListener("contentchange", () => { if (aboutOpen()) askScripts(); });
  DASH.dataset.ready = "yes";

  const st = await api.status().catch(() => ({}));
  // Remembered for the next load's first paint (Dashboard.astro).
  try { localStorage.setItem("askAvailable", st && st.claude ? "1" : "0"); } catch (e) {}
  if (st && st.claude) {
    ctx.askSample = askClaude;
    document.getElementById("askPanel").hidden = false;
    // The state the page painted with (Dashboard.astro decides it once: a
    // stored choice, else collapsed); "off" from a visit when Ask was
    // unavailable becomes collapsed now that it is.
    setAsk(DASH.dataset.ask !== "open");
  } else {
    DASH.dataset.ask = "off";
  }
  paintFiles(st);
  // A read-only copy has no service to ask: nothing to poll.
  if (DASH.dataset.readonly === "yes") return;
  // Which files Figma has open, every 5 seconds.
  poll(async () => {
    const now = await api.status().catch(() => null);
    paintFiles(now || {});
    return Boolean(now);
  }, 5000);
  // A failed poll is said where saving is reported, and cleared by the next
  // good one; it no longer vanishes into a swallowed promise.
  let pollFailed = false;
  poll(() => pullRecord()
    // Recovering from a lost service clears the warning rather than replacing
    // it with a standing promise.
    .then(() => { if (pollFailed) { pollFailed = false; queueStatus("Back in touch with the service."); } return true; })
    .catch((e) => { pollFailed = true; queueStatus("Lost the service — " + e.message + ". Retrying.", "warn"); return false; }), 15000);
})();

/*
 * Ask `fn` again every `every` ms — but not while the tab is hidden, when
 * nobody is reading the answer, and less often while it fails: the wait
 * doubles on each failure, to eight times the interval, and is back to the
 * interval on the first success. A tab coming back into view asks at once.
 * `fn` resolves true for an answer, false for a failure.
 */
function poll(fn, every) {
  let wait = every, timer = null, busy = false;
  const run = async () => {
    timer = null;
    if (busy || document.hidden) return;
    busy = true;
    const ok = await fn();
    busy = false;
    wait = ok ? every : Math.min(wait * 2, every * 8);
    if (!document.hidden) timer = setTimeout(run, wait);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(timer); timer = null; }
    else if (!timer) run();
  });
  timer = setTimeout(run, every);
}
