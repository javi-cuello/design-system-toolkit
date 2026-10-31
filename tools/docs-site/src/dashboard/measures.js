// The About view's account of the measures, the library line, the
// queue's figures strip, the run history table and the plugin's status line.
import { cssEsc, fmtDate, num, percent } from './format.js';
import { DASH, ctx } from './context.js';
import { shownRows, narrowedView, state } from './queue.js';
import { isOpen, platformLabel } from './labels.js';
import { kpiStyles } from './kpis.js';

// The About view's account of each measure; the figures themselves are the
// overview's Library health (lib/measures.js), drawn at build from the record.
export function loadMeasures(doc) {
  if (doc && Array.isArray(doc.measures)) renderAboutMeasures(doc);
}
export function renderLibrary(lib) {
  if (!lib) return;
  // Has this project ever been measured? Everything below the title depends
  // on it, and a project set up five minutes ago is the normal case, not an
  // error state.
  const measured = !!(lib.metrics && Object.keys(lib.metrics).length) || DASH.dataset.scanned === "no";
  DASH.dataset.firstRun = measured ? "no" : "yes";
  // The link to the library in Figma, shown only where the record carries a
  // URL. (This comment used to describe a title built from `displayTitle`; no
  // such code is here, and nothing in the repo reads that field.)
  const fl = document.getElementById("fileLink");
  if (lib.figmaUrl) { fl.href = lib.figmaUrl; fl.hidden = false; } else fl.hidden = true;

  const m = lib.metrics || {};

  // The age of the library in view's last run; none, for one never run.
  const fresh = document.getElementById("freshness");
  fresh.hidden = !lib.lastRunAt;
  if (lib.lastRunAt) {
    const days = Math.floor((Date.now() - new Date(lib.lastRunAt)) / 86400000);
    fresh.textContent = days <= 0 ? "measured today" : days === 1 ? "1 day old" : days + " days old";
    fresh.className = "freshness " + (days <= 7 ? "fresh" : "aging");
    // The date is the page's caption, under the title (design-standard rule
    // 1); this line says what the file's run covered, and the badge its age.
    document.getElementById("measuredLine").textContent =
      "The last audit of this file read " + (m.sets || "?") + " sets and " + (m.variants || "?") + " variants.";
  } else if (DASH.dataset.scanned === "no") {
    // No run to date it, so the snapshot does: the one its rows came from.
    // A file with no rows has not been in a snapshot yet.
    const has = Object.keys(state).length > 0;
    document.getElementById("measuredLine").textContent = has && window.DASH_SNAPSHOT
      ? "Checked from the snapshot, with no audit to run."
      : "No snapshot of this file yet: it is checked from the first one stored.";
  } else {
    document.getElementById("measuredLine").textContent = "No audit of this file yet.";
  }
}
export function renderQueuePane(metrics, runs) {
  const tiles = document.getElementById("queueTiles");
  tiles.textContent = "";
  // Counted from the rows the owner filter shows, so the tiles answer for
  // the chip that is pressed; the library metric is the whole-record figure
  // and is what the tiles read before any row was loaded.
  // Both filters, and by the owner KEY. It compared the bare owner against
  // the chip's key, and the validator's chips are target-qualified
  // ("component-validator|web"), so pressing "Web build" matched nothing and
  // the tiles read Open 0 / Raised 0 / Closed 0 above a board showing 235.
  // And the component a Needs attention link narrowed it to (queue.js).
  const shown = shownRows();
  const narrowed = narrowedView();
  const open = shown.length || narrowed ? shown.filter(isOpen).length
             : (metrics && typeof metrics.openFindings === "number" ? metrics.openFindings : null);
  const total = shown.length || narrowed ? shown.length
              : (metrics && typeof metrics.totalFindings === "number" ? metrics.totalFindings : null);
  const cells = [
    ["Open", open === null ? "\u2014" : String(open), open === 0 ? "good" : "warn"],
    ["Raised to date", total === null ? "\u2014" : String(total), null],
    ["Closed", (open !== null && total !== null) ? String(total - open) : "\u2014", null]
  ];
  // The verdict is a word as well as the dot's colour (WCAG 1.4.1).
  // Balanced like every other strip, so no row is left with an empty cell.
  const styles = kpiStyles(cells.map(() => 1));
  cells.forEach(([label, value, tone], i) => {
    const li = kpi(label, value, tone === "good" ? "Good: none open" : tone === "warn" ? "Attention: to fix or rule" : "", tone);
    li.style.cssText = styles[i];
    tiles.appendChild(li);
  });
}
// One figure in the site's KPI strip (styles/system.css .kpis), the shape the
// overview and the Tracker use: a label, the value, and a note whose dot
// confirms its words (good, warn, or idle for a measure a ruling defers).
function kpi(label, value, note, state, why) {
  const li = document.createElement("li");
  const box = document.createElement("div"); box.className = "kpi";
  const l = document.createElement("span"); l.className = "kpi__label"; l.textContent = label;
  const v = document.createElement("span"); v.className = "kpi__value"; v.textContent = value;
  box.append(l, v);
  if (note) {
    const n = document.createElement("span");
    n.className = "kpi__note" + (state === "good" ? " kpi__note--ok" : state === "idle" ? " kpi__note--idle" : state === "warn" ? "" : " kpi__note--plain");
    n.textContent = note;
    box.appendChild(n);
  }
  if (why) { const w = document.createElement("span"); w.className = "kpi__why"; w.textContent = why; box.appendChild(w); }
  li.appendChild(box);
  return li;
}
function openRun(r) {
  const dlg = document.getElementById("runDialog");
  document.getElementById("runDialog-title").textContent =
    fmtDate(r.at) + ", " + new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    (r.scope ? " \u2014 " + r.scope : "");
  const list = document.getElementById("runDialogList");
  list.textContent = "";
  // A sentence ends at a full stop followed by a capital; "6 of 6 0s." and
  // "e.g." inside a sentence are not followed by one.
  for (const sentence of r.note.split(/(?<=\.)\s+(?=[A-Z])/)) {
    const li = document.createElement("li");
    li.textContent = sentence;
    list.appendChild(li);
  }
  // The site's modal (Modal.astro); its open state stops the page behind
  // scrolling (site.scss, :root:has(.modal[open])).
  dlg.showModal();
}
export function renderRuns(runs) {
  const body = document.getElementById("runs");
  const empty = document.getElementById("runsEmpty");
  body.textContent = "";
  empty.hidden = runs.length > 0;
  const sorted = runs.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  for (const r of sorted) {
    const tr = document.createElement("tr");

    // The run's date heads its row, so a cell read alone says which run.
    const when = document.createElement("th");
    when.scope = "row";
    when.className = "when";
    when.textContent = fmtDate(r.at);
    const t = document.createElement("small");
    t.textContent = new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    when.appendChild(t);

    const kind = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "kind";
    chip.dataset.kind = /first/i.test(r.kind || "") ? "first" : "re";
    const k = r.kind || "re-run";
    chip.textContent = k[0].toUpperCase() + k.slice(1);
    kind.appendChild(chip);

    // What this run added, closed and left: a column each, right-aligned so
    // the figures line up down the table. One cell holding all three ("+10
    // found / 101 left open") could not be read by column or sorted by eye.
    const figure = (n, sign, tone) => {
      const td = document.createElement("td");
      td.className = "num";
      if (tone) td.dataset.delta = tone;
      td.textContent = n ? sign + num(n) : typeof n === "number" ? "0" : "\u2014";
      return td;
    };
    const found = figure(r.found, "+", r.found ? "up" : "");
    const cleared = figure(r.cleared, "\u2212", r.cleared ? "down" : "");
    const open = figure(typeof r.open === "number" ? r.open : undefined, "", "");

    const cov = document.createElement("td");
    cov.className = "num";
    cov.textContent = r.coverage == null ? "\u2014" : percent(r.coverage);

    // Full or changes. Runs from before `trigger` was written say so only when
    // their kind did ("full", "partial"); the rest are unknown, not guessed.
    const trig = r.trigger || (r.kind === "full" ? "full" : r.kind === "partial" ? "changes" : null);
    const scopeTd = document.createElement("td");
    scopeTd.textContent = trig ? trig[0].toUpperCase() + trig.slice(1) : "\u2014";

    // What the run's Claude calls cost. Runs before 2026-09-24 recorded none.
    const cost = document.createElement("td");
    cost.className = "num";
    const c = r.cost;
    cost.textContent = !c ? "\u2014" : c.usd == null ? (c.input + c.output).toLocaleString() + " tok" : "$" + c.usd.toFixed(2);
    if (c) cost.title = c.calls + " calls, " + c.input.toLocaleString() + " in, " + c.output.toLocaleString() + " out" + (c.model ? ", " + c.model : "");

    // The scope line stays in the row; the account opens as one bullet a
    // sentence, because a paragraph of stage results is read by scanning.
    const what = document.createElement("td");
    what.className = "what";
    if (r.scope) {
      const s = document.createElement("div");
      s.className = "what-scope";
      s.textContent = r.scope;
      what.appendChild(s);
    }
    if (r.note) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "what-open"; b.textContent = "Details";
      // Forty of these in a column: each names its run.
      b.setAttribute("aria-label", "Details of the run of " + fmtDate(r.at) + ", " + t.textContent);
      b.addEventListener("click", () => openRun(r));
      what.appendChild(b);
    }
    if (!r.scope && !r.note) what.textContent = "\u2014";

    tr.append(when, kind, scopeTd, found, cleared, open, cov, cost, what);
    body.appendChild(tr);
  }
}
// ---- the files this project audits ------------------------------------
// Which files are open in Figma is a fact about the machine, not the record,
// so it comes from /status and is refreshed on a timer. The list itself comes
// from the project's own settings, so it is there before any run and whether
// or not anything is connected: the question "which files does this audit
// need open?" is answerable at rest, and used not to be.
//
// The source library is a row too. It is not a library this project audits,
// but the link stage reads its keys through the same bridge, so a run fails
// at that stage when it is shut — which the old single line could not say,
// because it only ever described the library in view.
let lastStatus = null;
// What a run is doing, and to which file: { key, pct, label }. Null at rest.
let running = null;

