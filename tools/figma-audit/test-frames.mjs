#!/usr/bin/env node
// The plugin socket's frame decoder (frames.mjs), with no service and no Figma.
//   node tools/figma-audit/test-frames.mjs
import assert from "node:assert/strict";
import { decoder } from "./frames.mjs";

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("ok " + name); };

// A client frame: masked, as a browser sends it.
const frame = (text, { op = 1, fin = true } = {}) => {
  const data = Buffer.from(text), mask = Buffer.from([1, 2, 3, 4]);
  const head = data.length < 126 ? Buffer.from([(fin ? 0x80 : 0) | op, 0x80 | data.length])
    : Buffer.concat([Buffer.from([(fin ? 0x80 : 0) | op, 0x80 | 126]), Buffer.from([data.length >> 8, data.length & 255])]);
  return Buffer.concat([head, mask, Buffer.from(data.map((b, i) => b ^ mask[i % 4]))]);
};

ok("a whole message, split across chunks, arrives once and whole", () => {
  const feed = decoder(), f = frame('{"id":1}');
  assert.deepEqual(feed(f.slice(0, 3)), []);
  const out = feed(f.slice(3));
  assert.equal(out.length, 1); assert.equal(out[0].data.toString(), '{"id":1}');
});

ok("fragments are joined in order", () => {
  const out = decoder()(Buffer.concat([frame("ab", { fin: false }), frame("cd", { op: 0 })]));
  assert.deepEqual(out.map((e) => e.data.toString()), ["abcd"]);
});

ok("a frame declaring more than the cap is refused before anything is buffered", () => {
  // 0x7f: a 64-bit length follows, here 2^40
  const head = Buffer.concat([Buffer.from([0x81, 0x80 | 127]), Buffer.from([0, 0, 1, 0, 0, 0, 0, 0])]);
  assert.deepEqual(decoder()(head).map((e) => e.type), ["too_large"]);
});

ok("fragments that add up past the cap are refused, though each is under it", () => {
  const feed = decoder({ max: 10 });
  assert.deepEqual(feed(frame("123456", { fin: false })), []);
  assert.deepEqual(feed(frame("789012", { op: 0, fin: false })).map((e) => e.type), ["too_large"]);
});

ok("a new text frame starts a new message, never counted with an unfinished one", () => {
  const feed = decoder({ max: 10 });
  assert.deepEqual(feed(frame("123456", { fin: false })), []);
  assert.deepEqual(feed(frame("abcdef")).map((e) => e.data.toString()), ["abcdef"]);
});

ok("a ping and a close are reported", () => {
  assert.deepEqual(decoder()(Buffer.concat([frame("p", { op: 9 }), frame("", { op: 8 })])).map((e) => e.type), ["ping", "close"]);
});

console.log(`${n} passed`);
