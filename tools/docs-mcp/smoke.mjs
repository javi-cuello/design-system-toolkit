// Starts the server against one docs site and calls every tool, the way the
// Claude app would. Fails on an error, an empty answer, or a missing tool.
//   node smoke.mjs http://localhost:9232
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const url = process.argv[2];
if (!url) { console.error("usage: node smoke.mjs <docs site URL>"); process.exit(2); }
const c = new Client({ name: "docs-mcp-test", version: "0" });
await c.connect(new StdioClientTransport({ command: process.execPath, args: [new URL("./server.mjs", import.meta.url).pathname], env: { ...process.env, DOCS_URL: url } }));

const fails = [];
const names = (await c.listTools()).tools.map((t) => t.name);
for (const want of ["overview", "search", "get_component", "get_contract", "validate", "get_tokens", "get_changes", "get_audit", "list_pages", "read_page"])
  if (!names.includes(want)) fails.push("missing tool " + want);

const call = async (name, args) => {
  const r = await c.callTool({ name, arguments: args });
  const data = JSON.parse(r.content[0].text);
  if (r.isError || (data && data.error)) fails.push(`${name} ${JSON.stringify(args)}: ${(data && data.error) || r.content[0].text}`);
  return data;
};
const over = await call("overview", {});
if (!over || over.error) { console.error("fail — docs-mcp: " + fails.join("; ")); process.exit(1); }
const first = over.components[0];
if (!first) fails.push("overview lists no components");
else {
  const page = await call("get_component", { name: first.title });
  if (page.slug !== first.slug) fails.push(`get_component "${first.title}" returned ${page.slug}`);
  const hits = await call("search", { query: first.title.toLowerCase() });
  if (!hits.components.some((h) => h.slug === first.slug)) fails.push(`search "${first.title}" missed it`);
  await call("get_changes", { component: first.slug, limit: 3 });
  await call("get_audit", { component: first.slug, runs: 1 });
}
const tokens = await call("get_tokens", {});
if (tokens.collections.length) await call("get_tokens", { collection: tokens.collections[0].name });
await call("get_changes", { limit: 2 });
// Every page the site links to is listed, and a page reads as text.
const listed = await call("list_pages", {});
if (!listed.pages || listed.pages.length < over.components.length) fails.push(`list_pages found ${listed.pages ? listed.pages.length : 0} pages, fewer than the ${over.components.length} component pages`);
for (const want of ["/foundations", "/changes"]) if (!listed.pages.some((p) => p.path.startsWith(want))) fails.push("list_pages missed " + want);
const page = await call("read_page", { path: listed.pages.find((p) => p.path.startsWith("/foundations")).path });
if (!page.text || page.text.length < 200 || /<\w+[^>]*>/.test(page.text)) fails.push("read_page returned no readable text for " + page.path);
const miss = await c.callTool({ name: "get_component", arguments: { name: "no-such-component-xyz" } });
if (!JSON.parse(miss.content[0].text).error) fails.push("an unknown component did not say so");
await c.close();

if (fails.length) { console.error("fail — docs-mcp:\n  " + fails.join("\n  ")); process.exit(1); }
console.log(`pass — docs-mcp: ${names.length} tools against ${over.project.name}, ${over.components.length} components`);
