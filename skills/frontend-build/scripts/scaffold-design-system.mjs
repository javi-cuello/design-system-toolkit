#!/usr/bin/env node
/**
 * Instantiate the design-system shape in a Kirby project.
 *
 * Writes the plugin that turns a component folder into a snippet, the Sass
 * entry with its cascade layers, a starter token set, the gallery workbench,
 * and one worked component so the gallery has something to render on the
 * first run.
 *
 * It writes no file that already exists, and says so. Run it twice and the
 * second run reports what it skipped rather than overwriting work.
 *
 *   node scaffold-design-system.mjs --root ../my-project --vendor acme
 *   node scaffold-design-system.mjs --root . --vendor acme --prefix ds --dry-run
 *
 * --vendor  the plugin's vendor half (`<vendor>/design-system`) and the
 *           config namespace (`<vendor>.designsystem.gallery`). Required.
 * --prefix  the element and snippet prefix: `ds` gives <ds-button> and
 *           snippet('ds/button'). Default `ds`.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync, chmodSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(HERE, '..', 'assets', 'design-system-scaffold')

const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const root = resolve(flag('root', '.'))
const vendor = flag('vendor')
const prefix = flag('prefix', 'ds')
const dryRun = args.includes('--dry-run')

if (!vendor) {
  console.error('--vendor is required (the plugin is registered as <vendor>/design-system)')
  process.exit(1)
}
for (const [name, value, re] of [['vendor', vendor, /^[a-z][a-z0-9-]*$/], ['prefix', prefix, /^[a-z][a-z0-9]*$/]]) {
  if (re.test(value) === false) {
    console.error(`--${name} "${value}" must match ${re}`)
    process.exit(1)
  }
}
if (existsSync(join(root, 'site')) === false) {
  console.error(`${root} has no site/ — that is not a Kirby project root`)
  process.exit(1)
}

// where each source file lands in the project
const target = (rel) =>
  rel.startsWith('plugin/') ? join('site', 'plugins', 'design-system', rel.slice('plugin/'.length))
  : rel.startsWith('design-system/') ? join('assets', rel)
  : rel

const walk = (dir, base = '') =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    const rel = base ? `${base}/${entry}` : entry
    return statSync(full).isDirectory() ? walk(full, rel) : [rel]
  })

const written = []
const skipped = []

for (const rel of walk(SRC)) {
  const dest = join(root, target(rel))
  if (existsSync(dest)) {
    skipped.push(target(rel))
    continue
  }
  const body = readFileSync(join(SRC, rel), 'utf8')
    .replaceAll('__PREFIX__', prefix)
    .replaceAll('__VENDOR__', vendor)
  if (dryRun === false) {
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, body)
    if (rel.startsWith('bin/')) chmodSync(dest, 0o755)
  }
  written.push(target(rel))
}

const label = dryRun ? 'would write' : 'wrote'
console.log(`${label} ${written.length} file(s) into ${relative(process.cwd(), root) || '.'}`)
for (const f of written) console.log(`  + ${f}`)
if (skipped.length) {
  console.log(`kept ${skipped.length} existing file(s) — nothing was overwritten`)
  for (const f of skipped) console.log(`  = ${f}`)
}

console.log(`
Next:
  1. Turn the gallery on in site/config/config.localhost.php — never in the base config:
       '${vendor}.designsystem.gallery' => true,
  2. npm install && bin/css   (commit the package-lock.json the install writes)
  3. Link the stylesheet from your header snippet:
       <?= css('assets/css/main.css') ?>
  4. Open /design-system

Adding a component is adding a folder under assets/design-system/components/
with <name>.php, _<name>.sass and <name>.stories.php; bin/css writes its line
in assets/design-system/index.sass. See assets/design-system/README.md.`)
