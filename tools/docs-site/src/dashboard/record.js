import { ctx } from './context.js';
// The audit record in memory: read from the service, re-rendered on every
// change, written through one document at a time.
import { api } from './api.js';

// The record, held in memory and written through on every change. Collections
// are plain objects here rather than snapshot cursors, so the shapes the page
// already renders are preserved exactly.
let RECORD = { libraries: {}, rows: {}, runs: {}, scores: {}, fingerprints: {}, meta: {}, asks: {} };
const listeners = [];
export function onRecord(fn) { listeners.push(fn); }
// Each render step is isolated so one failure cannot blank the whole page —
// and it is SAID rather than only logged. The version of this that swallowed
// errors into the console rendered an empty dashboard that looked like empty
// data, which is the worst way for a page to fail.
export const step = (name, fn) => {
  try { fn(); } catch (e) {
    console.error(name + " failed", e);
    const el = document.getElementById("sweepState");   // the head's status line: seen on every view
    if (el) el.textContent = name + " failed to render — " + (e && e.message ? e.message : "unknown");
  }
};
export function announce() { for (const fn of listeners) step("The dashboard", () => fn(RECORD)); }
export async function pullRecord() {
  // A read sent for one library and answered after the page moved to another
  // (a slow poll beside the Audit's switch between files) is dropped: kept, it
  // put the old library's record, and no fingerprints, under the new one.
  const key = ctx.libKey;
  const rec = await api.get();
  if (key !== ctx.libKey) return RECORD;
  RECORD = rec; announce(); return RECORD;
}
// A write the service refused (or the read-only copy's refusal) throws, so no caller says "Saved" over it.
const refused = (res) => {
  const why = (res && res.error) || "the service did not save it";
  if (!res || !res.ok) throw Object.assign(new Error(why), { code: why });
};
// Takes back a refused write's own keys, each only while it still holds what that write set: another write to the same
// entry in flight (a note's save beside a ruling) keeps what it set. An entry the write made, left empty, goes. A
// record read in the meantime is the service's own and is left as it came.
export function forget() { RECORD = { libraries: {}, rows: {}, runs: {}, scores: {}, fingerprints: {}, meta: {}, asks: {} }; }
function restore(held, coll, id, was, sent) {
  if (held !== RECORD) return;
  const cur = (RECORD[coll] || {})[id];
  if (!cur) return;
  for (const k of Object.keys(sent)) {
    if (cur[k] !== sent[k]) continue;
    if (was && k in was) cur[k] = was[k]; else delete cur[k];
  }
  if (was === undefined && !Object.keys(cur).length) delete RECORD[coll][id];
}
// `doc("rows/x")` addresses one entry of the record: read-through on get,
// write-through on set, and a re-render on every change.
function docRef(path) {
  const [coll, ...rest] = path.split("/");
  const id = rest.join("/");
  return {
    async get() {
      await pullRecord();
      const v = ((RECORD[coll] || {})[id]);
      return { exists: v !== undefined, data: () => v };
    },
    // Merged into the stored entry, as the service merges it: a key left out keeps its value, a key sent null clears it.
    // A refused write puts the entry back as it was, so the next render does not show what the service never kept.
    async set(obj) {
      const key = ctx.libKey, held = RECORD;
      RECORD[coll] = RECORD[coll] || {};
      const was = RECORD[coll][id];
      // JSON drops an undefined key and the service keeps its value, so the local copy keeps it too
      const sent = Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined));
      RECORD[coll][id] = Object.assign({}, was, sent);
      try { refused(await api.patch(coll + "." + id, obj)); }
      catch (e) { restore(held, coll, id, was, sent); throw e; }
      if (key === ctx.libKey) announce();     // the page moved to another file meanwhile: its record is not this one
    },
    async delete() {
      const key = ctx.libKey, held = RECORD;
      const was = (RECORD[coll] || {})[id];
      if (RECORD[coll]) delete RECORD[coll][id];
      try { refused(await api.patch(coll + "." + id, null)); }
      // put back only while nothing has written the entry since
      catch (e) { if (held === RECORD && was !== undefined && !(id in (RECORD[coll] || {}))) RECORD[coll][id] = was; throw e; }
      if (key === ctx.libKey) announce();
    }
  };
}
export const store = { doc: docRef };
