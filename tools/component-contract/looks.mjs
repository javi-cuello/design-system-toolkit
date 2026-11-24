#!/usr/bin/env node
/**
 * looks.mjs — the Figma leg by eye, done by a machine: each component drawn into the project's scratch file
 * (eval.mjs --draw) is rendered beside the library's own, imported by its key into the same file, variant by variant,
 * and the two images compared pixel by pixel. A contract compares the values it holds; this sees what it does not hold
 * (a field hidden that the contract never named, a graphic over the words).
 *
 *   node tools/component-contract/looks.mjs --project <label> [components…] [--out <dir>]
 *
 * Prints, per component, the share of the pixels that show that differ (by ΔE) in its worst variant, and the library's
 * variants the drawing lacks, beside the rows its reading holds, and
 * names any visibly different with none (a gap in the measure); writes each differing variant's
 * library, drawn and difference images to --out (default: the project's round-trip folder, looks/). The library's
 * component is its published one: a change not yet published shows as a difference.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const { pairVariants } = req('../snapshot/spec.cjs');

/* A PNG as Figma exports it (8-bit, RGB or RGBA, not interlaced) to its RGBA pixels. */
export function decodePng(buf) {
  let p = 8, w = 0, h = 0, type = 6; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), kind = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9]; if (data[8] !== 8 || data[12]) throw new Error('only 8-bit, non-interlaced PNGs'); }
    if (kind === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 0; if (!bpp) throw new Error(`PNG colour type ${type}`);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4), line = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      line[i] = (src[i] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0)) & 255;
    }
    for (let x = 0; x < w; x++) { for (let k = 0; k < 3; k++) out[(y * w + x) * 4 + k] = line[x * bpp + k]; out[(y * w + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255; }
    line.copy(prev);
  }
  return { w, h, px: out };
}

