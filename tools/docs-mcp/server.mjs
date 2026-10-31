#!/usr/bin/env node
// Read-only MCP server over ONE project's docs site. It reads the site's JSON
// API (tools/docs-site/src/pages/api/), so the same server works against the local
// dashboard service and a deployed copy: only DOCS_URL changes. One instance
// is one project, and nothing here can reach another; projects are different
// customers, so each gets its own entry in the client's config.
//
//   DOCS_URL=http://localhost:9232 node server.mjs
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.DOCS_URL || "").replace(/\/$/, "");
if (!BASE) { console.error("Set DOCS_URL to one project's docs site, e.g. http://localhost:9232"); process.exit(2); }

// A minute's cache: a conversation asks several questions of the same files,
// and the site only changes when a snapshot or an audit lands.
const cache = new Map();
async function get(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  const r = await fetch(BASE + "/api/" + path);
  if (!r.ok) throw new Error(`${BASE}/api/${path} answered ${r.status}${r.status === 404 ? " (is the site built with the API?)" : ""}`);
  const data = await r.json();
  cache.set(path, { at: Date.now(), data });
  return data;
}
const reply = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 1) }] });
// A failed read becomes the tool's answer, marked as an error.
// Every tool only reads the published site, so each says so to the client.
const tool = (name, config, fn) => server.registerTool(name, { ...config, annotations: { readOnlyHint: true, openWorldHint: false } }, async (args) => {
  try { return await fn(args); } catch (e) { return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: e.message }) }] }; }
});
const has = (hay, q) => String(hay || "").toLowerCase().includes(q);
// A collection stores values per mode: values[mode][name], alias[mode][name].
const namesOf = (c) => Object.keys((c.values || {})[(c.modes || [])[0]] || {});
const variableOf = (c, name) => Object.fromEntries((c.modes || []).map((m) => {
  const alias = c.alias && c.alias[m] && c.alias[m][name];
  return [m, alias ? { value: c.values[m][name], alias } : c.values[m][name]];
}));

// A component by slug, title or set name.
async function findPage(name) {
  const q = name.toLowerCase().trim();
  const { components } = await get("index.json");
  return components.find((p) => p.slug === q || p.title.toLowerCase() === q)
      || components.find((p) => p.sets.some((s) => s.name.toLowerCase() === q))
      || components.find((p) => has(p.title, q) || p.sets.some((s) => has(s.name, q)));
}

// Started even when the site does not answer yet: the client then shows each
// tool's error, which names the URL and the status, instead of a server that
// only says it disconnected.
const index = await get("index.json").catch(() => null);
const server = new McpServer({ name: "docs-" + (index ? index.project.id : new URL(BASE).host), version: "1.0.0" }, {
  instructions: `Documentation of the ${index ? index.project.name : "project's"} design system: components, tokens, change log and audit. ` +
    "Start with `overview` or `search` for exact questions; `list_pages` and `read_page` read any page of the site as a reader sees it. Before writing a component's markup, read its `get_contract`; after, run what you wrote through `validate`. Every answer comes from this project's published docs site, never from another project.",
});

tool("overview", {
  description: "What this design system's docs hold: project, snapshot, every component page with a one-line summary, its audit score (0–100) and open findings, token collections, change-log and audit totals.",
  inputSchema: {},
}, async () => reply(await get("index.json")));

tool("search", {
  description: "Find components (by name or guidance text) and tokens (by name) matching a query.",
  inputSchema: { query: z.string().describe("Words to look for, e.g. 'date picker' or 'surface'") },
}, async ({ query }) => {
  const q = query.toLowerCase();
  const [idx, tokens] = await Promise.all([get("index.json"), get("tokens.json")]);
  const components = idx.components.filter((p) => has(p.title, q) || p.sets.some((s) => has(s.name, q) || has(s.summary, q)))
    .map((p) => ({ slug: p.slug, title: p.title, sets: p.sets.map((s) => s.name) }));
  const tokenHits = [];
  for (const [collection, c] of Object.entries(tokens.collections || {}))
    for (const name of namesOf(c)) if (has(name, q)) tokenHits.push(collection + " / " + name);
  const styles = ["textStyles", "paintStyles", "effects"].flatMap((k) => (tokens[k] || []).filter((s) => has(s.name, q)).map((s) => k + ": " + s.name));
  return reply({ components, tokens: tokenHits.slice(0, 100), styles: styles.slice(0, 50), truncated: tokenHits.length > 100 });
});

