// Tier 1 — variables and styles manifest. Run in each file via figma_execute.
// Compare fileHash first. Only descend to perCollection / perVar if it differs.
// To read the fields of the variables whose hashes differ, run it again with
//   const VARS = ['Collection/name', …];
// prepended: it then also returns `bodies`, each listed variable's fields, for report.mjs.

function h(s){ let x=5381; for(let i=0;i<s.length;i++){ x=((x*33)^s.charCodeAt(i))>>>0; } return x.toString(16); }
// Scopes and code syntax are sets: Figma's order is not part of the variable.
function scopesOf(v){ return [...(v.scopes||[])].sort(); }
function syntaxOf(v){ const c=v.codeSyntax||{}, o={}; Object.keys(c).sort().forEach(k => o[k]=c[k]); return o; }
function r(n){ return typeof n==='number' ? Math.round(n*10000)/10000 : n; }

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const byId = {}; vars.forEach(v => byId[v.id] = v);
const colById = {}; cols.forEach(c => colById[c.id] = c);

// Aliases resolve to the target's NAME, not its id, so the comparison survives id differences.
function fmt(val){
  if (val && val.type === 'VARIABLE_ALIAS'){ const t = byId[val.id]; return t ? '->'+t.name : '->EXTERNAL'; }
  if (val && typeof val === 'object' && 'r' in val){
    return 'rgba(' + [r(val.r),r(val.g),r(val.b),r(val.a===undefined?1:val.a)].join(',') + ')';
  }
  return JSON.stringify(val);
}

const rows = vars.map(v => {
  const c = colById[v.variableCollectionId];
  const vals = (c ? c.modes : []).map(m => m.name+'='+fmt(v.valuesByMode[m.modeId])).join(';');
  const fields = {
    type: v.resolvedType, scopes: scopesOf(v), codeSyntax: syntaxOf(v),
    description: v.description||'', hidden: !!v.hiddenFromPublishing, values: vals
  };
  return {
    key: (c ? c.name : '?') + '/' + v.name,
    fields,
    body: [
      v.resolvedType,
      scopesOf(v).join('+'),
      JSON.stringify(syntaxOf(v)),
      v.description||'',
      v.hiddenFromPublishing ? 1 : 0,
      vals
    ].join('|')
  };
}).sort((a,b) => a.key < b.key ? -1 : 1);

const perVar = {}; rows.forEach(x => perVar[x.key] = h(x.body));
const perCollection = {};
rows.forEach(x => { const c = x.key.split('/')[0]; perCollection[c] = (perCollection[c]||'') + x.key + x.body; });
Object.keys(perCollection).forEach(k => perCollection[k] = h(perCollection[k]));

// Modes are part of the collection contract — a renamed or added mode is a real difference.
const collectionShape = cols.map(c => c.name+'['+c.modes.map(m=>m.name).join(',')+']').sort().join(' ; ');

const textStyles = (await figma.getLocalTextStylesAsync()).map(s => ({
  name: s.name,
  h: h([s.fontName.family, s.fontName.style, s.fontSize, JSON.stringify(s.lineHeight),
        JSON.stringify(s.letterSpacing), s.textCase, s.textDecoration, s.description||''].join('|'))
}));
const effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => ({
  name: s.name, h: h(JSON.stringify(s.effects) + (s.description||''))
}));
const paintStyles = (await figma.getLocalPaintStylesAsync()).map(s => ({
  name: s.name, h: h(JSON.stringify(s.paints) + (s.description||''))
}));

const wanted = typeof VARS !== 'undefined' && Array.isArray(VARS) ? new Set(VARS) : null;
const bodies = {}; if (wanted) rows.forEach(x => { if (wanted.has(x.key)) bodies[x.key] = x.fields; });

const out = {
  file: figma.root.name,
  total: rows.length,
  collectionShape,
  fileHash: h(rows.map(x => x.key + x.body).join('\n')),
  perCollection,
  perVar,
  textStyles,
  effectStyles,
  paintStyles
};
if (wanted) out.bodies = bodies;
return out;
