#!/usr/bin/env node
/*
 * "Same as…": a design prop and a code prop paired by a person, where the code renamed it and no rule could tell.
 * The code audit compares a component's props by name (compareProps), so a renamed prop shows as one Figma has and
 * one only code has; this writes the pair into the component's mapping (`props: { <design prop>: <code prop> }`),
 * and the next run compares them as one. Nothing guesses the pair: a person names both.
 *
 *   node tools/parity/same-as.mjs --project <label> <component folder> <design prop> <code prop>
 *
 * A library built elsewhere keeps its mappings in one JSON file (code.parity.mappings.components.json), written
 * here; a repo whose code follows the design keeps each as a parity.mjs module, which is code: said, not edited.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parityMode } from './project.mjs';
import { contracts } from '../component-contract/official.mjs';

import { realpathSync } from 'node:fs';
/* The mapping with the pair written in; refused, with why, where it cannot be. */
export function sameAs(label, folder, designProp, codeProp) {
  const pm = parityMode(label);
  if (pm.error) return { refused: pm.error };
  if (pm.mode === 'governed') return { refused: `${label}'s mappings are its repo's parity.mjs modules: add \`props: { ${designProp}: '${codeProp}' }\` to ${folder}'s` };
  if (pm.mode !== 'compared' || !pm.mappings) return { refused: `${label} compares no code` };
  const c = contracts(pm.where).find((x) => x.folder === folder);
  if (!c) return { refused: `${folder} is not one of ${label}'s components` };
  if (!(designProp in c.contract.props)) return { refused: `${c.contract.component} has no prop ${designProp}; it has ${Object.keys(c.contract.props).join(', ')}` };
  if (!/^[A-Za-z_$][\w$]*$/.test(codeProp)) return { refused: `${codeProp} is not a prop name` };
  const all = JSON.parse(fs.readFileSync(pm.mappings, 'utf8'));
  if (!all[folder]) return { refused: `${folder} has no mapping in ${pm.mappings}: map its story first` };
  const had = (all[folder].props || {})[designProp];
  // a pair already holding values keeps them, under the new code prop; one ruled missing from the code is not now
  const { missing, ...kept } = had && typeof had === 'object' ? had : {};
  all[folder].props = { ...all[folder].props, [designProp]: Object.keys(kept).length ? { ...kept, code: codeProp } : codeProp };
  fs.writeFileSync(pm.mappings, JSON.stringify(all, null, 2) + '\n');
  return { said: `${c.contract.component}: ${designProp} is ${codeProp} in code, in ${pm.mappings}. Run the code audit again to compare them.` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--project');
  const label = i < 0 ? null : argv.splice(i, 2)[1];
  const [folder, designProp, codeProp] = argv;
  if (!label || !codeProp) { console.error('usage: same-as.mjs --project <label> <component folder> <design prop> <code prop>'); process.exit(2); }
  const r = sameAs(label, folder, designProp, codeProp);
  if (r.refused) { console.error(`same-as: ${r.refused}`); process.exit(1); }
  console.log(r.said);
}
