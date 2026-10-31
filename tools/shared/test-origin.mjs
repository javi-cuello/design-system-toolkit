// node tools/shared/test-origin.mjs — the Figma origin check both local services use.
import assert from 'node:assert/strict';
import { isFigmaOrigin } from './origin.mjs';
for (const o of ['https://figma.com', 'https://www.figma.com', 'https://embed.figma.com']) assert.ok(isFigmaOrigin(o), o);
for (const o of ['https://evilfigma.com', 'https://figma.com.evil.example', 'https://evil.example', 'null', undefined, '']) assert.ok(!isFigmaOrigin(o), String(o));
console.log('9 passed');
