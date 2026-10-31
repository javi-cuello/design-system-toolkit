#!/usr/bin/env node
// tools/docs-mcp/validate.mjs: generated code held to the tokens and a contract.
import assert from 'node:assert/strict';
import { validate } from './validate.mjs';

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
console.log(`${n}/${n} passed`);
