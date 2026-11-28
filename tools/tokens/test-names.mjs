// node tools/tokens/test-names.mjs — a variable's CSS name as the build writes it.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { cssName, cssFamily, prefixedIn, tokenProperty, slugsOf } from './names.mjs';
import { writeDtcg } from './from-snapshot.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
ok('a variable becomes its path less the collection, kebab-cased', cssName('Semantic', 'Color/Text/Neutral/primary') === '--color-text-neutral-primary');
ok('camel case is split as the build splits it, not lowercased first', cssName('Semantic', 'Color/textStrong') === '--color-text-strong');
ok('a leading minus is kept, as the export keeps it', cssName('Primitives', 'Spacing/-1') === '--spacing-minus-1');
ok('the collection never reaches the name', cssName('', 'Spacing/16') === cssName('Anything', 'Spacing/16'));
ok('a family is its first segment as the build writes it', cssFamily('Corner radius/4') === '--corner-radius-' && cssFamily('Spacing') === '--spacing-');

// one name two collections hold at different values: the build writes each with its collection, and a reader names a
// binding by the collection its spec recorded, from the same stored files (code-standard rule 52)
{
  const dir = mkdtempSync(join(tmpdir(), 'names-'));
  writeDtcg({ _meta: { file: 'x', fileId: 'x' }, collections: {
    'Shades 1': { modes: ['Value'], values: { Value: { 'pill-edge': '#000000', 'Spacing/8': 8 } }, alias: {} },
    'Shades 2': { modes: ['Value'], values: { Value: { 'pill-edge': '#ffffff', 'Spacing/8': 8 } }, alias: {} },
    Other: { modes: ['Value'], values: { Value: { 'Spacing/4': 4 } }, alias: {} },
  }, textStyles: [], paintStyles: [], effects: [] }, dir);
  const kept = prefixedIn(dir);
  ok('the names the build writes with their collection are read from its stored files: only those whose values differ', [...kept].sort().join(',') === 'shades-1\0pill-edge,shades-2\0pill-edge');
  ok('a binding with its collection recorded is named with it', tokenProperty('pill-edge', 'Shades 2', kept).css === '--shades-2-pill-edge' && cssName('Shades 2', 'pill-edge', kept) === '--shades-2-pill-edge');
  ok('…one with none recorded, or two, is missing, never the bare name nor a guess', tokenProperty('pill-edge', undefined, kept).missing === 'no collection recorded' && /Shades 1 and Shades 2/.test(tokenProperty('pill-edge', ['Shades 1', 'Shades 2'], kept).missing));
  ok('…one recorded from a collection the build does not write it from is missing too, never the bare name', /^Other, which the build does not write it from$/.test(tokenProperty('pill-edge', 'Other', kept).missing));
  ok('…and a name written once keeps its bare name, whatever is recorded', tokenProperty('Spacing/8', undefined, kept).css === '--spacing-8' && tokenProperty('Spacing/8', 'Shades 1', kept).css === '--spacing-8');
  ok('no stored files: nothing is prefixed', prefixedIn(join(dir, 'none')).size === 0);
  rmSync(dir, { recursive: true, force: true });
}
// another library's collection that slugs like a local one is numbered by the build; holding a name the local one holds
// at another value, each is written with its collection, and a reader names a binding recorded in it by the same
// numbering (slugsOf, the build's own dtcg.js slugsOf), never by its plain slug
{
  const dir = mkdtempSync(join(tmpdir(), 'names-'));
  const snap = { _meta: { file: 'x', fileId: 'x' }, collections: {
    '🌮 Shades': { remote: true, modes: ['Value'], values: { Value: { 'pill-edge': '#ff0000', 'Accent/strong': '#ff0000' } }, alias: {} },
    Shades: { modes: ['Value'], values: { Value: { 'pill-edge': '#000000' } }, alias: {} },
  }, textStyles: [], paintStyles: [], effects: [] };
  writeDtcg(snap, dir);
  const slugs = slugsOf(snap), kept = prefixedIn(dir);
  ok('the build writes a numbered collection under the slug slugsOf gives the readers', slugs['🌮 Shades'] === 'shades-2' && readdirSync(dir).includes('shades-2') && JSON.stringify(slugsOf(snap, true)) === JSON.stringify({ '🌮 Shades': 'shades-2' }));
  ok('…keeps another library\'s copy at another value, with its collection', [...kept].sort().join(',') === 'shades\0pill-edge,shades-2\0pill-edge');
  ok('…and a binding recorded in it is named by that slug, not the plain one', tokenProperty('pill-edge', '🌮 Shades', kept, slugs).css === '--shades-2-pill-edge' && tokenProperty('pill-edge', 'Shades', kept, slugs).css === '--shades-pill-edge');
  rmSync(dir, { recursive: true, force: true });
}
// another library's copy the build left out (the same as a local one, while a second local one differs): a binding
// recorded to the copy names the property the build writes from the local one that holds it, never missing
{
  const dir = mkdtempSync(join(tmpdir(), 'names-'));
  const snap = { _meta: { file: 'x', fileId: 'x' }, collections: {
    'Shades 1': { modes: ['Value'], values: { Value: { 'pill-edge': '#000000' } }, alias: {} },
    'Shades 2': { modes: ['Value'], values: { Value: { 'pill-edge': '#ffffff' } }, alias: {} },
    Brand: { remote: true, modes: ['Value'], values: { Value: { '🌮 pill-edge': '#000000', Accent: '#ff0000' } }, alias: {} },
  }, textStyles: [], paintStyles: [], effects: [] };
  writeDtcg(snap, dir);
  const slugs = slugsOf(snap), kept = prefixedIn(dir);
  ok('the build leaves the copy out and writes the two local ones with their collection', [...kept].sort().join(',') === 'shades-1\0pill-edge,shades-2\0pill-edge' && !readdirSync(join(dir, 'brand')).some((f) => /pill/.test(f)));
  ok('…and a binding recorded to the copy is named from the one that holds it', tokenProperty('🌮 pill-edge', 'Brand', kept, slugs).css === '--shades-1-pill-edge');
  ok('…which a library\'s settings keep too', slugsOf(snap, true)['Brand\0🌮 pill-edge'] === 'shades-1');
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${n} passed`);
