#!/usr/bin/env node
// build-tokens, run through the real Style Dictionary over a small DTCG folder.
// Style Dictionary is injected, so this borrows the copy a registered repo has
// installed, and skips (saying so) where none has.
// Run: node --test tools/tokens/test-build-tokens.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { buildTokens, shadowCss } from './build-tokens.mjs';

// A registered project repo with Style Dictionary installed lends it, read from the projects the toolkit knows
// (as test-check.mjs does): this read ~/Projects, a folder only one machine has, and skipped silently elsewhere.
// With no project registered (a fresh clone, CI) the cases skip and say so; with projects and no donor, it fails.
const repos = createRequire(import.meta.url)('../snapshot/projects.cjs').repos();
const donor = repos.map((r) => join(r.dir, 'package.json')).find((p) => existsSync(join(p, '..', 'node_modules', 'style-dictionary')));
if (!donor && repos.length) {
  console.error('no registered project repo has style-dictionary installed: run `pnpm install` in one of them, or register a repo that has it.');
  process.exit(1);
}
const SD = donor && (await import(pathToFileURL(createRequire(donor).resolve('style-dictionary')).href)).default;
const skip = !SD && 'no project repo is registered, so there is no style-dictionary to borrow';

const colour = (hex) => ({ $type: 'color', $value: hex });
const dim = (n) => ({ $type: 'dimension', $value: { value: n, unit: 'px' } });

/** A DTCG folder: { collection: { mode: tree } } → <dir>/<collection>/<mode>.json */
function folder(sets) {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  for (const [c, modes] of Object.entries(sets)) {
    mkdirSync(join(dir, c));
    for (const [m, tree] of Object.entries(modes)) writeFileSync(join(dir, c, `${m}.json`), JSON.stringify({ [c]: tree }));
  }
  return dir;
}
const build = (sets) => buildTokens(SD, { tokens: folder(sets), out: '', write: false }).then((f) => Object.fromEntries(f));

const LIBRARY = {
  primitive: { value: {
    palette: { blue: { 600: colour('#2233cc') }, grey: { 12: colour('#161616'), 1: colour('#f5f5f5') } },
    space: { 2: dim(8) },
    radius: { md: dim(8) },
    breakpoint: { sm: dim(640), md: dim(1024) },
  } },
  semantic: {
    light: { text: { strong: { $type: 'color', $value: '{primitive.palette.grey.12}' }, link: { $type: 'color', $value: '{primitive.palette.blue.600}' } } },
    dark: { text: { strong: { $type: 'color', $value: '{primitive.palette.grey.1}' }, link: { $type: 'color', $value: '{primitive.palette.blue.600}' } } },
  },
  type: {
    mobile: { body: { size: dim(16) } },
    desktop: { body: { size: dim(18) } },
  },
  'text-style': { value: {
    body: { $type: 'typography', $value: { fontFamily: 'Inter', fontWeight: 400, fontSize: '{type.body.size}', lineHeight: 1.5, letterSpacing: { value: 0, unit: 'px' } } },
  } },
};

