/*
 * tools/parity/shots.mjs — pictures of what a run measured, part of the
 * design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity, "Pixels are for eyes, never for gates").
 *
 * Every gate is arithmetic on data. These are the two advisory views of what
 * data cannot see — compositing: two paints in one pixel, a ring under an
 * image, a border drawn twice — and they never fail a run:
 *
 *   take(tab, file, win)        a picture of the window as the run left it
 *   compareKept(dir)            each picture against the set kept by the last
 *                               accepted run (`<dir>/kept`), by pixel
 *   keep(dir)                   this run's pictures become the kept set
 *   frameCells(…)               a screen's picture against its frame's own
 *                               picture from the snapshot, by grid cell, and
 *                               the contact sheet: design | page | heat
 *   png(buffer), encodePng(…)  PNGs read and written with zlib alone
 *
 * `run.mjs --shots` calls them. Each project had its own copy of one half:
 * one a screenshotter at a fixed 900×600@2x, the other a PNG reader and
 * pixel diff, a separate pass that photographed every screen again to compare
 * it with the frame, and a third that photographed every state (2026-10-02).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { paintReady, screenshot } from '../shared/cdp.mjs';

/** An 8-bit, non-interlaced RGB or RGBA PNG, as Chrome writes one. */
export function png(buf) {
  let pos = 8, width = 0, height = 0, channels = 4;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error('only 8-bit non-interlaced PNGs are read');
      channels = { 2: 3, 6: 4 }[data[9]];
      if (!channels) throw new Error(`colour type ${data[9]} is not RGB or RGBA`);
    } else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels, out = Buffer.alloc(stride * height);
  // the five PNG filters, undone row by row against the row above
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), o = y * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[o + i - channels] : 0, b = y ? out[o - stride + i] : 0, c = y && i >= channels ? out[o - stride + i - channels] : 0;
      let p = 0;
      if (filter === 1) p = a; else if (filter === 2) p = b; else if (filter === 3) p = (a + b) >> 1;
      else if (filter === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[o + i] = (row[i] + p) & 255;
    }
  }
  return { width, height, channels, data: out };
}

/* The share of pixels whose colour moved by more than antialiasing does
   (a summed channel difference over 48), or a size change. */
export function pixelDiff(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { changed: 1, note: `size ${a.width}×${a.height} → ${b.width}×${b.height}` };
  let changed = 0;
  const n = a.width * a.height;
  for (let i = 0; i < n; i++) {
    const pa = i * a.channels, pb = i * b.channels;
    if (Math.abs(a.data[pa] - b.data[pb]) + Math.abs(a.data[pa + 1] - b.data[pb + 1]) + Math.abs(a.data[pa + 2] - b.data[pb + 2]) > 48) changed++;
  }
  return { changed: changed / n };
}

/** The window as the run left it, from where it is scrolled, at most 4000 tall, once its images in that clip have painted. */
export async function take(tab, file, [w, h]) {
  const top = await tab.evaluate('Math.round(window.scrollY)');
  const height = Math.min(h, 4000);
  await paintReady(tab, top, height);
  const data = await screenshot(tab, { x: 0, y: top, width: w, height });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  return data;
}

const KEPT = 'kept';
const pictures = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.png')) : []);

/* Each picture in `dir` against the kept one of the same name: `[file, note]`
   for every one that is new or moved past 0.2% of its pixels. */
export function compareKept(dir) {
  const kept = path.join(dir, KEPT);
  if (!fs.existsSync(kept)) return { rows: [], total: pictures(dir).length, none: true };
  const rows = [];
  const current = pictures(dir);
  for (const f of current) {
    const was = path.join(kept, f);
    if (!fs.existsSync(was)) { rows.push([f, 'new']); continue; }
    const d = pixelDiff(png(fs.readFileSync(was)), png(fs.readFileSync(path.join(dir, f))));
    if (d.changed > 0.002) rows.push([f, d.note || `${(d.changed * 100).toFixed(1)}% of pixels moved`]);
  }
  return { rows, total: current.length, none: false };
}

/** This run's pictures become the kept set, and only these. */
export function keep(dir) {
  const kept = path.join(dir, KEPT);
  fs.rmSync(kept, { recursive: true, force: true });
  fs.mkdirSync(kept, { recursive: true });
  const current = pictures(dir);
  for (const f of current) fs.copyFileSync(path.join(dir, f), path.join(kept, f));
  return current.length;
}