const fileRows = () => {
  const libs = window.DASH_LIBS || [];
  const settings = (window.DASH_CONTEXT && window.DASH_CONTEXT.libraries) || {};
  const rows = libs.map((l) => ({
    key: l.key,
    label: (l.roles || []).includes("components") ? platformLabel(l.platform) : (l.roles || []).includes("tokens") ? "Tokens" : "Icons",
    name: (settings[l.key] || {}).name || l.name || null,
    role: "audited",
  }));
  // One row per distinct source library, and never a second row for a file
  // that is already one of this project's own.
  for (const l of libs) {
    const src = (settings[l.key] || {}).sourceLibrary;
    if (!src || rows.some((r) => r.key === src)) continue;
    // "Source library" rather than "Source", because the project's settings
    // name only the libraries it audits: this row would otherwise be one word
    // until Figma opened the file and told the page what it is called.
    rows.push({ key: src, label: "Source library", name: (settings[src] || {}).name || null, role: "source" });
  }
  return rows;
};

/*
 * Painted IN PLACE, never rebuilt.
 *
 * This ran `host.textContent = ""` and recreated every row — and while a run
 * is going it is called once a second by the ticker and again every five by
 * the status poll. Destroying the spinner's element restarts its CSS
 * animation from zero, so it rotated for a second, jumped back and rotated
 * again: a spinner that reads as broken rather than busy. An element that
 * animates must outlive the repaints, which means reusing the node and
 * changing only what differs.
 */