tool("get_contract", {
  description: "A component's contract: its props (types, values, defaults), anatomy and what each prop value changes, every value a token. Read it before writing the component's markup.",
  inputSchema: { name: z.string().describe("Slug, page title or set name, e.g. 'chip'") },
}, async ({ name }) => {
  const page = await findPage(name);
  if (!page) return reply({ error: `No component matches "${name}". Try search.` });
  const contracts = (await get("components/" + page.slug + ".json")).contracts || {};
  return reply(Object.keys(contracts).length ? contracts : { error: `${page.title} has no contract yet: the library needs a snapshot` });
});

tool("validate", {
  description: "Check generated code against this design system: every raw colour (and the token that holds it, if one does), every token name the library does not have, every raw HTML element the library has a component for (<button> where it has Button), and, with a component named, every prop value its contract does not have. Run it on what you wrote before handing it over.",
  inputSchema: { code: z.string().describe("The markup, styles or component code to check"), component: z.string().optional().describe("The component the code renders, to hold its props to its contract") },
}, async ({ code, component }) => {
  const { validate } = await import("./validate.mjs");
  let contract = null;
  if (component) { const page = await findPage(component); if (page) contract = Object.values((await get("components/" + page.slug + ".json")).contracts || {})[0] || null; }
  const found = validate(code, await get("tokens.json"), contract, ((await get("index.json")).components || []).map((p) => p.title));
  return reply({ clean: !found.length, findings: found });
});

tool("get_component", {
  description: "One component page in full: its sets with properties and defaults, guidance (purpose, usage, don'ts, behaviour, accessibility), implementation notes, related parts, change log and audit findings.",
  inputSchema: { name: z.string().describe("Slug, page title or set name, e.g. 'button' or 'Date picker'") },
}, async ({ name }) => {
  const page = await findPage(name);
  if (!page) return reply({ error: `No component matches "${name}". Try search.` });
  return reply(await get("components/" + page.slug + ".json"));
});

tool("get_tokens", {
  description: "Token values: one collection with its modes and variables, or every collection's names when none is given. Optionally filter variable names.",
  inputSchema: {
    collection: z.string().optional().describe("Collection name; omit to list collections"),
    query: z.string().optional().describe("Only variables whose name contains this"),
  },
}, async ({ collection, query }) => {
  const tokens = await get("tokens.json");
  const cols = tokens.collections || {};
  if (!collection) return reply({ collections: Object.entries(cols).map(([n, c]) => ({ name: n, modes: c.modes, count: namesOf(c).length })),
                                   textStyles: (tokens.textStyles || []).map((s) => s.name), effects: (tokens.effects || []).map((s) => s.name) });
  const key = Object.keys(cols).find((k) => k.toLowerCase() === collection.toLowerCase());
  if (!key) return reply({ error: `No collection "${collection}".`, collections: Object.keys(cols) });
  const c = cols[key];
  const names = namesOf(c).filter((n) => !query || has(n, query.toLowerCase()));
  return reply({ collection: key, modes: c.modes,
    variables: Object.fromEntries(names.slice(0, 300).map((n) => [n, { ...variableOf(c, n), ...(c.descriptions && c.descriptions[n] ? { description: c.descriptions[n] } : {}) }])),
    truncated: names.length > 300 });
});

tool("get_changes", {
  description: "The change log, newest first: what moved in each snapshot, per component, with each change's level for Figma files and for code where graded. Filter by component and date.",
  inputSchema: {
    component: z.string().optional().describe("Slug, title or set name"),
    since: z.string().optional().describe("ISO date, e.g. 2026-09-01"),
    limit: z.number().int().min(1).max(100).default(20),
  },
}, async ({ component, since, limit }) => {
  if (component) {
    const page = await findPage(component);
    if (!page) return reply({ error: `No component matches "${component}".` });
    const c = await get("components/" + page.slug + ".json");
    return reply(c.changes.filter((e) => !since || e.at >= since).reverse().slice(0, limit));
  }
  const log = (await get("changes.json")).filter((e) => !since || e.at >= since).reverse().slice(0, limit);
  // Folder lists run to hundreds of names on a bulk change; the graded
  // changes are the readable part, the counts say how much moved.
  return reply(log.map((e) => {
    const c = e.components || {}, t = e.tokens || {};
    return { at: e.at, file: e.file,
      components: { added: c.added || [], removed: c.removed || [], changed: (c.changed || []).length > 40 ? `${c.changed.length} components` : c.changed || [] },
      tokens: { added: (t.added || []).length, removed: (t.removed || []).length, changed: (t.changed || []).length },
      changes: ((e.grade && e.grade.changes) || []).slice(0, 40).map((x) => ({ type: x.group, figma: x.figma, code: x.code, subject: x.subject, what: x.what })) };
  }));
});

