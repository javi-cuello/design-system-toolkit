// Tier 0 — cheap inventory. Run in each file via figma_execute.
// Returns file name first so the caller can assert it read the intended file.

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const paint = await figma.getLocalPaintStylesAsync();
const text = await figma.getLocalTextStylesAsync();
const effect = await figma.getLocalEffectStylesAsync();
const grid = await figma.getLocalGridStylesAsync();

return {
  file: figma.root.name,
  pages: figma.root.children.map(p => ({ name: p.name, id: p.id })),
  collections: cols.map(c => ({
    name: c.name,
    id: c.id,
    modes: c.modes.map(m => m.name),
    varCount: c.variableIds.length
  })),
  totalVariables: vars.length,
  styles: { paint: paint.length, text: text.length, effect: effect.length, grid: grid.length }
};