export function paintFiles(st) {
  if (st) lastStatus = st;
  const host = document.getElementById("fileList");
  if (!host) return;
  const files = (lastStatus && lastStatus.files) || [];
  const rows = fileRows();
  host.hidden = !rows.length;
  // Rows only ever change when the project's settings do, so the list is
  // built once and addressed by file key thereafter.
  const want = rows.map((r) => r.key).join("\n");
  if (host.dataset.keys !== want) {
    host.textContent = "";
    for (const r of rows) {
      const li = document.createElement("li");
      li.className = "file";
      li.dataset.key = r.key;
      const dot = document.createElement("span"); dot.className = "file-dot";
      const name = document.createElement("span"); name.className = "file-what";
      const note = document.createElement("span"); note.className = "file-note";
      li.append(dot, name, note);
      host.appendChild(li);
    }
    host.dataset.keys = want;
  }
  for (const r of rows) {
    const li = host.querySelector('[data-key="' + cssEsc(r.key) + '"]');
    if (!li) continue;
    const open = files.find((f) => f.fileKey === r.key) || null;
    const set = (k, v) => { if (v === null) { if (k in li.dataset) delete li.dataset[k]; } else if (li.dataset[k] !== v) li.dataset[k] = v; };
    set("on", String(!!open));
    set("role", r.role);
    // The library in view is marked, because the buttons beside this list act
    // on that one and nothing else said which it was.
    set("current", r.key === ctx.libKey ? "yes" : null);
    const busy = !!(running && running.key === r.key);
    set("busy", busy ? "1" : null);
    // The file's own name where Figma has told us one, the project's recorded
    // name otherwise, and never a bare key: a key names nothing to a reader.
    const label = r.label + (r.name || (open && open.fileName) ? " \u00b7 " + (r.name || open.fileName) : "");
    const note = busy
      // The seconds tick even while the percentage cannot move. A stage is
      // often ONE call the page cannot subdivide, so the band it sits in is
      // static for its whole duration \u2014 which read as stalled, repeatedly,
      // and was the whole reason a progress figure was asked for.
      ? running.label + " \u00b7 " + Math.round(running.pct) + "% \u00b7 " + running.secs + "s"
      : !open ? "not open in Figma"
      // "connected" on three rows read as three files being audited, and the
      // run checks ONE. A file's part in the run is not the same fact as its
      // being open, and the list was only ever stating the second.
      : r.key === ctx.libKey ? "audited by this run"
      : r.role === "source" ? "read, not audited"
      : "not in this run";
    const [, nameEl, noteEl] = li.children;
    if (nameEl.textContent !== label) nameEl.textContent = label;
    if (noteEl.textContent !== note) noteEl.textContent = note;
  }
}
// A run names the file it is talking to and how far through it is, so the
// spinner sits on the file being read rather than on the page as a whole —
// the link stage reads two files, and a run that looks stuck is usually
// waiting on the one nobody opened.
let ticker = null;
export function runProgress(key, pct, label) {
  if (ticker) { clearInterval(ticker); ticker = null; }
  if (!key) { running = null; paintFiles(); return; }
  const at = Date.now();
  running = { key, pct, label, secs: 0 };
  paintFiles();
  // One timer for the whole run, restarted per stage: the file list is the
  // only place a run reports progress now, so it has to be the place that
  // shows it is alive.
  ticker = setInterval(() => {
    if (!running) return;
    running.secs = Math.round((Date.now() - at) / 1000);
    paintFiles();
  }, 1000);
}
export const endProgress = () => runProgress(null);

