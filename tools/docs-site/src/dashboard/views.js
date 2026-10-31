// Which view shows: queue or about, by the address.
// (History is a pane inside the queue; scores are the Tracker's.)
import { resizeVisibleNotes, ownerFilterFromHash } from './queue.js';

// Views, addressed by the page's address: the site's sidebar links to
// #queue, #history and #about, so a reload or a
// shared link lands on the same view. A hash that names no view is an
// in-page anchor (the skip link's #main) and leaves the view as it is.
const VIEWS = ["queue", "about"];
function showView(name) {
  if (!VIEWS.includes(name)) name = "queue";
  for (const key of VIEWS) document.getElementById("view-" + key).hidden = key !== name;
  // A view that was hidden could not be measured. Now it can.
  resizeVisibleNotes();
  // The page's On this page column lists the headings of the view showing.
  dispatchEvent(new Event('contentchange'));
}
// #history is the queue view with its history pane open.
function showAuditPane(which) {
  const onQueue = which !== "history";
  document.getElementById("pane-queue").hidden = !onQueue;
  document.getElementById("pane-history").hidden = onQueue;
  resizeVisibleNotes();
}
// A hash is `view` or `view?filter` — the queue's owner filter rides along so
// a reload keeps it and a link carries it. Split here, applied in queue.js,
// which is the only thing that knows what a filter slug means.
const splitHash = (h) => { const i = h.indexOf("?"); return i < 0 ? [h, ""] : [h.slice(0, i), h.slice(i + 1)]; };
// The tab's title names the view, so history, a bookmark and a screen
// reader's window list tell "Queue · Audits" from "About · Audits".
const PAGE_TITLE = document.title;
const VIEW_TITLE = { queue: "Queue", history: "History", about: "About" };
const route = (h) => {
  const [view] = splitHash(h);
  if (view === "history") { showView("queue"); showAuditPane("history"); }
  else if (VIEWS.includes(view) || !view) { showView(view); showAuditPane("queue"); }
  else return ownerFilterFromHash();          // an in-page anchor: the view and its title stay
  document.title = VIEW_TITLE[view || "queue"] + " \u00b7 " + PAGE_TITLE;
  ownerFilterFromHash();
};
window.addEventListener("hashchange", () => route(location.hash.slice(1)));
// From the page's own links: shown at once (the caller scrolls to what it
// opened), and put in the address so the sidebar marks it. The filters and
// the file travel with it, or a menu chosen on the queue would be dropped by
// any link.
export const go = (view) => {
  const [, query] = splitHash(location.hash.slice(1));
  const want = view + (query ? "?" + query : "");
  route(want);
  if (location.hash !== "#" + want) location.hash = want;
};
// From a chip: the view stays, the filter changes.
export const setFilterHash = (slug) => {
  const [view] = splitHash(location.hash.slice(1));
  const v = VIEWS.includes(view) || view === "history" ? view : "queue";
  const want = v + (slug ? "?" + slug : "");
  if (location.hash !== "#" + want) location.hash = want;
};
const first = location.hash.slice(1);
route(VIEWS.includes(splitHash(first)[0]) || splitHash(first)[0] === "history" ? first : "");
