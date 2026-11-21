/*
 * The files a module runs through, for a hash of the code that makes something: eval.mjs's reader hash (from-code's
 * closure) and site.mjs's drawing cache (the generator's closure).
 */
import fs from 'node:fs';
import path from 'node:path';

/* The files a module runs through: its relative imports, static and literal dynamic, and its literal require()s,
   followed transitively. A path built at run time is not followed: the reader's only ones load a project's own files
   (parity/project.mjs its parity settings, external.mjs a repo's components), which selfInputs hashes as the project's. */
export function importClosure(entries, skip = new Set()) {
  const seen = new Set();
  const visit = (f) => {
    if (seen.has(f) || skip.has(f) || !fs.existsSync(f)) return;
    seen.add(f);
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\b(?:require|req)\s*\(\s*|\bcreateRequire\([^)]*\)\s*\(\s*)(['"`])(\.{1,2}\/[^'"`$]+)\1/g)) {
      const to = path.resolve(path.dirname(f), m[2]);
      visit(['', '.js', '.cjs', '.mjs', '.json'].map((x) => to + x).find((x) => fs.existsSync(x) && fs.statSync(x).isFile()) || to);
    }
  };
  for (const e of entries) visit(e);
  return [...seen].sort();
}