test('an alias stays a reference, named by its path without the collection', { skip }, async () => {
  const css = (await build(LIBRARY))['_tokens.scss'];
  assert.match(css, /--text-link: var\(--palette-blue-600\);/);
  assert.doesNotMatch(css, /--text-link: #2233cc/);
  assert.doesNotMatch(css, /--semantic-|--primitive-/);
});

test('Light is the base, Dark is the attribute and the unchosen system preference', { skip }, async () => {
  const css = (await build(LIBRARY))['_tokens.scss'];
  assert.match(css, /:root \{[^}]*--text-strong: var\(--palette-grey-12\)/);
  assert.match(css, /@media screen \{\s*\[data-theme="dark"\] \{[^}]*--text-strong: var\(--palette-grey-1\)/);
  assert.match(css, /@media screen and \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{[^}]*--text-strong: var\(--palette-grey-1\)/);
});

test('lengths are rem except the ones that must not scale; colours are untouched', { skip }, async () => {
  const css = (await build(LIBRARY))['_tokens.scss'];
  assert.match(css, /--space-2: 0\.5rem;/);
  assert.match(css, /--radius-md: 8px;/);
  assert.match(css, /--palette-blue-600: #2233cc;/);
});

test('Mobile is the base and Desktop switches at the md breakpoint, which is Sass', { skip }, async () => {
  const out = await build(LIBRARY);
  assert.match(out['_tokens.scss'], /@media \(min-width: 64rem\) \{\s*:root \{\s*--body-size: 1\.125rem;/);
  assert.doesNotMatch(out['_tokens.scss'], /--breakpoint-/);
  assert.match(out['_breakpoints.scss'], /\$sm: 40rem;/);
  assert.match(out['_breakpoints.scss'], /@mixin from\(\$bp\)/);
});

test('a text style is its fields, a bound field stays a reference, and the mixin applies it', { skip }, async () => {
  const out = await build(LIBRARY);
  const css = out['_tokens.scss'];
  assert.match(css, /--body-font-family: "Inter", system-ui, sans-serif;/);
  assert.match(css, /--body-font-size: var\(--body-size\);/);
  assert.match(css, /--body-letter-spacing: 0rem;|--body-letter-spacing: 0px;/);
  assert.doesNotMatch(css, /--body: /, 'no font shorthand');
  assert.match(out['_text-styles.scss'], /@mixin text-style\(\$name\)/);
  assert.match(out['_text-styles.scss'], /1 styles: body/);
});

test('two paths that become one property fail the build', { skip }, async () => {
  const clash = { ...LIBRARY, spacing: { value: { space: { 2: dim(12) } } } };
  await assert.rejects(build(clash), /--space-2/);
});

test('an alias to nothing fails the build rather than writing var() to nothing', { skip }, async () => {
  const broken = { ...LIBRARY, semantic: { light: { text: { strong: { $type: 'color', $value: '{primitive.palette.grey.99}' } } }, dark: { text: { strong: { $type: 'color', $value: '{primitive.palette.grey.1}' } } } } };
  await assert.rejects(build(broken));
});

test('a responsive mode with no breakpoint to switch at fails the build', { skip }, async () => {
  const { breakpoint, ...rest } = LIBRARY.primitive.value;
  await assert.rejects(build({ ...LIBRARY, primitive: { value: rest } }), /needs Breakpoint\/md/);
});

test('a diagonal gradient is a corner keyword, and a bound stop stays a reference', { skip }, async () => {
  const withGradient = { ...LIBRARY, 'color-style': { value: { hero: { $type: 'gradient', $extensions: { 'com.figma': { angle: 135 } }, $value: [{ color: '{primitive.palette.blue.600}', position: 0 }, { color: '#ffffff', position: 1 }] } } } };
  const css = (await build(withGradient))['_tokens.scss'];
  assert.match(css, /--hero: linear-gradient\(to bottom right, var\(--palette-blue-600\) 0%, #ffffff 100%\);/);
});

test('a mode holding nothing CSS can carry writes no block and does not stop the build', { skip }, async () => {
  const withEmpty = { ...LIBRARY, sidebar: { 'no-collapsed': {}, 'yes-collapsed': {} } };
  const css = (await build(withEmpty))['_tokens.scss'];
  assert.doesNotMatch(css, /data-sidebar/);
  assert.match(css, /--text-link:/);
});

test('a collection named for breakpoints is Sass too, never custom properties', { skip }, async () => {
  const out = await build({ ...LIBRARY, '05-breakpoints': { value: { tablet: dim(1024) } }, '6-breakpoints': { value: { breakpoint: { xl: dim(1280) } } } });
  assert.match(out['_breakpoints.scss'], /\$tablet: 64rem;/);
  assert.match(out['_breakpoints.scss'], /\$xl: 80rem;/, 'a Breakpoint/ group inside a Breakpoints collection is named by the group');
  assert.doesNotMatch(out['_tokens.scss'], /--tablet:/);
});

test('shadowCss is the box-shadow the build writes, inset and layers included', () => {
  const colour = { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 };
  const layer = (x, y, blur, spread, inset) => ({ color: colour, offsetX: { value: x, unit: 'px' }, offsetY: { value: y, unit: 'px' }, blur: { value: blur, unit: 'px' }, spread: { value: spread, unit: 'px' }, ...(inset && { inset: true }) });
  assert.equal(shadowCss(layer(0, 2, 4, 0)), '0px 2px 4px 0px rgb(0 0 0 / 0.1)');
  assert.equal(shadowCss([layer(0, 0, 0, 1, true), layer(0, 4, 8, -2)]), 'inset 0px 0px 0px 1px rgb(0 0 0 / 0.1), 0px 4px 8px -2px rgb(0 0 0 / 0.1)');
});

test('a shadow with bound members keeps its literal members in px', { skip }, async () => {
  const lib = {
    effect: { value: { position: { 2: dim(2) }, spread: { 1: dim(1) } } },
    'effect-style': { value: { card: { raised: { $type: 'shadow', $value: {
      color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
      offsetX: { value: 0, unit: 'px' }, offsetY: '{effect.position.2}', blur: { value: 4, unit: 'px' }, spread: '{effect.spread.1}',
    } } } } },
  };
  const css = (await build(lib))['_tokens.scss'];
  const line = css.split('\n').filter((l) => /card-raised|spread-1/.test(l)).join('\n');
  assert.match(css, /--spread-1: 1px;/, 'a spread is shadow geometry, px like blur and offset');
  assert.doesNotMatch(css, /--card-raised:[^;]*0\.0625/, line);
  assert.match(css, /--card-raised: [^;]*(var\(--spread-1\)|1px) rgb\(0 0 0 \/ 0\.1\);/, line);
});

test('a shadow names each bound member in its own slot, even where values coincide', { skip }, async () => {
  const lib = {
    effect: { value: { position: { 0: dim(0) }, blur: { 0: dim(0) }, spread: { 0: dim(0) } } },
    shade: { value: { soft: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 } } } },
    'effect-style': { value: { card: { flat: { $type: 'shadow', $value: [
      { color: '{shade.soft}', offsetX: { value: 0, unit: 'px' }, offsetY: '{effect.position.0}', blur: '{effect.blur.0}', spread: '{effect.spread.0}' },
      { color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 }, offsetX: '{effect.spread.0}', offsetY: { value: 0, unit: 'px' }, blur: { value: 0, unit: 'px' }, spread: { value: 0, unit: 'px' }, inset: true },
    ] } } } },
  };
  const css = (await build(lib))['_tokens.scss'];
  const line = css.split('\n').find((l) => /--card-flat:/.test(l)) || css;
  assert.equal(line.trim(), '--card-flat: 0px var(--position-0) var(--blur-0) var(--spread-0) var(--soft), inset var(--spread-0) 0px 0px 0px rgb(0 0 0 / 0.1);');
});
