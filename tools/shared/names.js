// A component's name as a person reads it, stated once for the docs site
// (pages import it from here; format.js uses it) and for the parity engine (tools/parity), which imports this file directly: format.js
// reads Vite's import.meta.env and cannot load in plain Node.
//
// Without its folder (Figma's bare `/`, where ` / ` with spaces joins
// siblings: `Stepper - Step item / Vertical` keeps every word) and without a
// leading status marker (figma-standard rule 13).
// With its folder, without the marker: where two folders hold one own name.
// A status marker leads a name, or follows a private part's `_` (figma-standard rule 13: `_🚧 Picker`).
export const fullName = (name) => String(name).replace(/(^|\/)(\s*_?)\s*\p{Extended_Pictographic}[\uFE0F\s]*/gu, '$1$2').trim();
export const displayName = (name) => String(name).replace(/^(?:[^/]+\/(?=\S))+/, '').replace(/^(\s*_?)\s*\p{Extended_Pictographic}[\uFE0F\s]*/u, '$1').trim();

// A variant's name as its prop values: `Size=Large, Left icon=True` → { Size: 'Large', 'Left icon': 'True' }. Figma
// writes the pairs joined by `, `; a part with no `=` is no pair. Derive, the parity engine, the contract tools and the
// docs site each split it their own way (one on a bare `,`, one keeping a part with no `=` as a key).
export const variantValues = (name) => Object.fromEntries(String(name ?? '').split(/,\s*/).filter((p) => p.includes('=')).map((p) => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
