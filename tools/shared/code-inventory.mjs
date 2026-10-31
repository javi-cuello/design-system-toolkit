// What the code has, and how it lines up with what Figma has. One reading,
// for the two that need it: the docs site's Parity page, and the audit's Code
// parity stage, which asks where the unpaired ones might be under another
// name. No project in here: a caller hands in the folder and the names.
import { existsSync, readdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import { compareNames } from './output.mjs';

/**
 * The components under a folder: every folder, at any depth, that holds a
 * file of its own name (`Chip/Chip.tsx`). A folder that only groups others
 * (`Table/` around `TableToolbar/TableToolbar.tsx`) is not one, and the parts
 * inside it are. `null` when the folder is not there, which is not the same
 * as a folder with nothing in it.
 */
export function codeComponents(dir) {
  if (!existsSync(dir)) return null;
  const found = [];
  const walk = (at, rel) => {
    const entries = readdirSync(at, { withFileTypes: true });
    const name = rel.at(-1);
    if (name && entries.some((e) => e.isFile() && parse(e.name).name === name)) found.push({ name, path: rel.join('/') });
    for (const e of entries) if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') walk(join(at, e.name), [...rel, e.name]);
  };
  walk(dir, []);
  return found.sort((a, b) => compareNames(a.name, b.name));
}

// Names compare without case, spacing or punctuation: Figma's "Autocomplete
// input" is the code's `AutocompleteInput`. Nothing looser: `TextArea` and
// "Text area input" resemble each other and are two rows, because a guess
// shown as a pair reads as a fact. Resemblance is the audit's to propose
// (design-code-parity's pairing), as a finding somebody confirms.
const fold = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Figma's component pages against the code's components. A page is in code
 * when the code has a component of its name, or of the name the project says
 * it is built as in its framework (`libraryName(title)`: MUI's `TextField`
 * for "Text input") — the name the code was written to. Several pages may be
 * one component in code, so a pair does not use the code component up.
 */
export function compare(figma, code, libraryName = () => null) {
  const byName = new Map(code.map((c) => [fold(c.name), c]));
  const both = [], figmaOnly = [], matched = new Set();
  for (const page of figma) {
    const own = byName.get(fold(page.title));
    const c = own || byName.get(fold(libraryName(page.title) || ''));
    if (c) { both.push({ page, code: c, sameName: Boolean(own) }); matched.add(c); } else figmaOnly.push(page);
  }
  return { both, figmaOnly, codeOnly: code.filter((c) => !matched.has(c)) };
}
