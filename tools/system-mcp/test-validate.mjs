#!/usr/bin/env node
// tools/system-mcp/validate.mjs: generated code held to the tokens and a contract.
import assert from 'node:assert/strict';
import { validate, unwaived } from './validate.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const tokens = { collections: { Semantic: { modes: ['Light'], values: { Light: { 'Color/Text/Feedback/Danger/primary': '#5e0007', 'Color/Background/Neutral/secondary': '#eeeeee' } } } } };
const chip = { props: { feedback: { type: 'enum', values: ['neutral', 'danger'] } } };
const code = `<Chip feedback="success" />
.chip { color: #5e0007; background: #123456; border-color: var(--color-background-neutral-tertiary); padding: var(--mui-spacing); }
const t = 'Color/Text/Feedback/Danger/primary', u = 'Color/Text/Nope';`;
const f = validate(code, tokens, chip);
ok('a raw colour a token holds names that token; one no token holds is said', f.some((x) => x.found === '#5e0007' && x.use === 'Color/Text/Feedback/Danger/primary') && f.some((x) => x.found === '#123456' && !x.use));
ok("a token or a variable named from one that the library lacks is a finding; a framework's own variable is not ours", f.some((x) => x.found === 'Color/Text/Nope') && f.some((x) => x.found === 'var(--color-background-neutral-tertiary)') && !f.some((x) => /mui-spacing/.test(x.found)) && !f.some((x) => x.found === 'Color/Text/Feedback/Danger/primary'));
ok("a contract prop given a value the contract does not have, with the values it does", f.some((x) => x.kind === 'value not in the contract' && x.found === 'feedback="success"' && x.use === 'neutral | danger'));
ok('clean code is clean', !validate('<Chip feedback="danger" />\nconst c = "Color/Text/Feedback/Danger/primary";', tokens, chip).length);
{
  const lib = ['Button', 'Checkbox', 'Text input'];
  const g = validate(`<button onClick={go}>Save</button>\n<input type="checkbox" />\n<input value={v} />\n<select />\n<Button>Ok</Button>`, tokens, null, lib);
  ok('a raw element the library has a component for names it; one it has none for, and its own components, are left alone',
    g.some((x) => x.found === '<button>' && x.use === 'Button') && g.some((x) => x.found === '<input type="checkbox">' && x.use === 'Checkbox')
    && g.some((x) => x.found === '<input>' && x.use === 'Text input') && !g.some((x) => /select/.test(x.found)) && g.length === 3);
}
ok('a comment line and a fully transparent colour are not findings', !validate(' * Forwarded to the underlying `<button>`.\n// #5e0007\nconst s = { boxShadow: "0 2px 4px 0 rgba(0,0,0,0)" };', tokens, null, ['Button']).length);
{
  // another library's families, in its own words: held to its tokens, and the first library's words are not its
  const own = { collections: { Theme: { modes: ['m'], values: { m: { 'Colour/Surface/raised': '#ffffff', 'Gap/xs': 4 } } } } };
  const h = validate('const a = "Colour/Surface/sunken";\nconst b = "var(--colour-surface-raised) var(--gap-xl) var(--color-text-x)";', own);
  ok("a library's own families are what is held, whatever it calls them", h.some((x) => x.found === 'Colour/Surface/sunken') && h.some((x) => x.found === 'var(--gap-xl)')
    && !h.some((x) => /colour-surface-raised|color-text-x/.test(x.found)) && h.length === 2);
}
{
  // a copy and a lookalike import: the next library release reaches neither
  const lib = ['Button', 'Text input', 'Dialog'];
  const code = `import { Button, TextInput as Field } from './local/ui';\nimport Dialog from '@/design-system/dialog/dialog';\nimport { Icon } from './icons';\nfunction Button() {}\nconst TextInput = () => null;\nconst Card = () => null;`;
  const g = validate(code, tokens, null, lib, { from: ['@/design-system/'] });
  ok("a library component imported from outside the system is said, with where it comes from; the system's own, and a component the library lacks, are not",
    g.some((x) => x.kind === 'component not from the system' && x.found === "Button from './local/ui'") && g.some((x) => x.found === "TextInput from './local/ui'")
    && !g.some((x) => /Dialog|Icon/.test(x.found)) && g.filter((x) => x.kind === 'component not from the system').length === 2);
  ok('a library component defined in the code is a copy, said with or without `from`; a component the library lacks is not',
    validate(code, tokens, null, lib).filter((x) => x.kind === 'component copied').map((x) => x.found).join() === 'Button,TextInput'
    && !validate(code, tokens, null, lib).some((x) => x.kind === 'component not from the system'));
}
{
  const lib = ['Button', 'Text input', 'Link'];
  const code = `import {\n  Card,\n  Button,\n} from './local';\nimport { Local as TextInput } from '../x';\nexport { Link } from './y';\nimport { Button as B } from '@/design-system';\nimport type { Button as T } from './types';\nimport { type Link as L } from './types';`;
  const g = validate(code, tokens, null, lib, { from: ['@/design-system/'] }).map((x) => `${x.found}@${x.line}`);
  ok("an import wrapped over lines, either side of an alias and a re-export are read; the system's barrel and type-only imports are not findings",
    g.join() === "Button from './local'@1,TextInput from '../x'@5,Link from './y'@6");
}
ok('a hidden input is no field: it is not a raw element', !validate('<input type="hidden" name="id" value={id} />', tokens, null, ['Text input']).length);
{
  // the command, as project-check's gate runs it: a built site's api folder, several files, findings as data
  const { spawnSync } = await import('node:child_process');
  const fs = await import('node:fs'), os = await import('node:os'), path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-')), a = path.join(dir, 'a.css'), b = path.join(dir, 'b.css');
  fs.writeFileSync(a, '.x { color: #123456; }'); fs.writeFileSync(b, '.y { color: transparent; }');
  const here = path.dirname(new URL(import.meta.url).pathname);
  const r = spawnSync(process.execPath, [path.join(here, 'validate.mjs'), a, b, '--api', path.join(here, 'fixtures/site/api'), '--json'], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  const out = JSON.parse(r.stdout);
  ok('--api and --json: each finding carries its file, and the exit says there was one', r.status === 1 && out.length === 1 && out[0].file === a && out[0].found === '#123456');
}
{
  const found = [{ file: 'src/a.css', found: '#fff' }, { file: 'src/b.css', found: '#fff' }, { file: 'src/a.css', found: '#ffffff' }];
  const left = unwaived(found, [{ scope: '`validate`', key: 'src/a.css keeps #fff for the print sheet.' }, { scope: 'tokens', key: 'src/b.css #fff' }], (f) => f.file);
  ok('a §6 ruling scoped validate waives only the finding it names whole: its file and what was found; another scope waives nothing',
    left.length === 2 && left.every((f) => !(f.file === 'src/a.css' && f.found === '#fff')));
}
ok('a commented-out import is not read; a live one after a block comment keeps its line',
  validate("// import { Button } from './old-button';\n/*\nimport { Button } from './old';\n*/\nimport { Button } from '@/design-system/button';", { collections: {} }, null, ['Button'], { from: ['@/design-system/'] }).length === 0
  && validate("/* a\nb */\nimport { Button } from './old';", { collections: {} }, null, ['Button'], { from: ['@/design-system/'] })[0].line === 3);
console.log(`${n}/${n} passed`);