tool("get_audit", {
  description: "Audit findings, component scores and runs: open rows by default, optionally for one component; each component's 0–100 score with its dimensions; and the latest runs with what each found and cost.",
  inputSchema: {
    component: z.string().optional().describe("Slug, title or set name"),
    include_closed: z.boolean().default(false),
    runs: z.number().int().min(0).max(50).default(5).describe("How many recent runs to include"),
    limit: z.number().int().min(1).max(500).default(50).describe("How many rows to return"),
  },
}, async ({ component, include_closed, runs, limit }) => {
  const audit = await get("audit.json");
  let rows = audit.rows.filter((r) => include_closed || r.open);
  let page = null;
  if (component) {
    page = await findPage(component);
    if (!page) return reply({ error: `No component matches "${component}".` });
    rows = rows.filter((r) => r.page === page.slug);
  }
  const scores = page ? (audit.scores || []).filter((s) => s.page === page.slug) : (audit.scores || []);
  return reply({ total: rows.length, rows: rows.slice(0, limit), scores, runs: audit.runs.slice(0, runs) });
});

// ---- every page, as text ---------------------------------------------------
// The JSON tools answer exact questions; these two make the rest of the site
// readable without an endpoint per page, which would drift the day a page
// changes. The page list is found by following the site's own links, so a
// new page is listed without anything here knowing it exists.
const pageCache = new Map();
async function html(path) {
  const hit = pageCache.get(path);
  if (hit && Date.now() - hit.at < 60000) return hit.text;
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`${BASE}${path} answered ${r.status}`);
  const text = await r.text();
  pageCache.set(path, { at: Date.now(), text });
  return text;
}
const linksOf = (h) => [...h.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/\/$/, "") || "/")
  .filter((u) => !/^\/(_astro|api|audit\/|previews)\b/.test(u) && !/\.(css|js|json|png|svg|ico|webp)$/.test(u));
async function allPages(cap = 600) {
  const seen = new Set(["/"]), queue = ["/"], out = [];
  while (queue.length && out.length < cap) {
    const u = queue.shift();
    let h; try { h = await html(u); } catch { continue; }
    const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || u;
    out.push({ path: u, title: decode(title) });
    for (const l of linksOf(h)) if (!seen.has(l)) { seen.add(l); queue.push(l); }
  }
  return out;
}
const decode = (t) => t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
// The page's main content as plain text: headings marked, table rows as
// cells joined by " | ", list items as "- ". Scripts, styles and drawings go.
function textOf(h) {
  const main = (h.match(/<main[\s\S]*?<\/main>/) || [h])[0];
  return decode(main
    .replace(/<(script|style|svg|template)[\s\S]*?<\/\1>/g, "")
    .replace(/<h([1-6])[^>]*>/g, (_, n) => "\n\n" + "#".repeat(+n) + " ").replace(/<\/h[1-6]>/g, "\n")
    .replace(/<\/t[dh]>\s*<t[dh][^>]*>/g, " | ").replace(/<tr[^>]*>/g, "\n").replace(/<li[^>]*>/g, "\n- ")
    .replace(/<(br|\/p|\/div|\/section|\/table|\/ul|\/ol|\/dt|\/dd|\/figcaption)[^>]*>/g, "\n")
    // A space, not nothing: a label and its number sit in sibling elements
    // ("Finished" and "41"), and removing the tags ran them together.
    .replace(/<[^>]+>/g, " ")).replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}

tool("list_pages", {
  description: "Every page of this project's docs site, found by following its own links: path and title. Use read_page to read one.",
  inputSchema: { filter: z.string().optional().describe("Only pages whose path or title contains this") },
}, async ({ filter }) => {
  const q = filter && filter.toLowerCase();
  const pages = (await allPages()).filter((p) => !q || has(p.path, q) || has(p.title, q));
  return reply({ count: pages.length, pages });
});

tool("read_page", {
  description: "Any docs-site page as plain text — foundations, component pages, the tracker, the change log, the overview — exactly what a reader of the site sees. The audit dashboard is drawn by script, so its data comes from get_audit instead.",
  inputSchema: {
    path: z.string().describe("A path from list_pages, e.g. /foundations/typography or /components/button"),
    offset: z.number().int().min(0).default(0).describe("Character offset, to read a long page in parts"),
  },
}, async ({ path, offset }) => {
  const p = "/" + String(path).replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "");
  const text = textOf(await html(p === "/" ? "/" : p));
  const part = text.slice(offset, offset + 40000);
  return reply({ path: p, length: text.length, offset, text: part, more: offset + part.length < text.length });
});

await server.connect(new StdioServerTransport());