/* RGBA pixels to a PNG. */
export function encodePng({ w, h, px }) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (kind, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const kd = Buffer.concat([Buffer.from(kind, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(kd)); return Buffer.concat([l, kd, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1)); for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/* sRGB (0–255) to CIELAB under D65, for a colour distance an eye reads: equal steps of a channel are not equal steps seen. */
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lab = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(lin);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047), y = f(0.2126 * R + 0.7152 * G + 0.0722 * B), z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
/* ΔE*ab (CIE76) between two sRGB colours: 0 the same, 100 black from white. */
export function deltaE(p, q) { const a = lab(p), b = lab(q); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
/* ΔE*ab ≈ 2.3 is a just noticeable difference (Sharma, Digital Color Imaging Handbook, 2003): a pixel apart by more is
   seen apart. A per-channel tolerance of 40/255 passed a one-step grey token change on text (35 a channel). */
export const JND = 2.3;
/* A pixel shows where its alpha passes this: below, on both sides, it is background (a shadow's faint tail one export
   keeps and the other trims), and neither counted nor compared. */
const SHOWS = 40;

/* Two images compared over the larger of their sizes (a pixel only one has differs), over the pixels that show on
   either side, the transparent background left out (a text's pixels are few: a share of the whole image hid a change of
   its colour): the share that differs by more than `threshold` ΔE as it shows over white or over black (its alpha
   applied, so a white pixel differs from none), and an image of where (red over the faded library image). */
export function compare(a, b, { within = false, threshold = JND } = {}) {
  // (`within`: only over the first image's area, where it was cut by a frame around it and shows less than there is)
  const w = within ? a.w : Math.max(a.w, b.w), h = within ? a.h : Math.max(a.h, b.h), px = Buffer.alloc(w * h * 4);
  let off = 0, shown = 0;
  const NONE = [0, 0, 0, 0];
  const at = (img, x, y) => (x < img.w && y < img.h ? img.px.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4) : NONE);
  const over = (p, bg) => [0, 1, 2].map((k) => (p[k] * p[3] + bg * (255 - p[3])) / 255);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = at(a, x, y), q = at(b, x, y), o = (y * w + x) * 4;
    const shows = p[3] > SHOWS || q[3] > SHOWS;
    if (shows) shown++;
    const differs = shows && Math.max(deltaE(over(p, 255), over(q, 255)), deltaE(over(p, 0), over(q, 0))) > threshold;
    if (differs) { off++; px[o] = 230; px[o + 1] = 30; px[o + 2] = 60; px[o + 3] = 255; }
    else { const g = 255 - Math.round((255 - (p[0] + p[1] + p[2]) / 3) * (p[3] / 255) * 0.3); px[o] = px[o + 1] = px[o + 2] = g; px[o + 3] = 255; }
  }
  return { share: shown ? off / shown : 0, sizes: [[a.w, a.h], [b.w, b.h]], diff: { w, h, px } };
}

/* Each variant exported at 1×: the drawn set's in the scratch file, as an instance, and the library's by the same names, as an
   instance of its published component imported by key into the scratch file, else from the library file itself where
   the bridge has it open (a private component, or an import that does not answer). */
const PNG = "{ format: 'PNG', constraint: { type: 'SCALE', value: 1 } }";
const DRAWN = (name, pageName = name) => `
await figma.loadAllPagesAsync();
const page = figma.root.children.find((p) => p.name === ${JSON.stringify(pageName)});
const drawn = page && page.children.find((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === ${JSON.stringify(name)});
if (!drawn) return { error: 'not drawn in this file' };
const out = {};
// (an instance of each, off the canvas, as the library's imported side is: a set that clips would cut what overflows a
// variant, a dropdown's open menu)
for (const d of drawn.type === 'COMPONENT_SET' ? drawn.children : [drawn]) { const i = d.createInstance(); i.x = -100000; try { out[d.name] = figma.base64Encode(await i.exportAsync(${PNG})); } finally { i.remove(); } }
return { variants: out };`;
const FROM_LIBRARY = (id) => `
const set = await figma.getNodeByIdAsync(${JSON.stringify(id)});
if (!set) return { error: 'not in the library file' };
const out = {};
for (const v of set.type === 'COMPONENT_SET' ? set.children : [set]) out[v.name] = figma.base64Encode(await v.exportAsync(${PNG}));
return { variants: out, cut: set.type === 'COMPONENT_SET' && set.clipsContent };`;
const IMPORTED = (key) => `
const lib = await Promise.race([figma.importComponentSetByKeyAsync(${JSON.stringify(key)}).catch(() => figma.importComponentByKeyAsync(${JSON.stringify(key)})).catch(() => null), new Promise((r) => setTimeout(() => r(null), 20000))]);
if (!lib) return { error: 'the library is not open to the bridge, and its component did not import' };
const out = {};
for (const v of lib.type === 'COMPONENT_SET' ? lib.children : [lib]) { const i = v.createInstance(); i.x = -100000; try { out[v.name] = figma.base64Encode(await i.exportAsync(${PNG})); } finally { i.remove(); } }
return { variants: out };`;

async function main() {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const label = opt('--project'), outOpt = opt('--out');
  if (!label) { console.error('usage: looks.mjs --project <label> [components…] [--out <dir>]'); process.exit(2); }
  const where = req('../snapshot/projects.cjs').layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  const scratch = (fs.readFileSync(where.doc, 'utf8').match(/"draw":\s*\{[^}]*"scratch":\s*"([A-Za-z0-9]+)"/) || [])[1];
  if (!scratch) { console.error(`${label}'s library settings name no scratch file (draw.scratch)`); process.exit(2); }
  // the drawing's page as to-figma chose it: apart from the library's own page where the scratch file is the library
  const { drawingPage } = await import('./to-figma.mjs');
  const own = (await import('../parity/project.mjs')).libraryOf(label).libKey === scratch;
  const dir = where.paths.components;
  const folders = args.length ? args : fs.readdirSync(dir).filter((f) => fs.existsSync(path.join(dir, f, 'figma.json'))).sort();
  const out = outOpt || path.join(path.dirname(where.doc), 'round-trip', 'looks');
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (f.endsWith('.png') && (!args.length || args.some((a) => f.startsWith(`${a}--`)))) fs.unlinkSync(path.join(out, f));
  const { serviceFor, figmaExec } = await import('../figma-audit/services.mjs');
  const svc = serviceFor(where.audit);
  const rows = [];
  for (const folder of folders) {
    let spec; try { spec = JSON.parse(fs.readFileSync(path.join(dir, folder, 'figma.json'), 'utf8')); } catch { continue; }
    const run = async (file, code) => { try { return await figmaExec(svc, file, code, 120000); } catch (e) { return { error: String(e.message || e).slice(0, 160) }; } };
    const drawn = await run(scratch, DRAWN(spec.name, drawingPage(spec.name, own)));
    if (!drawn || drawn.error) { rows.push([folder, null, (drawn && drawn.error) || 'no answer']); continue; }
    // an instance of the published component first: a variant exported where it sits in the library's set is cut by
    // the set's frame (an open menu below a dropdown); the library file where the bridge has it open (a private
    // component, an import that does not answer) after
    let lib = spec.key ? await run(scratch, IMPORTED(spec.key)) : null;
    if ((!lib || lib.error) && where.figmaKey && spec.id) lib = await run(where.figmaKey, FROM_LIBRARY(spec.id));
    if (!lib || lib.error) { rows.push([folder, null, (lib && lib.error) || 'no answer']); continue; }
    // paired by their axes, as geometry pairs them (spec.cjs pairVariants): a library variant the drawing lacks is a
    // difference as visible as one drawn wrong
    const { pairs, extra } = pairVariants(Object.keys(lib.variants), Object.keys(drawn.variants), (n) => n);
    const missing = pairs.filter(([, d]) => d == null).map(([l]) => l);
    // a size that differs over nothing visible (a frame with no fill drawn larger) shows no pixel apart: said apart
    let worst = 0, at = '';
    const sized = [];
    for (const name of extra) { worst = 1; at ||= `${name}: no library variant of that name`; }
    if (missing.length) { worst = 1; at ||= `${missing[0]}: not drawn`; }
    for (const [libName, name] of pairs) {
      if (name == null) continue;
      const v = { name, drawn: drawn.variants[name], library: lib.variants[libName] };
      // a library set that clips cuts what overflows its variants (an open menu): compared over what it shows
      const c = compare(decodePng(Buffer.from(v.library, 'base64')), decodePng(Buffer.from(v.drawn, 'base64')), { within: !!lib.cut });
      const slug = `${folder}--${v.name.replace(/[^A-Za-z0-9=]+/g, '-')}`.slice(0, 120);
      if (c.share > 0.01) { fs.writeFileSync(path.join(out, `${slug}.library.png`), Buffer.from(v.library, 'base64')); fs.writeFileSync(path.join(out, `${slug}.drawn.png`), Buffer.from(v.drawn, 'base64')); fs.writeFileSync(path.join(out, `${slug}.diff.png`), encodePng(c.diff)); }
      if (!lib.cut && c.sizes[0].some((x, i) => Math.abs(x - c.sizes[1][i]) > 2)) sized.push(`${v.name} (library ${c.sizes[0].join('×')}, drawn ${c.sizes[1].join('×')})`);
      if (c.share > worst) { worst = c.share; at = `${v.name}${c.sizes[0].join('x') !== c.sizes[1].join('x') ? ` (library ${c.sizes[0].join('×')}${lib.cut ? ', cut by its set' : ''}, drawn ${c.sizes[1].join('×')})` : ''}`; }
    }
    // beside the measure's rows for it (eval.mjs --draw's reading, the contract's and the geometry's), which this checks
    let measured = null; try { const r = JSON.parse(fs.readFileSync(path.join(where.projectDir, 'round-trip', `${folder}.roundtrip.json`), 'utf8')); if (r.geometry) measured = r.rows.length + r.geometry.length; } catch { /* not drawn and read back */ }
    rows.push([folder, worst, at, measured]);
    console.log(`${folder}: ${(worst * 100).toFixed(1)}%${at ? ` — worst ${at}` : ''}${missing.length ? `; library variants not drawn: ${missing.length}` : ''}${sized.length ? `; sized apart: ${sized.length}, e.g. ${sized[0]}` : ''}; ${measured == null ? 'no reading with geometry' : `${measured} row(s)`}`);
  }
  const bad = rows.filter(([, s]) => s == null || s > 0.01);
  console.log(`${label} looks: ${rows.length - bad.length} of ${rows.length} within 1%; images of the rest in ${path.relative(process.cwd(), out)}`);
  for (const [f, s, why] of rows) if (s == null) console.log(`  ${f}: not compared — ${why}`);
  const unseen = rows.filter(([, s, , m]) => s > 0.01 && m === 0).map(([f]) => f);
  if (unseen.length) console.log(`visibly different with no row (a gap in the measure): ${unseen.join(', ')}`);
}

if (process.argv[1] && import.meta.url === `file://${(() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()}`) await main();
