/*
 * A variable's name as the token build writes it, for every reader that names
 * a token in CSS: the custom property (`Color/Text/Neutral/primary` →
 * `--color-text-neutral-primary`) and the family its name starts
 * (`--color-`). The build's own two steps, composed once: the export's slug
 * per segment (figma-token-export's dtcg.js `pathFor`) and the house name over
 * that path (frontend-build's build-tokens `nameOf`, which drops the
 * collection). The docs site, the docs MCP's validator, the parity engine's
 * hints and the stylesheet lint each kept their own (one lowercased before
 * splitting camel case, so `textStrong` became `--textstrong` against the
 * build's `--text-strong`, and `-1` lost its minus).
 */
import { createRequire } from 'node:module';
import { nameOf } from '../../skills/frontend-build/scripts/build-tokens.mjs';

const DTCG = createRequire(import.meta.url)('../../skills/figma-token-export/scripts/dtcg.js');

/** The custom property a variable becomes: `--colour-background-ghost`. */
export const cssName = (collection, name) => '--' + nameOf(DTCG.pathFor(collection || '', name));
/** The prefix every custom property of a variable's family shares: `Spacing/16` → `--spacing-`. */
export const cssFamily = (name) => cssName('', String(name).split('/')[0]) + '-';
