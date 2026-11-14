/*
 * The toolkit's own rendering of a library, with no project code: each component's web component (to-markup's
 * toElement, through the one DOM helper), its sheet (to-code's toCss) and the tokens as custom properties, on one
 * static page that exposes each component's render function as window.R[<folder>]. test-to-markup renders the sample
 * library through it; from-code reads a project's library through it (--self), so what differs there is the
 * toolkit's own translation loss, apart from the project's code.
 *
 *   const s = await serveSite(siteFiles(library, { tokensCss }));   // s.url, s.close()
 *
 * `library` is { <component>: contract with its folder }, as to-markup takes it; `tokensCss` the custom properties
 * (the project's generated _tokens.scss, which is plain CSS, or a :root block built from a sample).
 */
import http from 'node:http';
import { toElement, DOM } from './to-markup.mjs';
import { toCss, BASE } from './to-code.mjs';

export const ELEMENT = { kind: 'element', prefix: 'ds-' };

/* The site's files, by path: { 'index.html', 'all.css', 'components/dom.js', 'components/<folder>/<folder>.js' }. */
export function siteFiles(library, { tokensCss = '', stylesheets = [], naming = ELEMENT } = {}) {
  const files = { 'components/dom.js': DOM };
  // the base the sheets assume first (to-code's BASE), then the tokens and each component's sheet
  let css = `${BASE}${tokensCss}\n`;
  // each component's render function, by the name its file exports (to-markup's to say, not this file's to guess)
  const fn = {};
  for (const c of Object.values(library)) {
    const js = toElement(c, c.folder, { naming, library });
    files[`components/${c.folder}/${c.folder}.js`] = js;
    fn[c.folder] = (/export function (\w+)\(/.exec(js) || [])[1];
    if (!fn[c.folder]) throw new Error(`${c.component}: to-markup's file exports no render function`);
    css += toCss(c, c.folder, { naming });
  }
  files['all.css'] = css;
  const imports = Object.entries(fn).map(([f, n], i) => `import { ${n} as C${i} } from './components/${f}/${f}.js';`).join('');
  files['index.html'] = `<!doctype html><html><head><meta charset="utf-8">${stylesheets.map((h) => `<link rel="stylesheet" href="${h}">`).join('')}<link rel="stylesheet" href="all.css"></head><body><main id="stage"></main><script type="module">${imports} window.R = { ${Object.keys(fn).map((f, i) => `${JSON.stringify(f)}: C${i}`).join(', ')} }; window.ready = true;</script></body></html>`;
  return files;
}

/* Served from memory on a free local port. */
export async function serveSite(files) {
  const type = (p) => (p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html');
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '') || 'index.html';
    if (!(p in files)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': type(p) });
    res.end(files[p]);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((r) => server.close(r)) };
}
