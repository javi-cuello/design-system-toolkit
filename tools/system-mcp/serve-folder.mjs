// A built site folder served on a free port as the dashboard service serves
// it: a folder as its index, never a path outside it. smoke.mjs serves a
// project's built site with it and test-server.mjs the committed fixture.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve, sep } from "node:path";

export async function serveFolder(folder) {
  const root = resolve(folder);
  const site = createServer((req, res) => {
    let f; try { f = resolve(root, "." + decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch { res.writeHead(400); return res.end(); }
    if (f !== root && !f.startsWith(root + sep)) { res.writeHead(404); return res.end(); }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
    if (!existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": f.endsWith(".json") ? "application/json" : f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
    res.end(readFileSync(f));
  });
  await new Promise((r) => site.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${site.address().port}`, close: () => site.close() };
}
