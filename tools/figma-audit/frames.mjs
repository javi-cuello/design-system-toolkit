// WebSocket frames from the plugin, decoded into whole messages (server.mjs).
//
// A message is capped. The length a frame declares was trusted, so a socket
// that declared a huge one, or never sent the last of its fragments, had the
// service buffer whatever it streamed for as long as it streamed. Nothing past
// the cap could be used anyway: V8 cannot make a string longer than 2^29
// characters, which is what JSON.parse is handed.
export const MAX_MESSAGE = 2 ** 29;

// `feed(chunk)` answers the events the chunk completes, in order:
// { type: "text", data } for a whole text message, "ping" with its data,
// "pong" (the answer to a ping the service sent), "close", or "too_large" —
// after which the socket is to be dropped.
export function decoder({ max = MAX_MESSAGE } = {}) {
  let buf = Buffer.alloc(0);
  let frag = null;                   // partial text message across fragments
  return (chunk) => {
    const out = [];
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) break;
      const op = buf[0] & 0x0f, fin = (buf[0] & 0x80) !== 0, masked = buf[1] & 0x80;
      let len = buf[1] & 0x7f, p = 2;
      if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); p = 4; }
      else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); p = 10; }
      // only a continuation adds to the message before it; a new text frame starts one
      if (len + (op === 0 && frag ? frag.length : 0) > max) { buf = Buffer.alloc(0); frag = null; out.push({ type: "too_large" }); return out; }
      let mask = null;
      if (masked) { if (buf.length < p + 4) break; mask = buf.slice(p, p + 4); p += 4; }
      if (buf.length < p + len) break;
      const data = Buffer.from(buf.slice(p, p + len));
      if (mask) for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
      buf = buf.slice(p + len);

      if (op === 8) { out.push({ type: "close" }); return out; }
      if (op === 9) { out.push({ type: "ping", data }); continue; }
      if (op === 10) { out.push({ type: "pong" }); continue; }

      // Reassemble fragments. Opcode 0 continues the previous frame and FIN
      // marks the last; dropping either loses exactly the large payloads this
      // service exists to carry.
      if (op === 1 || op === 0) {
        frag = op === 1 ? data : Buffer.concat([frag || Buffer.alloc(0), data]);
        if (!fin) continue;
      } else continue;
      out.push({ type: "text", data: frag });
      frag = null;
    }
    return out;
  };
}
