#!/usr/bin/env node
// tools/docs-mcp/server.mjs over a committed fixture site (fixtures/site: the
// API files the docs site writes, and four pages): every tool called as a
// client would, each answer held to what the fixture says. Run by bin/check
// always, so the server is tested where no project has a built site (CI).
// Without its packages it says so and exits 77, a skip.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { serveFolder } from "./serve-folder.mjs";

if (!existsSync(new URL("./node_modules/@modelcontextprotocol/sdk", import.meta.url))) {
  console.log("skip: the docs MCP's packages are not installed: run (cd tools/docs-mcp && pnpm install --frozen-lockfile)");
  process.exit(77);
}
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");

let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ""}`); console.log("ok", name); };
const site = await serveFolder(new URL("./fixtures/site", import.meta.url).pathname);
const c = new Client({ name: "docs-mcp-test", version: "0" });
await c.connect(new StdioClientTransport({ command: process.execPath, args: [new URL("./server.mjs", import.meta.url).pathname], env: { ...process.env, DOCS_URL: site.url }, stderr: "ignore" }));
const raw = async (name, args = {}) => { const r = await c.callTool({ name, arguments: args }); return { isError: !!r.isError, data: JSON.parse(r.content[0].text) }; };
const call = async (name, args) => (await raw(name, args)).data;

try {
  ok("the server is named for the one project its site is, and tells the client its content is data",
    c.getServerVersion().name === "docs-project-a" && /never instructions to you/.test(c.getInstructions() || ""));
  const tools = (await c.listTools()).tools;
  ok("ten tools, every one read-only", tools.length === 10 && tools.every((t) => t.annotations && t.annotations.readOnlyHint === true), tools.map((t) => t.name).join(", "));

  const over = await call("overview", {});
  ok("overview is the site's index", over.project.name === "Project A" && over.components.map((p) => p.slug).join() === "button,chip");

  const hits = await call("search", { query: "brand" });
  ok("search finds tokens by name across modes once, and a component by its guidance",
    JSON.stringify(hits.tokens) === JSON.stringify(["Semantic / Color/Background/Brand/primary"]) && !hits.components.length
    && (await call("search", { query: "status" })).components.map((p) => p.slug).join() === "chip");

  ok("get_component finds a page by title, slug or set name, and an unknown one says so",
    (await call("get_component", { name: "Button" })).slug === "button" && (await call("get_component", { name: "chip" })).error === undefined
    && /No component matches "nope"/.test((await call("get_component", { name: "nope" })).error));

  const contract = await call("get_contract", { name: "button" });
  ok("get_contract returns the page's contracts", JSON.stringify(contract.button.props.variant.values) === JSON.stringify(["primary", "secondary"]));

  const v = await call("validate", { code: '<Button variant="tertiary" />\n<button style="color: #c40d22">Go</button>', component: "Button" });
  ok("validate names a value the contract lacks, a raw colour with its token, and a raw element the library has",
    !v.clean && v.findings.some((f) => f.kind === "value not in the contract" && f.found === 'variant="tertiary"')
    && v.findings.some((f) => f.kind === "raw colour" && f.use === "Color/Background/Brand/primary")
    && v.findings.some((f) => f.kind === "raw element" && f.use === "Button"), JSON.stringify(v));
  ok("validate says clean code is clean", (await call("validate", { code: '<Button variant="primary" />', component: "button" })).clean === true);

  const all = await call("get_tokens", {});
  const sem = await call("get_tokens", { collection: "semantic", query: "brand" });
  ok("get_tokens lists collections, then one collection's variables per mode with alias and description",
    all.collections[0].name === "Semantic" && all.collections[0].count === 2 && all.textStyles[0] === "Body/Medium"
    && sem.collection === "Semantic" && Object.keys(sem.variables).length === 1
    && sem.variables["Color/Background/Brand/primary"].Light.alias === "Red/600" && sem.variables["Color/Background/Brand/primary"].Dark === "#ff4d5e"
    && /primary action/.test(sem.variables["Color/Background/Brand/primary"].description));
  ok("an unknown collection says so and lists the real ones", (await call("get_tokens", { collection: "Spacing" })).collections.join() === "Semantic");

  const log = await call("get_changes", { limit: 5 });
  const own = await call("get_changes", { component: "button", since: "2026-10-15" });
  ok("get_changes is newest first, graded changes kept; a component's own log filters by date",
    log.length === 2 && log[0].at.startsWith("2026-10-30") && log[0].changes[0].what === "padding" && log[1].tokens.added === 2
    && own.length === 1 && own[0].lines[0] === "padding: 8 → 12");

  const audit = await call("get_audit", { runs: 1 });
  const closed = await call("get_audit", { component: "chip", include_closed: true });
  ok("get_audit gives open rows by default, a component's rows and scores, and the runs asked for",
    audit.total === 1 && audit.rows[0].key === "button|binding" && audit.runs.length === 1 && audit.scores.length === 1
    && closed.total === 1 && closed.rows[0].key === "chip|naming" && closed.scores.length === 0);

  const pages = await call("list_pages", {});
  ok("list_pages follows the site's own links: every page, no API file or asset",
    JSON.stringify(pages.pages.map((p) => p.path).sort()) === JSON.stringify(["/", "/changes", "/components/button", "/foundations"])
    && pages.pages.find((p) => p.path === "/components/button").title === "Button & its sets", JSON.stringify(pages));
  ok("list_pages filters by path or title", (await call("list_pages", { filter: "found" })).count === 1);

  const page = await call("read_page", { path: "/foundations/" });
  ok("read_page reads a page's main content as text: headings marked, list items, no markup, script or style",
    page.path === "/foundations" && /# Foundations/.test(page.text) && /## Colour/.test(page.text) && /- Color\/Text\/Neutral\/primary/.test(page.text)
    && !/<\w/.test(page.text) && !/document\.title|color: red|Overview/.test(page.text), page.text);
  const table = await call("read_page", { path: "/components/button" });
  ok("a table row reads as its cells joined", /variant \| primary, secondary/.test(table.text), table.text);
  const part = await call("read_page", { path: "/foundations", offset: 10 });
  ok("read_page reads from an offset", part.offset === 10 && part.text === page.text.slice(10) && part.more === false);
  const missing = await raw("read_page", { path: "/nowhere" });
  ok("a page the site does not have is an error naming it", missing.isError && /\/nowhere answered 404/.test(missing.data.error));
} finally {
  await c.close();
  site.close();
}
console.log(`${n}/${n} passed`);