/* An RGB PNG of `width`×`height` from a buffer of RGB triples, rows unfiltered. */
const CRC = Array.from({ length: 256 }, (_, k) => { let c = k; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const head = Buffer.alloc(4); head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, tail]);
};
export function encodePng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/*
 * A screen's picture against its frame's, as regions. Never as pixels: Figma
 * and Chrome rasterise text, shadows and images differently, and a pixel
 * comparison between them is noise. Both are cut into one grid sized from the
 * design (the frame's picture is at its export scale, the page's at CSS
 * pixels) and each cell's mean colour compared, which is blind to a
 * half-pixel of hinting and loud about a shape in the wrong place, an image
 * upside down or a block of text that grew a line — and arithmetically blind
 * to a hairline, which is acceptable in an eye-pointer and disqualifying in a
 * gate. A cell is `cell` CSS pixels of the page, and it differs past
 * `threshold` levels on a channel: values, so they are the interface
 * settings' `frameCell` and `frameCellThreshold` (audit-settings.json), which
 * run.mjs passes; with either absent nothing is compared.
 * Arithmetic in Node, over the PNGs: the browser version passed both pictures
 * into the page being measured, and a full-page pair broke the DevTools
 * connection mid-run. Returns `{ cols, rows, differ, sheet }`, `sheet` a PNG
 * of design | page | page with the differing cells in red.
 */
export function frameCells({ reference, scale, shot, cell: CELL, threshold: THRESHOLD, sheet = true }) {
  if (!(CELL > 0) || !(THRESHOLD >= 0)) throw new Error('frameCells needs the interface settings\' frameCell and frameCellThreshold (audit-settings.json)');
  const design = png(fs.readFileSync(reference)), page = png(Buffer.from(shot, 'base64'));
  const w = Math.round(design.width / scale), h = Math.round(design.height / scale);
  const cols = Math.max(1, Math.floor(w / CELL)), rows = Math.max(1, Math.floor(Math.min(h, page.height) / CELL));
  // the mean colour of each cell, the picture's own pixels over the grid
  const grid = (img, spanH) => {
    const cw = img.width / cols, chh = spanH / rows, out = new Float64Array(cols * rows * 3);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x0 = Math.floor(i * cw), x1 = Math.max(x0 + 1, Math.floor((i + 1) * cw)), y0 = Math.floor(j * chh), y1 = Math.max(y0 + 1, Math.floor((j + 1) * chh));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1 && y < img.height; y++) for (let x = x0; x < x1 && x < img.width; x++) {
        const o = (y * img.width + x) * img.channels; r += img.data[o]; g += img.data[o + 1]; b += img.data[o + 2]; n++;
      }
      out.set([r / (n || 1), g / (n || 1), b / (n || 1)], (j * cols + i) * 3);
    }
    return out;
  };
  const A = grid(design, Math.min(design.height, rows * CELL * scale)), B = grid(page, Math.min(page.height, rows * CELL));
  const differ = [];
  for (let k = 0; k < cols * rows; k++) if (Math.max(...[0, 1, 2].map((c) => Math.abs(A[k * 3 + c] - B[k * 3 + c]))) > THRESHOLD) differ.push(k);
  let out = null;
  if (sheet) {
    const gut = 8, ch = Math.min(h, rows * CELL), W = w * 3 + gut * 2;
    const rgb = Buffer.alloc(W * ch * 3, 0x88);
    const draw = (img, srcH, left) => {
      for (let y = 0; y < ch; y++) for (let x = 0; x < w; x++) {
        const sx = Math.min(img.width - 1, Math.floor((x * img.width) / w)), sy = Math.min(img.height - 1, Math.floor((y * srcH) / ch));
        const o = (sy * img.width + sx) * img.channels;
        rgb.set([img.data[o], img.data[o + 1], img.data[o + 2]], (y * W + left + x) * 3);
      }
    };
    draw(design, Math.min(design.height, ch * scale), 0);
    draw(page, Math.min(page.height, ch), w + gut);
    draw(page, Math.min(page.height, ch), (w + gut) * 2);
    for (const k of differ) {
      const cx = (w + gut) * 2 + (k % cols) * CELL, cy = Math.floor(k / cols) * CELL;
      for (let y = cy; y < Math.min(cy + CELL, ch); y++) for (let x = cx; x < Math.min(cx + CELL, W); x++) {
        const o = (y * W + x) * 3, edge = y === cy || x === cx || y === cy + CELL - 1 || x === cx + CELL - 1, a = edge ? 0.9 : 0.4;
        rgb.set([Math.round(rgb[o] * (1 - a) + 255 * a), Math.round(rgb[o + 1] * (1 - a)), Math.round(rgb[o + 2] * (1 - a))], o);
      }
    }
    out = encodePng(W, ch, rgb);
  }
  return { cols, rows, differ: differ.length, sheet: out };
}
