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
    const el = document.getElementById("measuredLine");
    if (el) el.textContent = name + " failed to render — " + (e && e.message ? e.message : "unknown");
  }
};
export function announce() { for (const fn of listeners) step("The dashboard", () => fn(RECORD)); }
export async function pullRecord() { RECORD = await api.get(); announce(); return RECORD; }
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
    async set(obj) {
      RECORD[coll] = RECORD[coll] || {}; RECORD[coll][id] = obj;
      await api.patch(coll + "." + id, obj);
      announce();
    },
    async delete() {
      if (RECORD[coll]) delete RECORD[coll][id];
      await api.patch(coll + "." + id, null);
      announce();
    }
  };
}
export const store = { doc: docRef };