// The check catalogue is NOT here: `renderChecks` lives in `scores.js`. This
// header and its paragraph stayed behind when the renderer moved.
//
// The About tab's account of the measures, from the same document the tiles
// come from. Two renderings of one source, rather than two sources.
function renderAboutMeasures(doc) {
  const intro = document.getElementById("measuresIntro");
  const host = document.getElementById("measuresAbout");
  if (!intro || !host || !doc) return;
  intro.innerHTML = doc.intro || "";
  host.textContent = "";
  for (const def of doc.measures || []) {
    const wrap = document.createElement("div");
    wrap.className = "measure";
    const h3 = document.createElement("h3");
    h3.textContent = def.label;
    const grade = document.createElement("div");
    grade.className = "grade";
    grade.innerHTML = def.grade || "";        // authored in the skill; carries <br>
    // A measure whose check is not built takes no tile, and saying so here is
    // the same honesty the check catalogue applies: the audit intends this
    // measure and does not yet take it.
    if (def.status && def.status !== "scanner") {
      wrap.dataset.off = "1";
      const tag = document.createElement("span");
      tag.className = "runs-tag";
      tag.textContent = "not yet measured";
      grade.appendChild(document.createElement("br"));
      grade.appendChild(tag);
    }
    const body = document.createElement("div");
    body.className = "body";
    for (const para of def.about || []) {
      const p = document.createElement("p");
      p.innerHTML = para;                      // authored in the skill; carries <b>/<code>
      body.appendChild(p);
    }
    wrap.append(h3, grade, body);
    host.appendChild(wrap);
  }
}
