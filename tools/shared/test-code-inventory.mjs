#!/usr/bin/env node
// What counts as a component in code, and how a Figma name meets a code name.
//
//   node tools/shared/test-code-inventory.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { codeComponents, compare } from './code-inventory.mjs';

const tree = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'code-inventory-'));
  for (const f of files) { mkdirSync(join(root, f, '..'), { recursive: true }); writeFileSync(join(root, f), ''); }
  return root;
};

test('a component is a folder holding a file of its own name, at any depth', () => {
  const root = tree([
    'Chip/Chip.tsx', 'Chip/Chip.types.ts', 'Chip/__stories__/Chip.stories.tsx',
    'Table/index.ts', 'Table/hooks/useTable.ts', 'Table/TableToolbar/TableToolbar.tsx',
    'assets/drop-files.json', 'index.ts',
  ]);
  assert.deepEqual(codeComponents(root), [{ name: 'Chip', path: 'Chip' }, { name: 'TableToolbar', path: 'Table/TableToolbar' }]);
});

test('a folder that is not there is null, not an empty list', () => {
  assert.equal(codeComponents(join(tmpdir(), 'code-inventory-no-such-folder')), null);
  assert.deepEqual(codeComponents(tree(['index.ts'])), []);
});

test('names meet without case, spacing or punctuation, and no looser', () => {
  const figma = [{ title: 'Autocomplete input' }, { title: 'FAB' }, { title: 'Sidebar (Secondary)' }, { title: 'Text area input' }];
  const code = [{ name: 'AutocompleteInput' }, { name: 'Fab' }, { name: 'SidebarSecondary' }, { name: 'TextArea' }, { name: 'Box' }];
  const r = compare(figma, code);
  assert.deepEqual(r.both.map((b) => [b.page.title, b.code.name]), [['Autocomplete input', 'AutocompleteInput'], ['FAB', 'Fab'], ['Sidebar (Secondary)', 'SidebarSecondary']]);
  // a similar name is not the same component: each keeps its own row
  assert.deepEqual(r.figmaOnly.map((p) => p.title), ['Text area input']);
  assert.deepEqual(r.codeOnly.map((c) => c.name), ['TextArea', 'Box']);
});

test('a page is in code under its own name or the name the project says it is built as', () => {
  const figma = ['Search input', 'Text input', 'Date input', 'Spinner', 'Org switcher', 'Toast'].map((title) => ({ title }));
  const code = ['SearchInput', 'TextField', 'CircularProgress', 'Tab'].map((name) => ({ name }));
  const lib = { 'Search input': 'TextField', 'Text input': 'TextField', 'Date input': 'TextField', Spinner: 'CircularProgress', 'Org switcher': null, Toast: 'Snackbar' };
  const r = compare(figma, code, (n) => lib[n]);
  assert.deepEqual(r.both.map((b) => [b.page.title, b.code.name]),
    // its own name first; two pages may be the one component in code
    [['Search input', 'SearchInput'], ['Text input', 'TextField'], ['Date input', 'TextField'], ['Spinner', 'CircularProgress']]);
  assert.deepEqual(r.both.map((b) => b.sameName), [true, false, false, false]);
  assert.deepEqual(r.figmaOnly.map((p) => p.title), ['Org switcher', 'Toast']);
  assert.deepEqual(r.codeOnly.map((c) => c.name), ['Tab']);
});
