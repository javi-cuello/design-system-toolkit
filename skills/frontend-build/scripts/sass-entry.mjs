#!/usr/bin/env node
/**
 * The Sass entry's components list, generated from the component folders (toolkit-standard §D 23): Sass cannot glob,
 * so the list is written, and a folder decides it, never a hand. Each folder under `components/` beside the entry that
 * holds its own partial (`<name>/_<name>.sass` or `.scss`) is one `@include meta.load-css("components/<name>/<name>")`,
 * in name order, between the two marker lines the scaffold's entry carries; the rest of the entry is the project's.
 *
 *   node sass-entry.mjs <entry>            write the list
 *   node sass-entry.mjs <entry> --check    regenerate beside it and diff (code-standard rule 23); exit 1 when stale
 *
 * @runs: frontend-build's scaffold `bin/css` before it compiles, `bin/css --check` in a project's check.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, realpathSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BEGIN = '// Generated from the component folders by the toolkit\'s sass-entry.mjs: add or remove a folder and run it, never edit these lines.'
export const END = '// End of the generated components list.'

/** The folders under `dir` that hold their own partial, in name order. */
export function componentsIn(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory() && ['.sass', '.scss'].some((ext) => existsSync(join(dir, name, `_${name}${ext}`))))
    .sort()
}

/** The entry with its list between the markers rewritten for `names`; the markers' indentation is the list's. */
export function withList(text, names, { scss = false } = {}) {
  const lines = text.split('\n')
  const begin = lines.findIndex((l) => l.trim() === BEGIN)
  const end = lines.findIndex((l, i) => i > begin && l.trim() === END)
  if (begin < 0 || end < 0) throw new Error(`no generated list: put the two lines\n  ${BEGIN}\n  ${END}\ninside the components layer`)
  const pad = /^\s*/.exec(lines[begin])[0]
  const list = names.map((n) => `${pad}@include meta.load-css("components/${n}/${n}")${scss ? ';' : ''}`)
  return [...lines.slice(0, begin + 1), ...list, ...lines.slice(end)].join('\n')
}

/** The entry `file` as its folders generate it. */
export function generate(file) {
  return withList(readFileSync(file, 'utf8'), componentsIn(join(dirname(file), 'components')), { scss: extname(file) === '.scss' })
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) { console.error('sass-entry: name the entry, such as assets/design-system/index.sass'); process.exit(2) }
  let body
  try { body = generate(file) } catch (e) { console.error(`sass-entry: ${file}: ${e.message}`); process.exit(2) }
  const committed = readFileSync(file, 'utf8')
  if (args.includes('--check')) {
    if (body !== committed) { console.error(`sass-entry: ${file}'s components list is not what its folders generate: run sass-entry.mjs ${file}; a generated list is never edited by hand`); process.exit(1) }
    console.log(`sass-entry: ${file}'s components list matches its folders`)
  } else {
    if (body !== committed) writeFileSync(file, body)
    console.log(`sass-entry: ${file}: ${componentsIn(join(dirname(file), 'components')).length} component(s) listed`)
  }
}
