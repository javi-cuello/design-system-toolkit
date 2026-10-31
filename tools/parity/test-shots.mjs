#!/usr/bin/env node
// node tools/parity/test-shots.mjs — from the toolkit root. The pictures a
// run leaves (shots.mjs): read, compared with the kept set, kept, and a
// screen's set beside its frame's.
//
// Review 2026-10-02 item 7: these lived in one project only (a PNG reader and
// pixel diff, a frame-to-page sheet), beside a third copy of the screenshot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { png, pixelDiff, compareKept, keep, frameCells } from './shots.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

/* A w×h RGB PNG of one colour, with a block of another where `block` says,
   each row through a different filter so all five are read. */
const crcTable = Array.from({ length: 256 }, (_, k) => { let c = k; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function encode(w, h, colour, block) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(w * 3);
    for (let x = 0; x < w; x++) {
      const c = block && x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h ? block.colour : colour;
      row.set(c, x * 3);
    }
    const f = y % 5, out = Buffer.alloc(row.length);
    for (let i = 0; i < row.length; i++) {
      const a = i >= 3 ? row[i - 3] : 0, b = y ? rows[y - 1].raw[i] : 0, c = y && i >= 3 ? rows[y - 1].raw[i - 3] : 0;
      const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
      const p = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
      out[i] = (row[i] - p) & 255;
    }
    rows.push({ raw: row, line: Buffer.concat([Buffer.from([f]), out]) });
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows.map((r) => r.line)))), chunk('IEND', Buffer.alloc(0))]);
}
const grey = [200, 200, 200], red = [220, 20, 20];

const p = png(encode(20, 10, grey, { x: 5, y: 2, w: 4, h: 4, colour: red }));
ok('a PNG is read through all five row filters', p.width === 20 && p.height === 10 && p.channels === 3
  && [...p.data.subarray((3 * 20 + 6) * 3, (3 * 20 + 6) * 3 + 3)].join() === red.join() && [...p.data.subarray(0, 3)].join() === grey.join());
ok('a moved block is the share of pixels it moved, a resize says so, and the same picture moved nothing',
  pixelDiff(png(encode(20, 10, grey)), p).changed === 16 / 200 && /size 20×10 → 21×10/.test(pixelDiff(p, png(encode(21, 10, grey))).note)
  && pixelDiff(p, png(encode(20, 10, grey, { x: 5, y: 2, w: 4, h: 4, colour: red }))).changed === 0);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-shots-'));
fs.writeFileSync(path.join(dir, 'a.png'), encode(20, 10, grey));
ok('with nothing kept, compareKept says so rather than passing', compareKept(dir).none === true);
ok('keep makes this run\'s pictures the kept set', keep(dir) === 1 && fs.existsSync(path.join(dir, 'kept', 'a.png')));
fs.writeFileSync(path.join(dir, 'a.png'), encode(20, 10, grey, { x: 0, y: 0, w: 10, h: 10, colour: red }));
fs.writeFileSync(path.join(dir, 'b.png'), encode(20, 10, grey));
ok('a picture that moved and a picture that is new are named; one that did not is not',
  JSON.stringify(compareKept(dir).rows) === JSON.stringify([['a.png', '50.0% of pixels moved'], ['b.png', 'new']]));
fs.writeFileSync(path.join(dir, 'ref.png'), encode(48, 48, grey));

// the comparison's values are the interface settings' (the house's, as a project with none of its own gets them)
const { frameCell, frameCellThreshold } = createRequire(import.meta.url)('../snapshot/projects.cjs').interfaceLimits(null);
ok('the cell and its threshold come from the interface settings, and frameCells refuses to compare without them',
  frameCell === 24 && frameCellThreshold === 18
  && (() => { try { frameCells({ reference: path.join(dir, 'ref.png'), scale: 1, shot: encode(48, 48, grey).toString('base64') }); return false; } catch (e) { return /frameCell and frameCellThreshold/.test(e.message); } })());
const cut = { cell: frameCell, threshold: frameCellThreshold };
const same = frameCells({ reference: path.join(dir, 'ref.png'), scale: 1, shot: encode(48, 48, grey).toString('base64'), ...cut });
const moved = frameCells({ reference: path.join(dir, 'ref.png'), scale: 1, shot: encode(48, 48, grey, { x: 24, y: 0, w: 24, h: 24, colour: red }).toString('base64'), ...cut });
const half = frameCells({ reference: path.join(dir, 'ref.png'), scale: 0.5, shot: encode(96, 96, grey, { x: 0, y: 48, w: 48, h: 48, colour: red }).toString('base64'), ...cut });
const sheet = png(moved.sheet);
ok('a screen beside its frame: regions of the settings\' cell by mean colour, the frame read at its export scale, and a contact sheet design | page | heat',
  same.cols === 2 && same.rows === 2 && same.differ === 0 && moved.differ === 1 && half.cols === 4 && half.rows === 4 && half.differ === 4
  && sheet.width === 48 * 3 + 16 && sheet.height === 48 && [...sheet.data.subarray(((5 * sheet.width) + 48 + 8 + 30) * 3, ((5 * sheet.width) + 48 + 8 + 30) * 3 + 3)].join() === red.join());
ok('a project\'s own cell size is the grid: 12px cells cut the same picture in four each way',
  frameCells({ reference: path.join(dir, 'ref.png'), scale: 1, shot: encode(48, 48, grey).toString('base64'), cell: 12, threshold: frameCellThreshold, sheet: false }).cols === 4);
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
