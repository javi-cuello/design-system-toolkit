// The service's routes (the record, the Figma bridge, Claude), and read-only mode
// when no service answers.
import { DASH, ctx } from './context.js';

// Everything this page needs comes from its own origin. Three routes carry
// the CORE of it —
//   store   -> GET /data, POST /patch   (the audit record on disk)
//   bridge  -> POST /exec               (straight to the Figma plugin)
//   ask     -> POST /claude             (the API, key held by the server)
// — and the rest of the surface hangs off the same object: `status`,
// `context`, `ruling`, `rows`, `validate`, `scripts` and `live`. The three
// above were the whole app once and the sentence outlived that.
/*
 * Read-only, when nothing is serving the record. A published copy of this
 * page (the docs site's /audits) carries the record it was built with in
 * /audit/<fileKey>.json beside the page; with no service answering, it shows
 * the chosen library's record, marks
 * itself read-only and hides every action, instead of failing to load.
 */
const readOnly = () => DASH.dataset.readonly === "yes";
const refuse = async () => ({ ok: false, error: "This is a read-only copy of the dashboard. Run the dashboard service to change anything." });
export const api = {
  // Read-only only when no service ever answered. A service that answered
  // once and then fails a poll (a restart, a 500) is a live page with an
  // error to show, not a published copy; flipping it read-only hid the
  // error and left the page read-only until a reload.
  async get() {
    // No service: a network error where nothing listens, or a 404 from a
    // static host serving the published copy. Either way, if no service ever
    // answered, this is the read-only copy.
    // One record per library: which one is whichever the header's switch has
    // chosen. A project with one library asks for it by key just the same.
    // The record as it stood at the last build, served as a file beside the
    // page (`/audit/<fileKey>.json`, mounted by the build) rather than baked
    // into it: baked, it was 88% of the page and thrown away on every load a
    // service answered. A record the build could not parse is served as it
    // is, so this throws and the page says the record is unreadable rather
    // than drawing an empty queue.
    const readOnlyCopy = async () => {
      DASH.dataset.readonly = "yes";
      if (!ctx.libKey) return {};
      const c = await fetch("/audit/" + encodeURIComponent(ctx.libKey) + ".json", { cache: "no-store" });
      if (c.status === 404) return {};
      if (!c.ok) throw new Error("the published copy answered " + c.status + " for the audit record");
      try { return await c.json(); }
      catch (e) { throw Object.assign(new Error("this library's record is not readable JSON in the published copy \u2014 " + e.message), { code: "bad_copy" }); }
    };
    let r;
    try { r = await fetch("/data" + (ctx.libKey ? "?lib=" + encodeURIComponent(ctx.libKey) : ""), { cache: "no-store" }); }
    catch (e) {
      if (api.live || !window.DASH_LIBS) throw e;
      return readOnlyCopy();
    }
    if (!r.ok && !api.live && window.DASH_LIBS && r.status === 404) return readOnlyCopy();
    if (!r.ok) throw new Error("The service answered " + r.status + " for the audit record");
    api.live = true;
    return r.json();
  },
  async patch(path, value) {
    if (readOnly()) return refuse();
    const r = await fetch("/patch", { method: "POST", headers: { "content-type": "application/json" },
                                      body: JSON.stringify({ path, value, lib: ctx.libKey }) });
    return r.json();
  },
  async exec(code, timeout, fileKey) {
    if (readOnly()) return refuse();
    const r = await fetch("/exec", { method: "POST", headers: { "content-type": "application/json" },
                                     body: JSON.stringify({ code, timeout, fileKey }) });
    return r.json();
  },
  async claude(prompt, system, max_tokens, use) {
    if (readOnly()) return refuse();
    const r = await fetch("/claude", { method: "POST", headers: { "content-type": "application/json" },
                                       body: JSON.stringify({ prompt, system, max_tokens, use }) });
    return r.json();
  },
  async status() { if (readOnly()) return { ok: false, readonly: true }; const r = await fetch("/status", { cache: "no-store" }); return r.json(); },
  // The project's preferences, read from its context document by the service.
  async context() { if (readOnly()) return window.DASH_CONTEXT || {}; const r = await fetch("/context", { cache: "no-store" }); return r.json(); },
  async ruling(text, where, about) {
    if (readOnly()) return refuse();
    const r = await fetch("/ruling", { method: "POST", headers: { "content-type": "application/json" },
                                      body: JSON.stringify({ text, where, about }) });
    return r.json();
  },
  // Rows are filed by the service, the same way for every skill that owns them.
  /*
   * Every owner's findings go through here, so the project's dialect is
   * attached here rather than at four call sites. The writer spells the
   * check's own words with it — never the component's name.
   */
  async rows(payload) {
    payload = Object.assign({ language: (ctx.lastRules && ctx.lastRules.language) || "en-GB" }, payload);
    if (readOnly()) return refuse();
    const r = await fetch("/rows", { method: "POST", headers: { "content-type": "application/json" },
                                    body: JSON.stringify(payload) });
    return r.json();
  },
  // The validator's engine runs in the service. The page hands it `specs`:
  // the LIVE library, read by the snapshot plugin's own walk run headless
  // through the bridge, which the service resolves exactly as it resolves a
  // stored spec. An audit is about the present (toolkit-standard §D 5); the
  // stored snapshot remains the docs build's input. `components` are trees
  // a caller has already read and normalised; with neither the service
  // reads the snapshot, which no audit path does any more.
  async validate(target, components, framework, frameworkMap, specs) {
    if (readOnly()) return refuse();
    // The library, so the service validates ONE file's components. A project
    // may snapshot several into one store, and reading it whole put a mobile
    // component's rows on the web board.
    const payload = { target, framework, frameworkMap, fileKey: ctx.libKey };
    if (components) payload.components = components;
    // The plugin's own records of the LIVE file, from its headless walk; the
    // service resolves them exactly as it resolves a stored spec.
    if (specs) payload.specs = specs;
    const r = await fetch("/validate", { method: "POST", headers: { "content-type": "application/json" },
                                        body: JSON.stringify(payload) });
    return r.json();
  },
  // The library's components against its code's, by name, compared in the
  // service: the code is a folder on its machine. `figma` is the names read
  // from the live file.
  async parity(figma) {
    if (readOnly()) return refuse();
    const r = await fetch("/parity", { method: "POST", headers: { "content-type": "application/json" },
                                      body: JSON.stringify({ lib: ctx.libKey, figma }) });
    return r.json();
  },
  // Shared across every project, so a new check reaches all of them at once.
  async scripts() { if (readOnly()) return window.DASH_SCRIPTS || {}; const r = await fetch("/scripts", { cache: "no-store" }); return r.json(); }
};
// Run code inside the Figma plugin and hand back what it returned.
// Two failure codes, because they need two different answers from the
// reader: `no_plugin` is "go open the library in Figma", anything else is
// the plugin having run the code and refused it.
export const bridge = {
  async exec(code, timeout) {
    // Always name the library. With two open, an unnamed call would run
    // against whichever happened to connect last.
    const r = await api.exec(code, timeout || 30000, ctx.libKey);
    if (!r.ok) {
      const missing = r.error === "plugin_not_connected" || r.error === "wrong_file_not_open";
      // The service distinguishes a bridge that gave up waiting from code
      // Figma refused; so does this, because the reader's next move differs:
      // one wants the file idle and a retry, the other wants someone to read
      // what broke. Both used to arrive as "Figma refused the code: plugin_timeout".
      const timeout = /^plugin_timeout/.test(r.error || "") || /timed out/i.test(r.error || "");
      throw Object.assign(
        new Error(r.error === "wrong_file_not_open"
          ? "This library isn\u2019t open in Figma." : (r.error || "exec failed")),
        { code: missing ? "no_plugin" : timeout ? "timeout" : "figma_error" });
    }
    // The plugin answers `{success, result}` or `{success:false, error}`.
    // Unwrapping here means no call site ever handles an envelope, and a
    // refusal arrives as a throw like every other failure rather than as a
    // success whose contents happen to say "false".
    const out = r.result;
    if (out && out.success === false)
      throw Object.assign(new Error(out.error || "Figma refused the code."), { code: "figma_error" });
    return out && out.result !== undefined ? out.result : out;
  }
};
// askClaude(prompt, opts) -> {text}. The key never leaves the service.
// NOT `ask` — the chat drawer already declares a zero-arg `ask()` handler in
// this scope, and the later declaration silently wins.
// One request, one answer. No streaming: the API call is proxied whole, so
// an onText callback would only ever fire once with the finished text.
export async function askClaude(input, opts) {
  const prompt = typeof input === "string" ? input : JSON.stringify(input);
  // `use: "judge"` asks the service for the audit skill's judge settings.
  const r = await api.claude(prompt, null, (opts && opts.max_tokens) || 2000, opts && opts.use);
  if (!r.ok) throw Object.assign(new Error(r.error || "claude failed"), { code: r.error });
  // `opts.spend` is a running total the caller owns: a run passes one and
  // records it, so its cost is its own and not whatever else the page asked.
  const t = opts && opts.spend, sp = r.spend;
  if (t && sp) {
    t.model = sp.model; t.calls = (t.calls || 0) + 1;
    t.input = (t.input || 0) + sp.input; t.output = (t.output || 0) + sp.output;
    t.usd = sp.usd == null || t.usd === null ? null : (t.usd || 0) + sp.usd;
  }
  return { text: r.text, truncated: !!r.truncated };
}
// THROWS rather than returning null. Swallowing a parse failure here is the
// most dangerous thing this page can do: an answer truncated at max_tokens
// leaves an unterminated object, the greedy match grabs it, the parse fails,
// and a null verdict renders as "Nothing to fix" for a component that had
// nineteen candidates. A wrong answer stated confidently beats no answer, so
// the failure has to reach the reader.
askClaude.json = async (prompt, opts) => {
  const { text, truncated } = await askClaude(prompt, opts);
  if (truncated)
    throw Object.assign(new Error("the answer was cut off before it finished"), { code: "truncated" });
  const m = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : text); }
  catch (e) {
    throw Object.assign(new Error("the answer was not the JSON this asked for"), { code: "bad_json" });
  }
};
// Callers must be able to ask "is there a key?" BEFORE calling, so the page
// can show its own "no Claude configured" branch instead of surfacing an API
// error about a key the reader cannot do anything about from here.
let _statusOnce = null;
const statusOnce = () => (_statusOnce = _statusOnce || api.status().catch(() => ({})));
export const claudeReady = async () => !!(await statusOnce()).claude;
// A rejected key means no Claude for the rest of the session.
export function forgetClaude() { _statusOnce = Promise.resolve({ claude: false }); }
