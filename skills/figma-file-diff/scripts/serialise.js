// Tier 2 — Merkle hash of every component definition's full layer tree.
// Run in each file via figma_execute. Compare per-component hashes; identical
// hash means the whole subtree agrees, so it never needs inspecting.
//
// Descends into instances: inside a component definition, instances are authored
// design and their overrides are exactly where drift hides. See references/normalisation.md.
//
// Sanity-check totalNodes against file size. A suspiciously low count means the
// serialiser is skipping something.

function h(s){ let x=5381; for(let i=0;i<s.length;i++){ x=((x*33)^s.charCodeAt(i))>>>0; } return x.toString(16); }
function pathOf(n){ const p=[]; let c=n; while(c&&c.type!=='DOCUMENT'){ p.unshift(c.name); c=c.parent; } return p.join(' / '); }
function r(v){ return typeof v==='number' ? Math.round(v*100)/100 : v; }
function stripKey(k){ return String(k).replace(/#\d+:\d+/g,''); }

await figma.loadAllPagesAsync();

const vars = await figma.variables.getLocalVariablesAsync();
const vn = {}; vars.forEach(v => vn[v.id] = v.name);
const sn = {};
for (const s of [].concat(
  await figma.getLocalPaintStylesAsync(),
  await figma.getLocalTextStylesAsync(),
  await figma.getLocalEffectStylesAsync()
)) sn[s.id] = s.name;

// Variable-bound paints serialise as the binding, never the resolved colour.
function paint(p){
  if (!p) return '-';
  const b = p.boundVariables && p.boundVariables.color ? 'var:'+(vn[p.boundVariables.color.id]||'EXT') : null;
  const o = ':o'+r(p.opacity===undefined?1:p.opacity) + (p.visible===false?':off':'');
  if (p.type==='SOLID') return 'S:'+(b||('#'+[p.color.r,p.color.g,p.color.b].map(c=>Math.round(c*255)).join(',')))+o;
  if (p.type==='IMAGE') return 'IMG:'+p.imageHash+':'+p.scaleMode+o;
  if (p.type && p.type.indexOf('GRADIENT')===0)
    return p.type+':'+(p.gradientStops||[]).map(s=>Math.round(s.position*100)+'@'+[s.color.r,s.color.g,s.color.b,s.color.a].map(r).join(',')).join('/')+o;
  return p.type+o;
}

function bvOf(n){
  const b = n.boundVariables||{};
  return Object.keys(b).sort().map(k => {
    const v = b[k];
    if (Array.isArray(v)) return k+'=['+v.map(a=>vn[a.id]||'EXT').join(',')+']';
    if (v && v.id) return k+'='+(vn[v.id]||'EXT');
    return k+'='+JSON.stringify(v);
  }).join(',');
}

function ser(n){
  const p = [n.type, n.name];
  if (n.visible===false) p.push('HID');
  if (n.opacity!==undefined && n.opacity!==1) p.push('op'+r(n.opacity));
  if (n.blendMode && n.blendMode!=='PASS_THROUGH' && n.blendMode!=='NORMAL') p.push('bm'+n.blendMode);
  if (n.isMask) p.push('MASK');
  if (n.rotation) p.push('rot'+r(n.rotation));
  if (n.clipsContent!==undefined) p.push('clip'+(n.clipsContent?1:0));
  if (n.layoutPositioning && n.layoutPositioning!=='AUTO') p.push('lp'+n.layoutPositioning);
  if (n.layoutAlign) p.push('la'+n.layoutAlign);
  if (n.layoutGrow!==undefined) p.push('lg'+n.layoutGrow);

  if (n.layoutMode && n.layoutMode!=='NONE')
    p.push('LM'+n.layoutMode,
      'pad'+[n.paddingTop,n.paddingRight,n.paddingBottom,n.paddingLeft].map(r).join('/'),
      'gap'+r(n.itemSpacing), 'cgap'+r(n.counterAxisSpacing),
      'pri'+n.primaryAxisAlignItems, 'cnt'+n.counterAxisAlignItems,
      'psm'+n.primaryAxisSizingMode, 'csm'+n.counterAxisSizingMode,
      'wrap'+(n.layoutWrap||'-'));

  // Dimensions only count when authored. FILL/HUG widths are derived from context.
  if (n.layoutSizingHorizontal){ p.push('sh'+n.layoutSizingHorizontal); if(n.layoutSizingHorizontal==='FIXED') p.push('W'+Math.round(n.width)); }
  if (n.layoutSizingVertical){ p.push('sv'+n.layoutSizingVertical); if(n.layoutSizingVertical==='FIXED') p.push('H'+Math.round(n.height)); }

  // The constraint family. Omitting this caused a false "identical" verdict.
  if (n.maxWidth!==undefined) p.push('maxW'+n.maxWidth);
  if (n.minWidth!==undefined) p.push('minW'+n.minWidth);
  if (n.maxHeight!==undefined) p.push('maxH'+n.maxHeight);
  if (n.minHeight!==undefined) p.push('minH'+n.minHeight);
  if (n.constraints) p.push('con'+n.constraints.horizontal+'/'+n.constraints.vertical);

  if (typeof n.cornerRadius==='number') p.push('cr'+r(n.cornerRadius));
  if (n.fills && n.fills!==figma.mixed && n.fills.length) p.push('F['+n.fills.map(paint).join('|')+']');
  if (n.strokes && n.strokes.length)
    p.push('ST['+n.strokes.map(paint).join('|')+']sw'+
      [n.strokeTopWeight,n.strokeRightWeight,n.strokeBottomWeight,n.strokeLeftWeight].map(x=>typeof x==='number'?r(x):'?').join('/')+
      (n.strokeAlign||'')+'dash'+JSON.stringify(n.dashPattern||[]));
  if (n.effects && n.effects.length)
    p.push('EF'+n.effects.map(e=>[e.type,r(e.radius),r(e.spread),
      e.color?[e.color.r,e.color.g,e.color.b,e.color.a].map(r).join(','):'',
      e.offset?r(e.offset.x)+'/'+r(e.offset.y):'', e.visible===false?'off':''].join(':')).join('|'));

  if (n.effectStyleId) p.push('ES'+(sn[n.effectStyleId]||'EXT'));
  if (n.fillStyleId && n.fillStyleId!==figma.mixed) p.push('FS'+(sn[n.fillStyleId]||'EXT'));
  if (n.strokeStyleId) p.push('SS'+(sn[n.strokeStyleId]||'EXT'));

  const b = bvOf(n); if (b) p.push('BV{'+b+'}');

  if (n.type==='TEXT'){
    p.push('TXT:'+n.characters, 'TS'+(n.textStyleId&&n.textStyleId!==figma.mixed?(sn[n.textStyleId]||'EXT'):'NONE'));
    if (n.fontName!==figma.mixed) p.push('FN'+n.fontName.family+'/'+n.fontName.style);
    if (n.fontSize!==figma.mixed) p.push('FZ'+n.fontSize);
    if (n.lineHeight!==figma.mixed) p.push('LH'+JSON.stringify(n.lineHeight));
    if (n.letterSpacing!==figma.mixed) p.push('LS'+JSON.stringify(n.letterSpacing));
    p.push('AR'+n.textAutoResize, 'AH'+n.textAlignHorizontal, 'AV'+n.textAlignVertical,
      'TR'+(n.textTruncation||'-'), 'ML'+(n.maxLines===null?'-':n.maxLines));
  }

  // The API surface. Omitting it gave "identical" for two files whose descriptions or defaults differed.
  if (n.type==='COMPONENT' || n.type==='COMPONENT_SET'){
    p.push('DESC:'+(n.descriptionMarkdown||n.description||''));
    // a variant's definitions belong to its set, and reading them there throws
    if (n.type==='COMPONENT_SET' || !(n.parent && n.parent.type==='COMPONENT_SET')){
      let d={}; try{ d = n.componentPropertyDefinitions||{}; }catch(e){}
      p.push('PD['+Object.keys(d).map(k=>[stripKey(k), d[k].type, JSON.stringify(d[k].defaultValue),
        JSON.stringify(d[k].variantOptions||[]), // a preferred value is a key, which differs in a copy: its type and count, never the key
        (d[k].preferredValues||[]).map(v=>v.type).join(',')].join(':')).sort().join(';')+']');
    }
  }

  if (n.type==='INSTANCE'){
    let cp={}; try{ cp = n.componentProperties||{}; }catch(e){}
    p.push('CP['+Object.keys(cp).sort().map(k=>stripKey(k)+'='+JSON.stringify(cp[k].value)).join(';')+']');
  }

  return p.join('~');
}

function walk(n){
  let s = ser(n), c = 1;
  if (n.children){ for (const k of n.children){ const x = walk(k); s += '\n>'+x.hash; c += x.count; } }
  return { hash: h(s), count: c };
}

const out = [];
for (const page of figma.root.children){
  for (const n of page.findAllWithCriteria({ types:['COMPONENT','COMPONENT_SET'] })){
    if (n.type==='COMPONENT' && n.parent && n.parent.type==='COMPONENT_SET') continue; // counted via its set
    const w = walk(n);
    out.push({ p: pathOf(n), h: w.hash, n: w.count });
  }
}
out.sort((a,b) => a.p < b.p ? -1 : 1);

return {
  file: figma.root.name,
  count: out.length,
  totalNodes: out.reduce((a,b) => a + b.n, 0),
  deepHash: h(out.map(o => o.p + o.h).join('\n')),
  comps: out.map(o => o.p + ' = ' + o.h + ' (' + o.n + ')')
};
