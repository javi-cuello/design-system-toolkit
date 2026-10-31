#!/usr/bin/env node
// ui.html's cleanSvg, run in Chrome on a hostile icon: an SVG from the CDN is
// rebuilt from its shapes, so nothing in it that runs, loads or links reaches
// the plugin's window or the file. Run: node plugins/lucide-icon-importer/tests/test-svg-clean.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome, launch, newPage, attach, navigate } from '../../../tools/shared/cdp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const ui = fs.readFileSync(path.join(HERE, '../ui.html'), 'utf8');
const script = ui.slice(ui.lastIndexOf('<script>') + 8, ui.lastIndexOf('</script>'));
// the sanitiser and the tables it reads, lifted from the plugin's own script, never a copy
const lift = (from, to) => script.slice(script.indexOf(from), script.indexOf(to));
const source = lift('var SVG_NS', 'function resetPreview');
ok('the plugin shows and sends only what cleanSvg built, and nothing writes CDN text as markup',
  /svgCache\[name\] = clean;/.test(script) && !/extractInner/.test(script) && (script.match(/replaceChildren\(cleanSvg\(/g) || []).length === 2);

if (!fs.existsSync(findChrome())) ok('Chrome is here to run the sanitiser in (none found: install Chrome, the toolkit\'s one browser)', false);
const HOSTILE = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" onload="window.ran=1">
  <script>window.ran=2</script>
  <path d="M5 12h14" onclick="window.ran=3"/>
  <circle cx="12" cy="12" r="10" fill="url(https://evil.example/x)" style="background:url(https://evil.example/y)"/>
  <foreignObject width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="window.ran=4"/></div></foreignObject>
  <a xlink:href="javascript:window.ran=5"><rect x="1" y="1" width="4" height="4"/></a>
  <use href="#p"/><image href="https://evil.example/z.png"/>
  <g transform="rotate(45 12 12)"><line x1="0" y1="0" x2="24" y2="24"/></g>
</svg>`;
const browser = await launch({});
try {
  const tab = await attach(await newPage(browser.endpoint));
  await navigate(tab, 'about:blank');
  const out = await tab.evaluate(`(() => { ${source}; const el = cleanSvg(${JSON.stringify(HOSTILE)}); document.body.replaceChildren(el);
    return { html: new XMLSerializer().serializeToString(el), tags: [...el.querySelectorAll('*')].map((e) => e.localName), ran: window.ran || 0,
      junk: cleanSvg('<html><body>not an svg</body></html>').childNodes.length, broken: cleanSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0').childNodes.length }; })()`);
  ok('nothing in the icon ran: no script, no handler, no foreignObject', out.ran === 0, out.html);
  ok('only shapes survive, in their order: path, circle, g and its line', JSON.stringify(out.tags) === JSON.stringify(['path', 'circle', 'g', 'line']), out.tags.join(','));
  ok('no attribute that runs, styles or links: on*, style, class, href, and no value naming a URL',
    !/onload|onclick|onerror|style=|class=|href|url\(|script|foreignObject|<use|<image|<a /i.test(out.html), out.html);
  ok('what draws the icon is kept: the root\'s stroke and size, the shapes\' geometry, a transform',
    /viewBox="0 0 24 24"/.test(out.html) && /stroke="currentColor"/.test(out.html) && /stroke-width="2"/.test(out.html) && /d="M5 12h14"/.test(out.html)
    && /cx="12"/.test(out.html) && /transform="rotate\(45 12 12\)"/.test(out.html), out.html);
  ok('a document that is not an svg, or one that does not parse, draws nothing', out.junk === 0 && out.broken === 0);
} finally { await browser.close(); }
console.log(`${n}/${n} passed`);
