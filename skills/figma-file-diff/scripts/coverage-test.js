// Coverage test — proves the serialiser actually reads what it claims to.
//
// The dangerous failure of this skill is a false negative: reporting two files
// identical when they aren't, because a property is never read. That gap is
// invisible in the output, so it can't be found by inspection. This finds it by
// mutating one property at a time and asserting the hash moves.
//
// Run in a SCRATCH file, never a real library. It creates and deletes nodes.
// Re-run whenever the serialiser changes, when a user reports a missed
// difference, or periodically — the Plugin API gains properties over time.
//
// Any row with moved:false is a blind spot. Fix serialise.js and re-run.
//
// It hashes with serialise.js's own ser() and h(), which it does not hold:
// never run this file alone, and never paste them in. Run the body
// `node scripts/coverage-body.mjs` prints, which is serialise.js's serialiser
// followed by this file, so the test always certifies the serialiser as it is.

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

const results = [];
const scratch = [];

function check(label, node, mutate){
  const before = h(ser(node));
  try { mutate(node); } catch(e){ results.push({ prop: label, moved: null, error: String(e.message||e) }); return; }
  const after = h(ser(node));
  results.push({ prop: label, moved: before !== after });
}

// FRAME with auto-layout
const f = figma.createFrame();
f.layoutMode = 'HORIZONTAL';
f.resize(200, 100);
scratch.push(f);

check('name',            f, n => n.name = 'changed');
check('visible',         f, n => n.visible = false);
check('opacity',         f, n => n.opacity = 0.5);
check('rotation',        f, n => n.rotation = 15);
check('clipsContent',    f, n => n.clipsContent = !n.clipsContent);
check('paddingTop',      f, n => n.paddingTop = 12);
check('paddingLeft',     f, n => n.paddingLeft = 8);
check('itemSpacing',     f, n => n.itemSpacing = 16);
check('counterAxisSpacing', f, n => { n.layoutWrap = 'WRAP'; n.counterAxisSpacing = 8; });
check('primaryAxisAlignItems',  f, n => n.primaryAxisAlignItems = 'CENTER');
check('counterAxisAlignItems',  f, n => n.counterAxisAlignItems = 'CENTER');
check('layoutWrap',      f, n => n.layoutWrap = 'NO_WRAP');
check('layoutSizingHorizontal', f, n => n.layoutSizingHorizontal = 'FIXED');
check('width (FIXED)',   f, n => n.resize(300, n.height));
check('maxWidth',        f, n => n.maxWidth = 250);
check('minWidth',        f, n => n.minWidth = 50);
check('maxHeight',       f, n => n.maxHeight = 400);
check('minHeight',       f, n => n.minHeight = 20);
check('cornerRadius',    f, n => n.cornerRadius = 8);
check('fills',           f, n => n.fills = [{ type:'SOLID', color:{r:1,g:0,b:0} }]);
check('fill opacity',    f, n => n.fills = [{ type:'SOLID', color:{r:1,g:0,b:0}, opacity:0.4 }]);
check('strokes',         f, n => n.strokes = [{ type:'SOLID', color:{r:0,g:0,b:1} }]);
check('strokeTopWeight', f, n => n.strokeTopWeight = 4);
check('strokeAlign',     f, n => n.strokeAlign = 'OUTSIDE');
check('dashPattern',     f, n => n.dashPattern = [4,4]);
check('effects',         f, n => n.effects = [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:2}, radius:4, spread:0, visible:true, blendMode:'NORMAL' }]);
check('effect radius',   f, n => n.effects = [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:2}, radius:12, spread:0, visible:true, blendMode:'NORMAL' }]);
check('effect spread',   f, n => n.effects = [{ type:'DROP_SHADOW', color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:2}, radius:12, spread:6, visible:true, blendMode:'NORMAL' }]);
check('blendMode',       f, n => n.blendMode = 'MULTIPLY');

// TEXT
const t = figma.createText();
t.characters = 'Hello';
scratch.push(t);

check('characters',      t, n => n.characters = 'Goodbye');
check('fontSize',        t, n => n.fontSize = 24);
check('lineHeight',      t, n => n.lineHeight = { value: 32, unit: 'PIXELS' });
check('letterSpacing',   t, n => n.letterSpacing = { value: 2, unit: 'PIXELS' });
check('textAlignHorizontal', t, n => n.textAlignHorizontal = 'CENTER');
check('textAlignVertical',   t, n => n.textAlignVertical = 'CENTER');
check('textAutoResize',  t, n => n.textAutoResize = 'NONE');
check('textTruncation',  t, n => n.textTruncation = 'ENDING');
check('maxLines',        t, n => n.maxLines = 2);

// Child order — reordering must move the parent hash
const p = figma.createFrame();
p.layoutMode = 'VERTICAL';
const a = figma.createFrame(); a.name = 'A';
const b = figma.createFrame(); b.name = 'B';
p.appendChild(a); p.appendChild(b);
scratch.push(p);
{
  function walkLocal(n){ let s = ser(n); if(n.children) for(const k of n.children) s += '\n>' + h(ser(k)); return h(s); }
  const before = walkLocal(p);
  p.insertChild(0, b);
  results.push({ prop: 'child order', moved: before !== walkLocal(p) });
}

scratch.forEach(n => n.remove());

const blind = results.filter(x => x.moved === false).map(x => x.prop);
const errored = results.filter(x => x.moved === null);

return {
  file: figma.root.name,
  checked: results.length,
  blindSpots: blind,
  errored,
  pass: blind.length === 0,
  results
};
