// node tools/tokens/test-names.mjs — a variable's CSS name as the build writes it.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cssName, cssFamily, prefixedIn, tokenProperty } from './names.mjs';
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
    'Palette 1': { modes: ['Value'], values: { Value: { 'tag-border': '#000000', 'Spacing/8': 8 } }, alias: {} },
    'Palette 2': { modes: ['Value'], values: { Value: { 'tag-border': '#ffffff', 'Spacing/8': 8 } }, alias: {} },
  }, textStyles: [], paintStyles: [], effects: [] }, dir);
  const kept = prefixedIn(dir);
  ok('the names the build writes with their collection are read from its stored files: only those whose values differ', [...kept].sort().join(',') === 'palette-1\0tag-border,palette-2\0tag-border');
  ok('a binding with its collection recorded is named with it', tokenProperty('tag-border', 'Palette 2', kept).css === '--palette-2-tag-border' && cssName('Palette 2', 'tag-border', kept) === '--palette-2-tag-border');
  ok('…one with none recorded, or two, is missing, never the bare name nor a guess', tokenProperty('tag-border', undefined, kept).missing === 'no collection recorded' && /Palette 1 and Palette 2/.test(tokenProperty('tag-border', ['Palette 1', 'Palette 2'], kept).missing));
  ok('…and a name written once keeps its bare name, whatever is recorded', tokenProperty('Spacing/8', undefined, kept).css === '--spacing-8' && tokenProperty('Spacing/8', 'Palette 1', kept).css === '--spacing-8');
  ok('no stored files: nothing is prefixed', prefixedIn(join(dir, 'none')).size === 0);
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${n} passed`);
