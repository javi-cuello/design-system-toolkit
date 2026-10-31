/*
 * tools/parity/serve.mjs — the static server a parity run serves a built
 * story tool from, part of the design-to-code parity engine (README.md here;
 * the method is skills/design-code-parity gate 26).
 *
 *   serve(dir, { port = 0 }) → { base, close }
 *
 * Not a stock file server: the run reloads the whole preview for every
 * variant, and a scripting language's stock server reset connections under
 * that load — a stylesheet that never arrived measured as an unstyled
 * component, a chunk that never arrived never rendered, a different
 * twenty-seven each run. In the run's own process and on a port the system
 * picks, so it is this run's server and no other: "anything answering on the
 * port" was once a server a previous run had left behind, serving a build
 * nobody had just made. The build is per run and so is the browser's
 * profile, so the browser caches freely.
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.gif': 'image/gif',
};

export function serve(dir, { port = 0 } = {}) {
  const server = createServer((req, res) => {
    const at = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(dir, at === '/' ? '/index.html' : at);
    let stat;
    try { stat = statSync(file); if (stat.isDirectory()) { file = join(file, 'index.html'); stat = statSync(file); } } catch { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'content-length': stat.size, 'cache-control': 'max-age=3600' });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({
      base: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }),
    }));
  });
}
