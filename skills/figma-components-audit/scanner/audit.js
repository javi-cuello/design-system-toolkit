// @runs: the audit dashboard's Audit (tools/figma-audit/server.mjs serves it at /scripts), as well as a session.
// Scanner — SHARED by every project. Produces CANDIDATES only; every one still
// has to survive judgement against the project's recorded rulings.
// The caller prepends `const TARGETS`, `const SCALES` and `const TOKENS`:
// TARGETS is which component sets to scan; SCALES is the project's recorded
// option order; TOKENS is {semantic, spacing, radius, textRole, allowedKeys, …} — the semantic
// collection's NAME and the value scales. All three are project rules, and
// this file must hold none of them.
//
// A missing rule SKIPS its check. It never falls back to a default, because
// any default here is some other project's answer: this file shipped with
// one project's semantic collection name hardcoded and reported 210 findings
// against a second project, whose collection was named differently and whose
// every binding was correct. A shared scanner carrying one library's constants is not shared.
//
// Facts are gathered first and judged by checkFacts(), a pure function, so the
// checks run in node against captured facts with no Figma at all: run this
// body with no `figma` in scope and it returns checkFacts itself.
//
//   facts       { pages: [{ name, id, sets: [setNode] }] } — every page of
//               the file in order (the page-name check reads them all; the
//               page filter is a rule, so it runs inside), each with its
//               top-level COMPONENT_SET and COMPONENT nodes. Live these are
//               the nodes themselves; headless, a dump of the properties the
//               rules read.
//   T           the TOKENS object; SCALES and TARGETS as the caller prepends
//               them.
//   resolveVar  async id -> { name, collection } | null. Live, a cached read
//               of the variable and its collection; headless, a map.
//   file        { collections: [{ modes: [{ name }] }], variables, pages,
//               textStyles, effectStyles } — the library-level counts the
//               measures carry. File facts, not node facts, passed beside
//               them so the headless run reproduces `measures` whole and the
//               composition of that object stays in one place.
async function checkFacts(facts, T, SCALES, TARGETS, resolveVar, file) {
  const TOKENS = T;
  const TOK=(typeof TOKENS!=="undefined"&&TOKENS)||{};
  const OVERLAY=Array.isArray(TOK.overlayComponents)&&TOK.overlayComponents.length?new Set(TOK.overlayComponents):null;
  // A scale is a non-empty list of finite numbers; anything else ([] from a
  // capture that found no family, a string, a copied placeholder) is no scale,
  // so its verdict is skipped, never a throw from reducing an empty list or a
  // nearest step computed against a string. An invalid one is said in
  // `settings`, apart from an absent key, which is a rule not stated.
  const settingsNotes=[];
  const scaleOf=k=>{const s=TOK[k];if(s===undefined||s===null)return null;
    if(Array.isArray(s)&&s.length&&s.every(x=>typeof x==="number"&&Number.isFinite(x)))return s;
    settingsNotes.push("tokens."+k+" ignored (not a list of numbers)");return null;};
  const SPACING=scaleOf("spacing"), COLL=TOK.semantic?[].concat(TOK.semantic):null, TEXTROLE=TOK.textRole||null;
  const RADIUS=scaleOf("radius");
  const sizeSeen={}; // size name -> [{set, height}], compared across sets after the walk
  // The collection KEYS a binding may come from — discovery's `allowedKeys`,
  // a list or the object FCA.discover returns. Names are not unique across
  // libraries, so only the key can tell a leaked binding from a good one.
  // Absent, the check does not run.
  const ALLOWED=TOK.allowedKeys?new Set(Array.isArray(TOK.allowedKeys)?TOK.allowedKeys:Object.keys(TOK.allowedKeys)):null;
  // On a scale or off it, and if off, the nearest step — the fix a reader
  // needs, where "off the scale" alone sends them to look the scale up.
  const near=(v,s)=>s.reduce((a,x)=>Math.abs(x-v)<Math.abs(a-v)?x:a,s[0]);
  const onScale=(v,s,scale)=>s?(s.includes(v)?" (on the "+scale+" scale)":" (off the "+scale+" scale; nearest step "+near(v,s)+")"):"";
  // Each candidate carries two sentences (design-standard rule 10): `text`
  // says what goes wrong and what it does to the people using the component,
  // in their words, and `advice` says the fix. The rule stays in `rule` and
  // `key`. A raw value costs the same thing wherever it sits, so its two
  // sentences are written once here. The property names are the Figma
  // panel's, not the plugin API's.
  const SAY={paddingTop:"top padding",paddingRight:"right padding",paddingBottom:"bottom padding",paddingLeft:"left padding",
    topLeftRadius:"top-left radius",topRightRadius:"top-right radius",bottomLeftRadius:"bottom-left radius",bottomRightRadius:"bottom-right radius",
    strokeTopWeight:"top",strokeBottomWeight:"bottom",strokeLeftWeight:"left",strokeRightWeight:"right",
    fontFamily:"font family",fontSize:"font size",fontStyle:"font weight"};
  const RAW={spacing:"so a change to the spacing tokens never reaches it",radius:"so a change to the radius tokens never reaches it",
    colour:"so it ignores the theme's modes and every colour change made in the library",type:"so a change to the type tokens never reaches it",
    stroke:"so a change to the stroke tokens never reaches it"};
  const FIELD={fills:"fill",strokes:"stroke colour",effects:"effect",opacity:"opacity",itemSpacing:"gap",strokeWeight:"stroke weight",
    strokeTopWeight:"top stroke weight",strokeBottomWeight:"bottom stroke weight",strokeLeftWeight:"left stroke weight",strokeRightWeight:"right stroke weight"};
  const fieldName=f=>FIELD[f]||SAY[f]||f;
  const bindTo=(label,v,s,scale)=>s?(s.includes(v)?"Bind the "+label+" to the "+scale+" variable for "+v+".":"Bind the "+label+" to the nearest "+scale+" step, "+near(v,s)+", or record why it is "+v+"."):"Bind the "+label+" to a "+scale+" variable.";
  // Which pages hold components, as a regex source. One project marks them with
  // ❖/🚧 and a second inherited that, but a third library will not — a page
  // filter is a naming convention, which is the definition of a project rule.
  // Absent, every page is walked: scanning too much is a slow audit, while
  // scanning by another project's convention is an EMPTY one that reports clean.
  const PAGES=TOK.componentPages?new RegExp(TOK.componentPages):null;
  // Sections a project keeps out of the audit — a DEPRECATED section, say. A page
  // name cannot tell which section it sits in; only its position can, so the walk
  // remembers the last section header it passed. Both rules come from TOKENS, and
  // either one missing excludes nothing. sweep.js carries the same two lines.
  const SECTION=TOK.sectionHeader?new RegExp(TOK.sectionHeader):null;
  const SKIPSEC=new Set(TOK.excludeSections||[]);
  let section=null;
  // The state axis and its resting value come from the recorded option order:
  // SCALES.State[0] is the resting state by construction, since the scale is
  // written in canonical order. A library calling the axis something else says
  // so in `stateAxis`, and one with no recorded scale skips the check.
  const SAXIS=TOK.stateAxis||null;
  const SREST=(SAXIS&&typeof SCALES!=="undefined"&&SCALES&&SCALES[SAXIS]&&SCALES[SAXIS][0])||null;
  // An EMPTY target list means every set. A first run has no fingerprints to
  // enumerate from, and "scan nothing" is never what a caller meant by "audit".
  const want=new Set(TARGETS);
  const all=want.size===0;
  // Which rule families this run could exercise. The state check needs the
  // state axis and its resting value; the option-order check needs a recorded
  // scale; the rest always run. A row of a family that did not run may not
  // be closed by this run, and the writer holds the caller to that.
  const ran=["naming","structure","properties","metadata","tokens","accessibility"];
  if(SREST) ran.push("states");
  if(typeof SCALES!=="undefined"&&SCALES&&Object.keys(SCALES).length) ran.push("schema");
  const b=(n,k)=>n.boundVariables&&n.boundVariables[k];
  // Measures accumulate as the walk goes. They are only RETURNED on a full scan:
  // a targeted re-audit of three sets counts three sets, and writing that over a
  // library measure of sixty-four would report a collapse that never happened.
  const M={sets:0,variants:0,described:0,nodes:0,groups:0,hidden:0,bound:0,unbound:0,autoNamed:0,layers:0,frames:0,staticFrames:0,guidable:0,guided:0,contrastTotal:0,contrastPass:0,rtlSets:0,rtlVariants:0};
  // Measures describe the LIBRARY, so they are only honest when nothing was
  // skipped — and "nothing skipped" is not the same as "TARGETS was empty". The
  // dashboard audits everything by naming all 64 sets explicitly, which the
  // empty-list test read as a partial scan, so a completed full audit wrote no
  // measures at all and the page stayed on "Nothing measured yet" forever.
  let skipped=0;
  const def=(v,d)=>v===undefined||v===null?d:v;
  // Slot parts (figma-standard rule 25): a public component every use of which
  // sits inside other components on its own page, in a slot or directly, like
  // `Tabs - Tab item` in `Tabs`. It is chosen through its parent, so the
  // guidance check below asks it for no section. Decided by where it is used,
  // never by its name: the family-name test this replaced missed `Photo upload
  // preview item` and `Dropdown menu item - Checkbox`, and asked them for the
  // sections figma-component-descriptions never writes for a part (2026-10-25).
  // An instance inside another instance belongs to that instance's main, walked
  // as its own set, so a tab item in the Tabs a Page header holds stays Tabs'.
  const slotParts=new Set();
  {
    const mainOf=async n=>typeof n.getMainComponentAsync==="function"?await n.getMainComponentAsync().catch(()=>null):(n.mainComponent||null);
    const setName=m=>m?(m.parent&&m.parent.type==="COMPONENT_SET"?m.parent.name:m.name):null;
    const home=new Map(), users=new Map();
    for(const p of facts.pages) for(const set of p.sets) home.set(set.name,p);
    for(const p of facts.pages) for(const set of p.sets){
      const look=async n=>{
        if(n.type==="INSTANCE"){ const part=setName(await mainOf(n));
          if(part&&part!==set.name){ if(!users.has(part)) users.set(part,new Set()); users.get(part).add(p); } return; }
        for(const c of n.children||[]) await look(c);
      };
      for(const v of (set.type==="COMPONENT_SET"?set.children:[set])) for(const c of v.children||[]) await look(c);
    }
    for(const [part,pages] of users) if(home.has(part)&&[...pages].every(p=>p===home.get(part))) slotParts.add(part);
  }
  // WCAG relative luminance and contrast (figma-standard rule 32), for an
  // opaque surface and a text colour already blended over it: the toolkit's one
  // formula (tools/shared/colour.js), a copy because Figma imports nothing, held
  // to it character for character by tools/shared/test-colour.mjs.
  const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const relativeLuminance = (c) => 0.2126 * srgbToLinear(c.r) + 0.7152 * srgbToLinear(c.g) + 0.0722 * srgbToLinear(c.b);
  const contrastRatio = (a, b) => { const x = relativeLuminance(a), y = relativeLuminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // A variant's name as its prop values: the toolkit's one reader (tools/shared/names.js), a copy
  // for the same reason, held to it by tools/shared/test-names.mjs.
  const variantValues = (name) => Object.fromEntries(String(name ?? '').split(/,\s*/).filter((p) => p.includes('=')).map((p) => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  const solid=n=>Array.isArray(n.fills)?n.fills.filter(f=>f.visible!==false&&f.type==="SOLID").pop()||null:null;
  // A layer Figma names itself: the shape or frame type and a number.
  // figma-standard rule 18: a word after the first that starts with a capital breaks sentence
  // case unless it is all capitals, an acronym (`Show AM-PM`). Each part between the marks figma-standard rule 20
  // gives a name (` / `, ` - `) starts afresh, so `Context menu item / Default` passes.
  const capsInside=s=>s.replace(/\(.*?\)/g,"").split(/ \/ | - /).some(seg=>seg.trim().split(/\s+/).slice(1).some(w=>/^[A-Z]/.test(w)&&w!==w.toUpperCase()));
  // figma-standard rule 9: inside its parent a part's layer is the part's last word.
  const lastWord=nm=>{ const w=nm.replace(/^[^\p{L}\p{N}_]+/u,"").replace(/^_/,"").split(" / ")[0].trim().split(/\s+/).pop()||""; return w.charAt(0).toUpperCase()+w.slice(1); };
  const AUTO_NAME=/^(Frame|Rectangle|Group|Ellipse|Vector|Component|Line|Polygon|Star|Union|Subtract|Intersect|Exclude|Image|Section|Slot|Text) \d+$/;
  // The guidance sections the descriptions skill writes, as headings.
  const SECTION_RE={usage:/^\s*(#{1,6}\s*)?usage\s*:?\s*$/im, dont:/^\s*(#{1,6}\s*)?(don['’]?t|do not|avoid)\s*:?\s*$/im, code:/^\s*(#{1,6}\s*)?code gen(eration)? notes\s*:?\s*$/im};
  // Right to left (figma-standard rule 50), only where the project names its
  // right-to-left languages. The names say which in the findings' text.
  const RTL=typeof TOK.rtlLanguages==="string"&&TOK.rtlLanguages?[TOK.rtlLanguages]:Array.isArray(TOK.rtlLanguages)&&TOK.rtlLanguages.length?TOK.rtlLanguages:null;
  const LANG_NAME={ar:"Arabic",fa:"Farsi",he:"Hebrew",ur:"Urdu"};
  const LANGS=RTL?RTL.map(c=>LANG_NAME[c]||c).join(" and "):"";
  // A side as a word ("Icon left"), or inside camelCase ("iconLeft", "leftIcon").
  const SIDE_G=/(?<![\p{L}])(left|right)(?![\p{L}])|(?<=\p{Ll})(Left|Right)(?!\p{Ll})|^(left|right)(?=\p{Lu})/gu;
  const SIDE_W=/(?<![\p{L}])(left|right)(?![\p{L}])/giu;
  const SIDE={test:nm=>{SIDE_G.lastIndex=0;SIDE_W.lastIndex=0;return SIDE_W.test(nm)||(SIDE_G.lastIndex=0,SIDE_G.test(nm));}};
  const caseAs=(m,w)=>m===m.toUpperCase()?w.toUpperCase():m[0]===m[0].toUpperCase()?w[0].toUpperCase()+w.slice(1):w;
  const bySide=nm=>nm.replace(SIDE_W,m=>/^l/i.test(m)?caseAs(m,"leading"):caseAs(m,"trailing")).replace(SIDE_G,m=>/^l/i.test(m)?caseAs(m,"leading"):caseAs(m,"trailing"));
  const DIR_SHAPE=/(?<![\p{L}])(chevrons?|arrows?|carets?)(?![\p{L}])/iu;
  const DIR_WORD=/(?<![\p{L}])(chevrons?|arrows?|carets?|undo|redo|reply|send|forward|back|next|previous|prev|log-?in|log-?out|sign-?in|sign-?out|indent|outdent|skip|rewind|fast-forward|play|step-back|step-forward|external-link|corner)(?![\p{L}])/iu;
  // Up and down stay in Arabic: only a shape that points sideways mirrors.
  const VERT=/(?<![\p{L}])(up|down|upward|downward)(?![\p{L}])/iu, HORIZ=/(?<![\p{L}])(left|right|forward|back|next|prev|previous)(?![\p{L}])/iu;
  // An instance's direction comes from its main component (and variant) when that names one: a select's "Icon right" layer holding chevron-down points down.
  const pointsSide=nm=>!(VERT.test(nm)&&!HORIZ.test(nm));
  const MEDIA=/(?<![\p{L}])(play|pause|rewind|fast-forward|skip-back|skip-forward|step-back|step-forward|repeat|shuffle|clock|timer)(?![\p{L}])/iu;
  const RTL_NOTE=/^\s*(#{1,6}\s*)?right to left\b/im, ICON_NOTE=/right to left:\s*(mirrors|stays)/i;
  // An icon is a lone component drawn only in shapes, at icon size: the
  // structure says it, not a name or another plugin's data, which this file
  // cannot read.
  const SHAPES=new Set(["VECTOR","BOOLEAN_OPERATION","LINE","ELLIPSE","RECTANGLE","POLYGON","STAR"]);
  const onlyShapes=n=>(n.children||[]).length>0&&n.children.every(c=>SHAPES.has(c.type)||((c.type==="GROUP"||c.type==="FRAME")&&onlyShapes(c)));
  const iconNode=c=>!!c&&Math.max(c.width||0,c.height||0)<=64&&onlyShapes(c);
  // A sized icon set (Size=16, 24) is an icon too: every variant is one.
  const isIcon=set=>set.type==="COMPONENT"?iconNode(set):set.type==="COMPONENT_SET"&&(set.children||[]).length>0&&set.children.every(iconNode);
  if(RTL) ran.push("direction");
  // Cached once fetched: the layer-name walk and the direction walk both need it.
  const MAINS=new WeakMap();
  // A text layer's style, for its variable bindings. Facts captured without
  // Figma carry it as textStyle.
  const STYLES=new Map(), FONT_SEEN=new Set();
  const CASE_NAME={UPPER:"uppercase",LOWER:"lowercase",TITLE:"title case",SMALL_CAPS:"small caps",SMALL_CAPS_FORCED:"small caps"};
  // Icon fonts and code type keep their face in every script.
  const KEEP_FACE=/mono|code|symbols?|icons?/i;
  const styleOf=async n=>{ if(n.textStyle) return n.textStyle; const id=n.textStyleId; if(typeof id!=="string"||!id||typeof figma==="undefined") return null;
    if(!STYLES.has(id)) STYLES.set(id,await figma.getStyleByIdAsync(id).catch(()=>null)); return STYLES.get(id); };
  const mainOf=async n=>{ if(MAINS.has(n)) return MAINS.get(n); const m=typeof n.getMainComponentAsync==="function"?await n.getMainComponentAsync().catch(()=>null):(n.mainComponent||null); MAINS.set(n,m); return m; };
  const RAW_KEY=/^tokens\|(padding(Top|Right|Bottom|Left)|grid(Row|Column)Gap|itemSpacing|(top|bottom)(Left|Right)Radius|fill|stroke|strokeWeight|fontFamily|fontSize|fontStyle)\|/;
  const out=[];
  for(const p of facts.pages){
    if(p.name!==p.name.trim()) out.push({set:p.name, id:p.id, variants:0, axes:[], described:true, page:p.name,
      candidates:[{sev:"warning",rule:"naming",key:"naming|page-ws",text:'Page name "'+p.name+'" has a space at its start or end, which nobody sees in the page list and which breaks anything matching the page by name',
        advice:'Rename the page "'+p.name.trim().replace(/\s{2,}/g," ")+'".'}]});
    if(SECTION&&SECTION.test(p.name)) section=p.name;
    if(section&&SKIPSEC.has(section)) continue;
    if(PAGES&&!PAGES.test(p.name)) continue;
    const tops=p.sets;
    for(const set of tops){
      if(!all && !want.has(set.name)){ skipped++; continue; }
      const defs=set.componentPropertyDefinitions||{};
      const vs=set.type==="COMPONENT_SET"?set.children:[set];
      const F=[];
      // The layer paths any variant draws visibly, so a layer one variant hides and another shows is not dead.
      const shown=new Set();
      const showsAt=(n,path)=>{ if(n.visible!==false) shown.add(path||"/"); if("children" in n&&n.type!=="INSTANCE"&&n.type!=="SLOT") for(const c of n.children) showsAt(c,path+"/"+c.name); };
      for(const v of vs) showsAt(v,"");
      // The variant being walked and whether it is disabled (its disabled axis
      // True, from the settings): disabled text is exempt from the contrast
      // floor (WCAG 1.4.3, figma-standard rule 32).
      let curV=null, curDisabled=false; const contrast={};
      const overlay={};
      const walk=async(n,path,par)=>{
        if(n.type==="SLOT") return;
        M.nodes++;
        // NOT on an instance. Every check that can raise an "unbound" finding
        // stops at an instance (the walk below does too), so counting bindings
        // there put 29% of one library's keys into the numerator of a ratio
        // whose denominator could never see them — and the figure then read
        // 100.0 on every run of every project, because the rounding cannot
        // leave 100 until roughly 24 raw values exist.
        if(n.boundVariables&&n.type!=="INSTANCE") M.bound+=Object.keys(n.boundVariables).length;
        if(n.type==="GROUP") M.groups++;
        if(n.visible===false&&!(n.componentPropertyReferences&&n.componentPropertyReferences.visible)) M.hidden++;
        // `key` is what the finding is ABOUT — rule, subject, layer path —
        // and never its wording, so the row writer finds the same row after
        // a check is reworded or a measurement in the text moves.
        const at=path||"/";
        if(n.type==="GROUP") F.push({sev:"warning",rule:"structure",key:"structure|group|"+at,text:'"'+n.name+'" is a group, so it cannot hold auto layout, padding or a fill, and it resizes by scaling what it holds',
          advice:"Replace the group with a frame (Frame selection, \u2325\u2318G) and give the frame auto layout."});
        // figma-standard rule 34: a layer some sibling variant shows (a focus ring, a spinner) is variant-driven.
        if(n.visible===false&&!(n.componentPropertyReferences&&n.componentPropertyReferences.visible)&&!shown.has(at))
          F.push({sev:"hygiene",rule:"structure",key:"structure|hidden|"+at,text:'"'+n.name+'" is hidden in every variant and no property shows it, so it ships in every instance and nobody can turn it on',
            advice:"Delete the layer, or wire its visibility to a boolean property if people should be able to show it."});
        if(n.type!=="INSTANCE"){
          if("layoutMode" in n&&n.layoutMode!=="NONE"){
            // An off-scale padding of the settings' mechanismPadding or more is
            // usually a mechanism — a progress or slider fill driven by padding —
            // so it is a question (review), not a defect; judgement decides which it is.
            for(const k of ["paddingTop","paddingRight","paddingBottom","paddingLeft"])
              if(!b(n,k)&&n[k]!==0){const mech=SPACING&&TOK.mechanismPadding&&!SPACING.includes(n[k])&&n[k]>=TOK.mechanismPadding;
                F.push({sev:mech?"review":"error",rule:"tokens",key:"tokens|"+k+"|"+at,
                  text:n.name+" has a raw "+SAY[k]+" of "+n[k]+onScale(n[k],SPACING,"spacing")+(mech?", which may drive a fill (a progress bar or slider) rather than space anything":", "+RAW.spacing),
                  advice:mech?"If the padding drives a fill, record it as a mechanism; if it spaces content, bind it to a spacing variable.":bindTo(SAY[k],n[k],SPACING,"spacing")});}
            // A GRID frame spaces its cells with gridRowGap and gridColumnGap.
            // itemSpacing survives from before the frame became a grid and does
            // nothing: a calendar whose gaps were 0 and bound was reported as
            // "raw gap=40" from that leftover, and the maintainer could not
            // find a gap that was never drawn.
            if(n.layoutMode==="GRID"){
              for(const [k,label] of [["gridRowGap","row gap"],["gridColumnGap","column gap"]])
                if(!b(n,k)&&n[k]) F.push({sev:"error",rule:"tokens",key:"tokens|"+k+"|"+at,text:n.name+" has a raw "+label+" of "+n[k]+", "+RAW.spacing,advice:bindTo(label,n[k],SPACING,"spacing")});
            } else if(!b(n,"itemSpacing")&&n.itemSpacing!==0&&n.primaryAxisAlignItems!=="SPACE_BETWEEN")
            { const live=(n.children||[]).filter(c=>c.visible!==false).length>=2;
              F.push({sev:live?"error":"hygiene",rule:"tokens",key:"tokens|itemSpacing|"+at,text:n.name+" has a raw gap of "+n.itemSpacing+onScale(n.itemSpacing,SPACING,"spacing")+", "+RAW.spacing,
                advice:bindTo("gap",n.itemSpacing,SPACING,"spacing")+(live?"":" With one child it spaces nothing yet; it does the moment a second child arrives.")}); }
          }
          for(const k of ["topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius"])
            if(k in n&&typeof n[k]==="number"&&n[k]!==0&&!b(n,k)) F.push({sev:"error",rule:"tokens",key:"tokens|"+k+"|"+at,text:n.name+" has a raw "+SAY[k]+" of "+n[k]+onScale(n[k],RADIUS,"radius")+", "+RAW.radius,advice:bindTo(SAY[k],n[k],RADIUS,"radius")});
          if(Array.isArray(n.fills)&&n.fills.some(f=>f.visible!==false&&f.type==="SOLID")){
            const fb=b(n,"fills");
            if(!fb) F.push({sev:"error",rule:"tokens",key:"tokens|fill|"+at,text:n.name+" has a raw fill colour, "+RAW.colour,advice:"Bind the fill to a colour variable"+(COLL?" from "+COLL.join(" or "):"")+"."});
            else{const t=await resolveVar(Array.isArray(fb)?fb[0].id:fb.id);
              // `semantic` is a name or a list: a project can publish more than one
              // semantic collection (a brand layer can sit beside the base one).
              if(COLL&&t&&!COLL.includes(t.collection)) F.push({sev:"warning",rule:"tokens",key:"tokens|fill-collection|"+at,text:n.name+" takes its fill from "+t.collection+"/"+t.name+", outside "+COLL.join(" or ")+", so it skips the theme's colour roles and misses a change made there",
                advice:"Rebind the fill to the matching colour in "+COLL.join(" or ")+"."});
              // The role SEGMENT is project vocabulary, and so is where it sits
              // in the path: one project writes Colour/Text/Neutral/strong, another
              // writes Text/Neutral/strong. A leading-slash test passes the first
              // and fails the second, which is why this matched a segment anywhere.
              if(TEXTROLE&&t&&n.type==="TEXT"&&!new RegExp("(^|/)"+TEXTROLE+"/").test(t.name))
                F.push({sev:"warning",rule:"tokens",key:"tokens|text-role|"+at,text:n.name+" is text coloured with "+t.name+", not a "+TEXTROLE+" colour, so a change to text colours passes it by and nothing promises its contrast",
                  advice:"Rebind it to the "+TEXTROLE+" colour for its emphasis."});
              // The other direction: a text-role colour on a shape. Only these
              // two are asserted — inferring icon or background roles from a
              // node's type is wrong too often (a radio dot takes a background).
              if(TEXTROLE&&t&&n.type!=="TEXT"&&new RegExp("(^|/)"+TEXTROLE+"/").test(t.name))
                F.push({sev:"warning",rule:"tokens",key:"tokens|text-role-shape|"+at,text:n.name+" ("+n.type.toLowerCase()+") is coloured with "+t.name+", a "+TEXTROLE+" colour, so a change meant for text recolours this shape too",
                  advice:"Rebind it to a colour meant for its job: an icon, border or background colour."});}
          }
          if(Array.isArray(n.strokes)&&n.strokes.some(x=>x.visible!==false)){
            if(!b(n,"strokes")) F.push({sev:"error",rule:"tokens",key:"tokens|stroke|"+at,text:n.name+" has a raw stroke colour, "+RAW.colour,advice:"Bind the stroke to a colour variable"+(COLL?" from "+COLL.join(" or "):"")+"."});
            const sides=["strokeTopWeight","strokeBottomWeight","strokeLeftWeight","strokeRightWeight"].filter(k=>k in n);
            if(!b(n,"strokeWeight")&&sides.length===4){const u=sides.filter(k=>!b(n,k)&&n[k]!==0);
              if(u.length) F.push({sev:"error",rule:"tokens",key:"tokens|strokeWeight|"+at,text:n.name+" has an unbound stroke weight ("+u.map(k=>SAY[k]).join(", ")+"), "+RAW.stroke,advice:"Bind the stroke weight to a stroke variable on every side that draws one."});}
            // Vectors, lines and ellipses expose only the shorthand, so there it
            // is the property that carries the binding.
            else if(!b(n,"strokeWeight")&&sides.length===0&&typeof n.strokeWeight==="number"&&n.strokeWeight!==0)
              F.push({sev:"error",rule:"tokens",key:"tokens|strokeWeight|"+at,text:n.name+" ("+n.type.toLowerCase()+") has an unbound stroke weight of "+n.strokeWeight+", "+RAW.stroke,advice:"Bind the stroke weight to a stroke variable."});
          }
          // Every binding, by collection KEY (§3.5c). Only with ALLOWED.
          if(ALLOWED&&n.boundVariables) for(const [field,bv] of Object.entries(n.boundVariables))
            for(const a of [].concat(bv)){ if(!a||!a.id) continue; const t=await resolveVar(a.id);
              if(t&&t.key&&!ALLOWED.has(t.key))
                F.push({sev:"warning",rule:"tokens",key:"tokens|off-library|"+field+"|"+at,text:n.name+" binds its "+fieldName(field)+" to "+t.collection+"/"+t.name+", from a library this project does not use, so it changes or breaks when that library does",
                  advice:"Rebind the "+fieldName(field)+" to the matching variable in the project's own library."}); }
          if(n.type==="TEXT"){
            if(!n.textStyleId) F.push({sev:"error",rule:"tokens",key:"tokens|textStyle|"+at,text:n.name+" has no text style, "+RAW.type,advice:"Apply the text style this text is meant to use."});
            for(const k of ["fontFamily","fontSize","fontStyle"]) if(!b(n,k)) F.push({sev:"error",rule:"tokens",key:"tokens|"+k+"|"+at,text:n.name+" has an unbound "+SAY[k]+", "+RAW.type,
              advice:"Apply a text style whose "+SAY[k]+" is bound, or bind the "+SAY[k]+" to its typography variable."});
          }
          if(path) M.layers++;
          if(AUTO_NAME.test(n.name)){ M.autoNamed++; F.push({sev:"warning",rule:"naming",key:"naming|default|"+at,text:'"'+n.name+'" keeps the name Figma gave it, so the layers panel, Dev Mode and code generated from the file say nothing about what it is',
            advice:"Rename it for what it holds or does: Label, Icon, Content."}); }
          // figma-standard rule 33: a frame that holds layers lays them out with
          // auto layout; without it an agent reading the file through Figma's
          // MCP gets absolute positions it can only copy. A review: an overlay
          // or an illustration may be absolute by design.
          if((n.type==="FRAME"||n.type==="COMPONENT")&&"layoutMode" in n&&(n.children||[]).some(c=>c.visible!==false)){
            M.frames++;
            if(n.layoutMode==="NONE"){ M.staticFrames++; F.push({sev:"review",rule:"structure",key:"structure|no-autolayout|"+at,text:(path?'Frame "'+n.name+'"':"The variant frame")+" has no auto layout, so its layers stay where they were drawn when text grows, and code read from the file gets fixed positions",
              advice:"Add auto layout (\u21e7A), or record the frame as absolute by design, such as an overlay or an illustration."}); }
          }
          // Whitespace nobody can see. A leading space is invisible in the layers
          // panel and survives indefinitely; on a component it also broke the
          // export's page-name comparison and produced a doubled component in the
          // consuming repo. Quoted so the reader can see where the edge is.
          if(n.name!==n.name.trim()) F.push({sev:"warning",rule:"naming",key:"naming|layer-ws|"+at,text:'Layer "'+n.name+'" has a space at its start or end, which nobody sees in the layers panel and which breaks anything matching the layer by name',
            advice:'Rename the layer "'+n.name.trim().replace(/\s{2,}/g," ")+'".'});
          if(/\s{2,}/.test(n.name)) F.push({sev:"hygiene",rule:"naming",key:"naming|layer-double|"+at,text:'Layer "'+n.name+'" has a double space, which nobody sees in the layers panel and which breaks anything matching the layer by name',
            advice:'Rename the layer "'+n.name.trim().replace(/\s{2,}/g," ")+'".'});
          if(path&&TOK.propertyCase==="sentence"&&capsInside(n.name)) F.push({sev:"preference",rule:"naming",key:"naming|layer-case|"+at,text:'Layer "'+n.name+'" is not in sentence case, so it reads unlike the layers beside it and unlike the names code takes from it',
            advice:"Rename it in sentence case, keeping acronyms in capitals."});
        }
        // A part's layer still carrying the part's full name, which is Figma's default for a new
        // instance, repeats the family at every level (figma-standard rule 9). Only the full name
        // is flagged: copies told apart by a role or a number (`Up`, `Section 1`) are left alone.
        if(n.type==="INSTANCE"&&path){
          const m=await mainOf(n);
          const pn=m?(m.parent&&m.parent.type==="COMPONENT_SET"?m.parent.name:m.name):null;
          const part=pn&&(slotParts.has(pn)||(TOK.internalPrefix&&pn.replace(/^[^\p{L}\p{N}_]+/u,"").startsWith(TOK.internalPrefix)));
          const want=part?lastWord(pn):"";
          if(want&&n.name!==want&&(n.name===pn||n.name===pn.replace(/^_/,"")))
            F.push({sev:"preference",rule:"naming",key:"naming|part-layer|"+at,text:'Layer "'+n.name+'" carries the whole name of the part it holds, so the layers panel repeats the family at every level',
              advice:'Rename the layer "'+want+'".'});
        }
        // figma-standard rule 38: a nested instance with variants of its own, whose text is set by
        // override. The override is stored per variant and dropped when that instance changes
        // variant inside its parent; per-item text belongs in a slot or a property.
        if(n.type==="INSTANCE"&&Array.isArray(n.overrides)&&n.overrides.some(o=>(o.overriddenFields||[]).includes("characters"))){
          const m=typeof n.getMainComponentAsync==="function"?await n.getMainComponentAsync().catch(()=>null):n.mainComponent;
          const set=m&&m.parent&&m.parent.type==="COMPONENT_SET"?m.parent:null;
          if(set&&set.children.length>1)
            F.push({sev:"review",rule:"structure",key:"overrides|nested-text|"+at,text:'"'+n.name+'" sets its text, by override or its own property, on an instance of '+set.name+', so the text is lost whenever that instance switches variant',
              advice:"Expose the text as a property of "+set.name+", or place the part in a slot, so the text survives a variant change."});
        }
        // overlayComponents: an overlay part (a state layer) is locked, stretched both
        // ways, at 0,0 and the size of the layer it sits in. A project's own rule: the
        // parts are named in its settings, and without them the check does not run.
        if(n.type==="INSTANCE"&&par&&OVERLAY){
          const m=typeof n.getMainComponentAsync==="function"?await n.getMainComponentAsync().catch(()=>null):n.mainComponent;
          const nm=m?(m.parent&&m.parent.type==="COMPONENT_SET"?m.parent.name:m.name):null;
          if(nm&&OVERLAY.has(nm)){
            const c=n.constraints||{}, off=[];
            if(n.locked!==true) off.push("unlocked");
            if(c.horizontal!=="STRETCH"||c.vertical!=="STRETCH") off.push("not stretched left and right, top and bottom");
            if(Math.abs(def(n.x,0))>0.01||Math.abs(def(n.y,0))>0.01) off.push("not at 0,0");
            if(Math.abs(n.width-par.width)>0.01||Math.abs(n.height-par.height)>0.01) off.push("not the size of its parent");
            if(off.length){ const e=(overlay[nm]=overlay[nm]||{n:0,how:new Set(),first:curV+" \u203a "+(path||"/")}); e.n++; off.forEach(x=>e.how.add(x)); }
          }
        }
        if("children" in n&&n.type!=="INSTANCE") for(const c of n.children) await walk(c,path+"/"+c.name,n);
      };
      // figma-standard rule 32: text against the nearest opaque surface in the
      // same component, in the mode the variant resolves to, INSIDE nested
      // instances too (a label usually lives in one). A text with no opaque
      // surface under it inside the component is not judged: its surface is
      // wherever the consumer places it. A mixed size or fill is skipped.
      const shade=(n,path,bg)=>{
        if(n.type==="SLOT"||n.visible===false) return;
        if(n.type==="TEXT"&&!curDisabled&&bg&&typeof n.fontSize==="number"){
          const f=solid(n);
          if(f&&f.color){ const a=def(f.opacity,1)*def(n.opacity,1);
            const c={r:f.color.r*a+bg.r*(1-a), g:f.color.g*a+bg.g*(1-a), b:f.color.b*a+bg.b*(1-a)};
            const large=n.fontSize>=24||(n.fontSize>=18.66&&typeof n.fontWeight==="number"&&n.fontWeight>=700);
            const need=large?3:4.5, got=contrastRatio(c,bg);
            M.contrastTotal++;
            if(got>=need) M.contrastPass++;
            else{ const at=path||"/"; const e=(contrast[at]=contrast[at]||{name:n.name,need,min:got,variants:[]}); e.min=Math.min(e.min,got); e.variants.push(curV); }
          }
        }
        const own=solid(n), surface=own&&own.color&&def(own.opacity,1)===1&&def(n.opacity,1)===1&&n.type!=="TEXT"?own.color:bg;
        for(const c of n.children||[]) shade(c,path+"/"+c.name,surface);
      };
      for(const v of vs){ curV=v.name;
        // Its disabled axis True, in any case ("true" happens), from the settings.
        curDisabled=!!(TOK.disabledAxis&&(v.name||"").split(",").some(x=>x.trim().toLowerCase()===(TOK.disabledAxis+"=true").toLowerCase()));
        await walk(v,""); shade(v,"",null); }
      // figma-standard rule 50: a library meant to mirror keeps order in auto
      // layout and names sides by role. Only with rtlLanguages: a project that
      // never mirrors gets none of these, since every library has a left padding.
      if(RTL){
        const D=[], dk=new Set(), add=f=>{ if(!dk.has(f.key)){ dk.add(f.key); D.push(f); } };
        const icon=isIcon(set), desc=set.description||"";
        let revVariants=0;
        // Side by side: two visible children whose x ranges do not overlap and
        // whose y ranges do. That is a row, and only auto layout gives it an
        // order code can reverse.
        const sideBySide=f=>{ const k=(f.children||[]).filter(c=>c.visible!==false&&typeof c.x==="number");
          for(let i=0;i<k.length;i++) for(let j=i+1;j<k.length;j++){ const a=k[i],b=k[j];
            if((a.x+a.width<=b.x||b.x+b.width<=a.x)&&a.y<b.y+b.height&&b.y<a.y+a.height) return true; } return false; };
        let alRow=false; const uneven=new Map();
        const rwalk=async(n,path,par)=>{
          if(n.type==="SLOT"||(path&&n.visible===false)) return false;
          const at=path||"/", nm=path?n.name:set.name; let rev=false;
          const main=n.type==="INSTANCE"?await mainOf(n):null;
          const mn=main?(main.parent&&main.parent.type==="COMPONENT_SET"?main.parent.name:main.name):"";
          const free=n.type!=="INSTANCE"&&"layoutMode" in n&&n.layoutMode==="NONE"&&"children" in n;
          // The structure family raises every frame without auto layout as a
          // review; a row is the stronger case here, so it replaces that row.
          if(!icon&&free&&sideBySide(n)){ rev=true; const d=F.findIndex(f=>f.key==="structure|no-autolayout|"+at); if(d>=0) F.splice(d,1); add({sev:"warning",rule:"direction",key:"direction|no-autolayout|"+at,
            text:'"'+(path?n.name:set.name)+'" lays its layers side by side without auto layout, so they keep their order when the layout mirrors for '+LANGS,
            advice:'Select "'+(path?n.name:set.name)+'" and add auto layout (Shift+A), so the row has an order code can reverse.'}); }
          // A text layer is named after what it says ("3 days left"), and an
          // instance after its component until renamed ("arrow-left"): neither
          // is a name anyone chose for a side.
          if(!icon&&path&&n.type!=="TEXT"&&!(n.type==="INSTANCE"&&(!main||n.name===(main.name||"")||n.name===mn))&&SIDE.test(n.name)) add({sev:"warning",rule:"direction",key:"direction|side-name|"+at,
            text:'Layer "'+n.name+'" names a side, so the name is false once the layout mirrors for '+LANGS+', and it travels into Dev Mode and code',
            advice:'Rename it by role: "'+bySide(n.name)+'".'});
          // A layer taken out of the flow and pinned to one edge stays on that
          // edge when the row mirrors. A stretched or centred one (a focus ring,
          // a state layer) covers both sides and is not pinned: counting those
          // put a 120-variant icon-only set in the wrong column.
          const h=n.constraints&&n.constraints.horizontal;
          // In a frame without auto layout every layer is pinned; one that sits
          // off-centre on one side (a badge on an avatar) is the same bug. A
          // centred one is not, and a row is raised once as no-autolayout.
          // Centred, or covering both edges (a focus ring drawn 2px outside), is
          // on no side, whatever its constraint says.
          const even=par&&typeof n.x==="number"&&typeof par.width==="number"&&(Math.abs(n.x-(par.width-n.x-n.width))<=1||(n.x<=0&&n.x+n.width>=par.width));
          const covers=c=>c.visible!==false&&typeof c.x==="number"&&c.x<=0&&c.y<=0&&c.x+c.width>=par.width&&c.y+c.height>=par.height;
          const loose=!icon&&par&&par.layoutMode==="NONE"&&!sideBySide(par)&&!onlyShapes(par)&&(par.children||[]).some(c=>c!==n&&covers(c));
          if(path&&!icon&&!even&&(n.layoutPositioning==="ABSOLUTE"||loose)&&(h==="MIN"||h==="MAX")) add({sev:"warning",rule:"direction",key:"direction|pinned|"+at,
            text:'"'+n.name+'" is '+(loose&&n.layoutPositioning!=="ABSOLUTE"?"placed in a frame without auto layout":"positioned absolutely")+' and pinned to the '+(h==="MIN"?"left":"right")+", so in "+LANGS+" it stays on that side while the layout around it mirrors",
            advice:(loose&&n.layoutPositioning!=="ABSOLUTE"?'Add auto layout to "'+par.name+'" (Shift+A) and put "'+n.name+'" in the flow':'Set its position to Auto (in the flow)')+', or keep it '+(loose&&n.layoutPositioning!=="ABSOLUTE"?"where it is":"absolute")+' and add to the description\'s Right to left section: "'+n.name+': pinned to the '+(h==="MIN"?"leading":"trailing")+' edge."',line:n.name+": pinned to the "+(h==="MIN"?"leading":"trailing")+" edge"});
          if(!icon&&path&&DIR_SHAPE.test(n.name)&&pointsSide(n.name)&&(n.type==="VECTOR"||n.type==="BOOLEAN_OPERATION")) add({sev:"warning",rule:"direction",key:"direction|flat-icon|"+at,
            text:'"'+n.name+'" is a directional icon drawn into the component, so it can only face the other way in '+LANGS+" by forking the component",
            advice:'Replace "'+n.name+'" with an instance of the library\'s icon, and expose it as an instance-swap property so the icon can face the other way.'});
          if(n.type!=="INSTANCE"&&"layoutMode" in n){
            const flow=(n.children||[]).filter(c=>c.layoutPositioning!=="ABSOLUTE");
            if(n.layoutMode!=="NONE"&&typeof n.paddingLeft==="number"&&n.paddingLeft!==n.paddingRight){ const k=nm+": "+n.paddingLeft+" leading, "+n.paddingRight+" trailing"; if(!uneven.has(k)) uneven.set(k,{at,name:nm,l:n.paddingLeft,r:n.paddingRight}); }
            if(n.layoutMode==="HORIZONTAL"){
              if(flow.length>=2){ rev=true; alRow=true; }
              if(n.primaryAxisAlignItems==="MAX") add({sev:"review",rule:"direction",key:"direction|end-align|"+at,
                text:'"'+nm+'" aligns its content to the right, which code mirrors to the left in '+LANGS+" only if it is written as end, not right",
                advice:'Add to the description\'s Right to left section: "'+nm+': aligned to the trailing side."',line:nm+": aligned to the trailing side"});
            }
            if(n.layoutMode==="VERTICAL"&&n.counterAxisAlignItems==="MAX") add({sev:"review",rule:"direction",key:"direction|end-align|"+at,
              text:'"'+nm+'" aligns its content to the right, which code mirrors to the left in '+LANGS+" only if it is written as end, not right",
              advice:'Add to the description\'s Right to left section: "'+nm+': aligned to the trailing side."',line:nm+": aligned to the trailing side"});
          }
          const cr=["topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius"].map(k=>n[k]);
          if(!icon&&n.type!=="INSTANCE"&&cr.every(x=>typeof x==="number")&&(cr[0]!==cr[1]||cr[2]!==cr[3])) add({sev:"review",rule:"direction",key:"direction|corners|"+at+"|"+cr.join(" "),
            text:'"'+nm+'" rounds its corners differently on the left and the right, so the shape faces the wrong way in '+LANGS+" unless the corners mirror too",
            advice:'Add to the description\'s Right to left section: "'+nm+": corners "+cr[0]+" "+cr[1]+" "+cr[3]+" "+cr[2]+' (top leading, top trailing, bottom trailing, bottom leading)."',line:nm+": corners "+cr[0]+" "+cr[1]+" "+cr[3]+" "+cr[2]+" (top leading, top trailing, bottom trailing, bottom leading)"});
          // An icon instance that no instance-swap property controls can only face
          // the other way by detaching it or forking the component.
          // Type that cannot follow the script. A mode switches a typeface only
          // through a variable; tracking pulls joined Arabic letters apart; and
          // Arabic has no capitals. One row per text style, not per layer.
          if(!icon&&n.type==="TEXT"){
            const st=await styleOf(n), sb=(st&&st.boundVariables)||{}, lb=n.boundVariables||{}, sn=st?st.name:n.name;
            const fam=n.fontName&&typeof n.fontName==="object"?n.fontName.family||"":"";
            const fk=(st&&st.id)||sn;
            // A style is fixed once for the file, not once per set that uses it.
            if(st&&!sb.fontFamily&&!lb.fontFamily&&!KEEP_FACE.test(fam+" "+sn)&&!FONT_SEEN.has(fk)&&FONT_SEEN.add(fk)) add({sev:"warning",rule:"direction",key:"direction|font-fixed|"+sn,
              text:'Text style "'+sn+'" names its typeface directly, so a frame set to '+LANGS+" keeps the Latin typeface, and "+LANGS+" letters fall back to whatever font the device has",
              advice:(st.remote?'In the library that publishes text style "'+sn+'"':'In text style "'+sn+'"')+', bind Font family to a string variable (font/family) whose '+LANGS+" mode names the "+LANGS+" typeface."});
            const ls=n.letterSpacing&&typeof n.letterSpacing==="object"?n.letterSpacing:null;
            if(ls&&ls.value>0&&!sb.letterSpacing&&!lb.letterSpacing) add({sev:"review",rule:"direction",key:"direction|tracking|"+sn,
              text:'"'+sn+'" adds letter spacing ('+ls.value+(ls.unit==="PERCENT"?"%":"px")+"), which pulls joined "+LANGS+" letters apart",
              advice:'In text style "'+sn+'", bind Letter spacing to a variable that is 0 in the '+LANGS+" mode."});
            const cn=typeof n.textCase==="string"?CASE_NAME[n.textCase]:null;
            if(cn) add({sev:"review",rule:"direction",key:"direction|text-case|"+sn,
              text:'"'+sn+'" sets its text in '+cn+", which "+LANGS+" does not have",
              advice:'Add to the description\'s Right to left section: "'+sn+': '+cn+' in Latin only."',line:sn+": "+cn+" in Latin only"});
          }
          // Alignment is physical in Figma and no mode changes it. It only shows
          // where the box is wider than its text, so a hugging label is exempt.
          if(!icon&&n.type==="TEXT"&&(n.textAlignHorizontal==="LEFT"||n.textAlignHorizontal==="RIGHT")&&n.textAutoResize!=="WIDTH_AND_HEIGHT"){
            const side=n.textAlignHorizontal==="LEFT"?"leading":"trailing";
            add({sev:"review",rule:"direction",key:"direction|text-align|"+side,
              text:'"'+n.name+'" is wider than its text and aligned '+n.textAlignHorizontal.toLowerCase()+", which stays "+n.textAlignHorizontal.toLowerCase()+" in "+LANGS+" unless code writes it as "+(side==="leading"?"start":"end"),
              advice:'Add to the description\'s Right to left section: "Text: aligned to the '+side+' side."',line:"Text: aligned to the "+side+" side"}); }
          // Only an icon: a Next button in a pager is a button, not an icon.
          if(!icon&&path&&main&&iconNode(main)&&!(n.componentPropertyReferences&&n.componentPropertyReferences.mainComponent)){
            const md=mn+(main.parent&&main.parent.type==="COMPONENT_SET"?" "+main.name:""), all=n.name+" "+md;
            if(DIR_WORD.test(all)&&pointsSide(VERT.test(md)||HORIZ.test(md)?md:all)&&!MEDIA.test(all)) add({sev:"warning",rule:"direction",key:"direction|fixed-icon|"+at,
              text:'"'+n.name+'" is a directional icon'+(mn&&mn!==n.name?" ("+mn+")":"")+" that no instance-swap property controls, so nobody using the component can make it face the other way in "+LANGS,
              advice:'Select "'+n.name+'", and in the Design panel\'s instance section choose Create instance swap property; name it Icon.'});
          }
          if("children" in n&&n.type!=="INSTANCE") for(const c of n.children) if(await rwalk(c,path+"/"+c.name,n)) rev=true;
          return rev;
        };
        for(const v of vs) if(await rwalk(v,"")) revVariants++;
        // Property names and variant options are the component's interface, so a
        // side in them reaches every consumer and Code Connect; renaming one is a
        // breaking change, which is why it stays in bucket 3.
        if(!icon) for(const [k,d] of Object.entries(defs)){ const nm=k.replace(/#[^#]*$/,"");
          if(SIDE.test(nm)) add({sev:"warning",rule:"direction",key:"direction|side-prop|"+nm,
            text:'Property "'+nm+'" names a side, so it is false once the layout mirrors for '+LANGS+", and code takes the name from it",
            advice:'Rename the property "'+bySide(nm)+'", and tell consumers: it is a breaking change.'});
          const so=d.type==="VARIANT"?(d.variantOptions||[]).filter(o=>SIDE.test(o)):[];
          if(so.length) add({sev:"warning",rule:"direction",key:"direction|side-option|"+nm,
            text:nm+" = "+so.join(", ")+" name"+(so.length>1?"":"s")+" a side, so "+(so.length>1?"they are":"it is")+" false once the layout mirrors for "+LANGS+", and code takes the value"+(so.length>1?"s":"")+" from "+(so.length>1?"them":"it"),
            advice:"Rename "+so.map(o=>'"'+o+'" to "'+bySide(o)+'"').join(", ")+", and tell consumers: it is a breaking change."}); }
        // One row per set, every distinct pair named: Size S at 8/4 and L at
        // 12/8 are two lines, or the note would give one size's values for all.
        if(uneven.size){ const u=[...uneven.values()], one=u.length===1&&u[0].name===set.name;
          const line="Padding: "+(one?u[0].l+" leading, "+u[0].r+" trailing":[...uneven.keys()].join("; "));
          add({sev:"review",rule:"direction",key:"direction|padding|"+u[0].at,
          text:'"'+u[0].name+'" has '+u[0].l+" padding on the left and "+u[0].r+" on the right"+(u.length>1?" ("+u.length+" uneven paddings in the set)":"")+", so in "+LANGS+" the two must swap, which code does only if it writes them as leading and trailing",
          advice:'Add to the description\'s Right to left section: "'+line+'."',line}); }
        if(revVariants){ M.rtlSets++; M.rtlVariants+=revVariants; }
        // Where designers draw right-to-left screens before code, an instance
        // cannot reverse its own parts, so the set carries both directions.
        const dirAxis=Object.entries(defs).find(([k,d])=>d.type==="VARIANT"&&/^direction$/i.test(k)&&(d.variantOptions||[]).some(o=>/^rtl$/i.test(o)));
        // An RTL twin is drawn by hand or by a plugin, so check it against its
        // LTR twin layer by layer: every row's in-flow parts reversed, and every
        // wide text aligned to the other side. Layers are matched by path of
        // names, so two siblings with one name are compared as one (a limit).
        if(TOK.rtlInFigma===true&&dirAxis){ const ax=dirAxis[0];
          const props=v=>v.variantProperties||Object.fromEntries((v.name||"").split(/,\s*/).map(kv=>{const k=kv.indexOf("=");return [kv.slice(0,k).trim(),kv.slice(k+1).trim()];}));
          const others=o=>Object.entries(o).filter(([k])=>k!==ax).map(([k,x])=>k+"="+x).sort().join(",");
          const index=(n,path,out)=>{ if(path&&n.visible===false) return out; out[path]=n; if(n.type!=="INSTANCE") for(const c of n.children||[]) index(c,path+"/"+c.name,out); return out; };
          const parts=f=>(f.children||[]).filter(c=>c.layoutPositioning!=="ABSOLUTE").map(c=>c.name);
          const FLIP={LEFT:"RIGHT",RIGHT:"LEFT"};
          for(const v of vs){ const pv=props(v); if(!/^rtl$/i.test(pv[ax]||"")) continue;
            const twin=vs.find(w=>w!==v&&/^ltr$/i.test(props(w)[ax]||"")&&others(props(w))===others(pv));
            if(!twin){ add({sev:"review",rule:"direction",key:"direction|rtl-twin|"+v.name,
              text:'"'+v.name+'" has no Direction=LTR twin with the same other properties, so nothing says what it mirrors',
              advice:'Add the LTR variant matching "'+v.name+'", or remove this RTL one.'}); continue; }
            const A=index(v,"",{}), B=index(twin,"",{});
            for(const [path,n] of Object.entries(A)){ const t=B[path]; if(!t) continue; const where=path===""?'"'+v.name+'"':'"'+n.name+'" in "'+v.name+'"';
              // An instance's parts come from its component, which is checked there.
              const same=JSON.stringify(parts(n).slice().sort())===JSON.stringify(parts(t).slice().sort());
              if(n.type!=="INSTANCE"&&n.layoutMode==="HORIZONTAL"&&t.layoutMode==="HORIZONTAL"&&!same) add({sev:"warning",rule:"direction",key:"direction|rtl-parts|"+v.name+"|"+path,
                  text:where+" holds "+parts(n).join(", ")+" where its LTR twin holds "+parts(t).join(", ")+", so the two directions differ in more than order",
                  advice:"Rename or replace the layers of "+where+" so it holds "+parts(t).slice().reverse().join(", ")+", the LTR parts reversed."});
              else if(n.type!=="INSTANCE"&&n.layoutMode==="HORIZONTAL"&&t.layoutMode==="HORIZONTAL"&&JSON.stringify(parts(n))!==JSON.stringify(parts(t).slice().reverse()))
                add({sev:"warning",rule:"direction",key:"direction|rtl-order|"+v.name+"|"+path,
                  text:where+" does not hold its LTR twin's parts in reverse ("+parts(n).join(", ")+" against "+parts(t).join(", ")+"), so the Arabic mockup shows an order code will not produce",
                  advice:"Reorder the layers of "+where+" to "+parts(t).slice().reverse().join(", ")+"."});
              if(n.type==="TEXT"&&t.type==="TEXT"&&FLIP[t.textAlignHorizontal]&&n.textAutoResize!=="WIDTH_AND_HEIGHT"&&n.textAlignHorizontal!==FLIP[t.textAlignHorizontal])
                add({sev:"warning",rule:"direction",key:"direction|rtl-align|"+v.name+"|"+path,
                  text:where+" is wider than its text and aligned "+String(n.textAlignHorizontal).toLowerCase()+", the same as its LTR twin, so the Arabic mockup shows it on the wrong side",
                  advice:"Select "+where+" and set its alignment to "+FLIP[t.textAlignHorizontal].toLowerCase()+"."});
            } } }
        if(TOK.rtlInFigma===true&&!icon&&revVariants&&!dirAxis) add({sev:"warning",rule:"direction",key:"direction|no-variant",
          text:set.name+" has a row whose parts reverse in "+LANGS+", and the project draws "+LANGS+" screens in Figma, where an instance cannot reverse its own parts",
          advice:"Add a variant property Direction with options LTR and RTL, and draw each RTL variant mirrored (or generate them with a mirroring plugin), following the set's Right to left note."});
        if(icon&&DIR_WORD.test(set.name)&&pointsSide(set.name)&&!ICON_NOTE.test(desc)) add({sev:"warning",rule:"direction",key:"direction|icon-decision",
          text:"Icon "+set.name+" points a direction, and nothing records whether it mirrors in "+LANGS+", so a developer guesses",
          advice:'Add "Right to left: '+(MEDIA.test(set.name)?"stays":"mirrors")+'" to its description'+(MEDIA.test(set.name)?", since playback controls keep their direction":", since it points the way the reader moves")+'; write the other word if this icon is the exception.'});
        if(!icon&&(D.length||revVariants)&&!RTL_NOTE.test(desc)) add({sev:"review",rule:"direction",key:"direction|note",
          text:set.name+" has parts that change, or must not change, when it mirrors for "+LANGS+", and its description does not say which",
          advice:"Add to the description:\n\n## Right to left\n"+["- Mirrors: "+(alRow?"the order of its parts":"nothing beyond what follows")].concat(D.filter(f=>f.line).map(f=>"- "+f.line)).concat(["- Stays: nothing"]).join("\n")+"\n\nIf a part must keep its direction (playback controls, a chart), name it on the Stays line."});
        F.push(...D);
      }
      for(const [nm,e] of Object.entries(overlay))
        F.push({sev:"warning",rule:"structure",key:"structure|overlay|"+nm,
          text:e.n+" "+nm+" instance"+(e.n===1?" is":"s are")+" "+[...e.how].join(", ")+", so the tint drifts off the shape it covers or gets dragged instead of the content, e.g. "+e.first,
          advice:"Lock each "+nm+", set its constraints to Left and right and Top and bottom, and place it at 0,0 at its parent's size."});
      for(const [at,e] of Object.entries(contrast))
        F.push({sev:"error",rule:"accessibility",key:"accessibility|contrast|"+at,
          text:'Text "'+e.name+'" has '+(Math.floor(e.min*10)/10)+":1 contrast against its surface, below the "+e.need+":1 minimum, so many people cannot read it, in "+e.variants.length+" variant"+(e.variants.length===1?"":"s")+" \u2014 e.g. "+e.variants.slice(0,3).join("; "),
          advice:"Darken the text or lighten its surface, with a colour pair the library already passes, until it reaches "+e.need+":1."});
      // states that render nothing
      if(set.type==="COMPONENT_SET"&&SAXIS&&SREST&&defs[SAXIS]){
        const parse=n=>variantValues(n.name);
        const sig=v=>{const a=[];const g=(n,path)=>{const pt=x=>Array.isArray(x)?x.filter(y=>y.visible!==false).map(y=>y.type==="SOLID"?[Math.round(y.color.r*255),Math.round(y.color.g*255),Math.round(y.color.b*255),Math.round(def(y.opacity,1)*100)].join(","):y.type).join("/"):"";
            // The root's NAME is "Axis=Value" and must not enter the signature; its
            // fills, strokes, effects and opacity must, because that is where states
            // render (§3.5a). Dropping the whole root line reported two navigation
            // components' Hover and Press as identical to Rest when the state fill
            // sat on the root itself, 2026-09-08.
            a.push(path+" "+(path===""?"(root)":n.name)+" f["+pt(n.fills)+"] s["+pt(n.strokes)+"] e["+def(n.effects,[]).filter(e=>e.visible!==false).length+"] o"+def(n.opacity,1)+" v"+(n.visible!==false));
            if("children" in n)n.children.forEach((c,i)=>g(c,path+"/"+i));};
          g(v,""); return a.join("\n");};
        for(const v of vs){const q=parse(v);
          if(!SREST) continue;
          if(!q[SAXIS]||q[SAXIS]===SREST) continue;
          const rest=vs.find(o=>{const r=parse(o);return r[SAXIS]===SREST&&Object.keys(q).every(k=>k===SAXIS||r[k]===q[k]);});
          if(rest&&sig(v)===sig(rest)) F.push({sev:"error",rule:"states",key:"states|"+v.name,text:v.name+" looks identical to its "+SREST+" sibling, so people get no sign the component is in that state",visible:true,
            advice:"Give the "+q[SAXIS]+" variant a visible change from "+SREST+": a fill, a border or a ring."});}
        // figma-standard rule 48: a variant binds the tokens of its own state.
        // A token names a state when one piece of its name (split on / and -)
        // is one of the axis's values. Two shapes are mistakes: another
        // non-resting state's token (Hover in Press), and a resting token
        // that the resting sibling does not carry on the same layer, i.e.
        // one added in this state only (a square Rest fill painted behind a
        // rounded Hover button). A part that keeps its resting token in
        // every state (a switch knob) carries it in Rest too, so it passes.
        // Hidden layers and nested instances are skipped: a focus ring
        // hidden at Rest still holds its Focus binding. Layers pair by their
        // name path, not their index: a Loading spinner or a Focus ring
        // inserted ahead of the content shifts every index after it, and the
        // index pairing raised 47 false hits on the library this came from.
        // A state no token in the set names (Loading, Drag over) borrows the
        // resting tokens by design, so it is not checked.
        const SVALS=(SCALES[SAXIS]||[]).map(x=>x.toLowerCase());
        const stateOf=nm=>{const ps=(nm||"").toLowerCase().split(/[\/\-]/);return SVALS.find(s=>ps.includes(s))||null;};
        const binds=async v=>{const out=[];const g=async(n,path)=>{if(n.visible===false) return;
            for(const [field,bv] of Object.entries(n.boundVariables||{})) for(const a of [].concat(bv)){ if(!a||!a.id) continue;
              const t=await resolveVar(a.id); if(t) out.push({path,field,layer:path===""?"(root)":n.name,name:t.name}); }
            if(n.type!=="INSTANCE"&&"children" in n) for(const c of n.children) await g(c,path+"/"+c.name);};
          await g(v,""); return out;};
        const tokenStates=new Set();
        for(const v of vs) for(const x of await binds(v)){const s=stateOf(x.name); if(s) tokenStates.add(s);}
        const restBinds={};
        for(const v of vs){const q=parse(v); if(!q[SAXIS]||q[SAXIS]===SREST||!tokenStates.has(q[SAXIS].toLowerCase())) continue;
          const rest=vs.find(o=>{const r=parse(o);return r[SAXIS]===SREST&&Object.keys(q).every(k=>k===SAXIS||r[k]===q[k]);});
          if(rest&&!restBinds[rest.name]) restBinds[rest.name]=new Set((await binds(rest)).map(x=>x.path+"|"+x.field+"|"+x.name));
          const mine=q[SAXIS].toLowerCase(), wrong=[];
          for(const x of await binds(v)){ const s=stateOf(x.name); if(!s||s===mine) continue;
            if(s!==SREST.toLowerCase()||(rest&&!restBinds[rest.name].has(x.path+"|"+x.field+"|"+x.name))) wrong.push(x.layer+" "+x.field+" → "+x.name); }
          if(wrong.length) F.push({sev:"warning",rule:"states",key:"states|token|"+v.name,
            text:v.name+" binds another state's token ("+wrong.slice(0,3).join("; ")+"), so it shows the wrong state's colour",
            advice:"Bind the "+q[SAXIS]+" token, or remove the binding if that layer should not change in this state."});}
      }
      // Interactive components: a set with the state axis. Three WCAG checks
      // a library can make before anything is built, each skipped without
      // its setting.
      if(SAXIS&&defs[SAXIS]){
        const opts=defs[SAXIS].variantOptions||[];
        // figma-standard rule 39 (WCAG 2.4.7): a focus state exists. Whether
        // it renders differently from Rest is the states check above.
        if(TOK.focusState&&!opts.includes(TOK.focusState))
          F.push({sev:"error",rule:"accessibility",key:"accessibility|focus",text:"This interactive component has no "+TOK.focusState+" state ("+SAXIS+": "+opts.join(" \u00b7 ")+"), so people using a keyboard cannot see when it has focus",
            advice:"Add a "+TOK.focusState+" variant with a visible ring at 3:1 or more against what surrounds it."});
        // figma-standard rule 26 (WCAG 2.5.8): each variant at least the
        // minimum target on both sides. A review: a transparent hit area
        // around a smaller shape can meet it.
        if(TOK.minTarget){
          const small=vs.filter(v=>typeof v.width==="number"&&typeof v.height==="number"&&(v.width<TOK.minTarget||v.height<TOK.minTarget));
          if(small.length){ const v=small.reduce((m,x)=>Math.min(x.width,x.height)<Math.min(m.width,m.height)?x:m,small[0]);
            F.push({sev:"review",rule:"accessibility",key:"accessibility|target",text:small.length+" variant"+(small.length===1?" is":"s are")+" under the "+TOK.minTarget+"px target, smallest "+Math.round(v.width)+"\u00d7"+Math.round(v.height)+" ("+v.name+"), so people with a finger or an unsteady hand miss it",
              advice:"Give each variant a hit area of at least "+TOK.minTarget+"\u00d7"+TOK.minTarget+": grow the frame, or record that a transparent area around the shape meets it."}); }
        }
        // figma-standard rule 40 (WCAG 4.1.2): an interactive component with no
        // text of its own (an icon button) carries its accessible name, as a
        // text property or a Dev Mode annotation.
        // A label inside a nested instance (a `_Label` part) is text of its own.
        const hasText=n=>n.type==="TEXT"||(n.children||[]).some(hasText);
        const annotated=n=>(Array.isArray(n.annotations)&&n.annotations.length>0)||(n.type!=="INSTANCE"&&(n.children||[]).some(annotated));
        const textProp=Object.values(defs).some(d=>d.type==="TEXT");
        if(!textProp&&!vs.some(hasText)&&!vs.some(annotated)&&!(Array.isArray(set.annotations)&&set.annotations.length))
          F.push({sev:"review",rule:"accessibility",key:"accessibility|name",text:"This interactive component has no text of its own, no text property and no annotation for its name, so a screen reader has nothing to announce",
            advice:"Add a text property for its accessible name, or a Dev Mode annotation that names it."});
      }
      // unused non-variant properties
      const refs=new Set(); const sc=n=>{const r=n.componentPropertyReferences;if(r)for(const k of Object.keys(r))if(r[k])refs.add(r[k]);if("children" in n)n.children.forEach(sc);}; vs.forEach(sc);
      // An error, and the text carries the consequence: Figma drops the whole
      // component at publication while one exists. As a bare "warning" the judge
      // wrote "adds noise to the props table" and filed it beside questions,
      // on the one check whose result is a component consumers never receive.
      for(const k of Object.keys(defs)) if(defs[k].type!=="VARIANT"&&defs[k].type!=="SLOT"&&!refs.has(k))
        F.push({sev:"error",rule:"properties",key:"properties|unused|"+k.split("#")[0],text:'Property "'+k.split("#")[0]+'" is declared but no layer uses it, so the component will not publish while it exists',
          advice:"Delete the property, or connect it to the layer it was meant for."});
      // A layer WIRED IN SOME VARIANTS AND NOT IN OTHERS. The check above passes
      // the moment ONE layer references a property, so a set can declare
      // "Label text", have a single variant use it, and leave the other hundred
      // labels hard-coded with nothing anywhere saying so. Read the other
      // direction: within one set, a layer carrying a reference in some variants
      // and not in others is a wiring that was missed, never a design.
      //
      // Keyed by PATH, never by name, and that distinction is the whole check.
      // One variant of a text field holds four layers called "Label" — the part
      // instance, its inner text, the field's static placeholder and the error
      // message's text — and keying by name collapsed them into one 9-on/9-off
      // finding on three different components, every one of them wrong. The
      // path below the variant root is what a twin shares across variants; the
      // root's own name is left out because it IS the variant name.
      //
      // A path alone is still not an identity, because the SET of children is
      // not stable across variants even when their order is. Two shapes of that
      // on one library, five rows, all false: a Button's Loading variants hold
      // one "Icon container" in Content — the spinner — where the others hold
      // the left icon, a label and the right icon, so the same path named the
      // spinner in 18 variants and the left icon in 90; and an input whose
      // leading icon exists only with a value made "Field > Icon container"
      // the chevron when the value was absent and the leading icon when it was
      // there. So a layer is keyed by its path AND what it is — its type, and
      // for an instance the names of what it holds — and, for `visible` only,
      // whether it is its parent's only child: a boolean cannot hide the only
      // child of a container without emptying it, so an icon that stands alone
      // in Icon-only variants and beside a label elsewhere is two slots. That
      // last class is a class, not an exemption — a wrapper's only child that
      // is wired in six variants and forgotten in four still fires.
      //
      // Per reference KIND, because a layer can legitimately take its text from
      // a property and its visibility from nothing. The both-lists-non-empty
      // guard is what keeps it quiet: a layer no variant wires (a spinner, a
      // static caption) never fires, and neither does one every variant wires,
      // and a layer that only exists in some variants is only counted where it
      // exists. Found by a maintainer's eye on a Button whose three size sets
      // had just been merged into one: the md and sm labels lost their
      // `characters` reference when three text properties collapsed to one, 36
      // of 108 stayed bound, and every check in this file reported it clean.
      const KINDS=["characters","mainComponent","visible"];
      const KINDNAME={characters:"a text property",mainComponent:"an instance-swap property",visible:"a boolean property"};
      const wired={};
      for(const v of vs){const g=(n,at,alone)=>{
        const r=n.componentPropertyReferences||{};
        const what=n.type+(n.type==="INSTANCE"?":"+(n.children||[]).map(c=>c.name).join("|"):"");
        for(const k of KINDS){
          if(k==="characters"&&n.type!=="TEXT") continue;
          if(k==="mainComponent"&&n.type!=="INSTANCE") continue;
          const key=at+"\u0000"+what+(k==="visible"&&alone?"\u0000alone":"");
          const s=(wired[key]=wired[key]||{at:at,key:key}), t=(s[k]=s[k]||{on:0,off:[]});
          if(r[k]) t.on++; else t.off.push(v.name);
        }
        // Same-named SIBLINGS get an ordinal. A dialog footer holds two layers
        // both called "Button" — the primary, always visible, and the secondary,
        // wired to a boolean — and a path alone reads them as one layer wired in
        // half its variants. The ordinal tells present twins apart; the identity
        // key above covers the variants where one of them is missing.
        if("children" in n&&n.type!=="INSTANCE"){
          const seen={};
          for(const c of n.children){
            const i=(seen[c.name]=(seen[c.name]||0)+1);
            const step=c.name+(i>1?"["+i+"]":"");
            g(c,at?at+" > "+step:step,n.children.length===1);
          }
        }
      }; g(v,"",false);}
      for(const kinds of Object.values(wired))
        for(const k of KINDS){
          const at=kinds.at, t=kinds[k]; if(!t||!t.on||!t.off.length) continue;
          F.push({sev:"error",rule:"properties",visible:true,key:"properties|wired|"+k+"|"+kinds.key.replace(/\u0000/g,"|"),
            text:'"'+at+'" ignores '+KINDNAME[k]+' in '+t.off.length+' of '+(t.on+t.off.length)+' variants, so setting the property on an instance leaves those unchanged'+
                 " \u2014 e.g. "+t.off.slice(0,3).join("; "),
            advice:'Connect "'+at+'" to '+KINDNAME[k]+' in '+(t.off.length===1?"the variant that misses it":"the "+t.off.length+" variants that miss it")+'.'});
        }
      // figma-standard rule 25: a public component's missing description is an error, a private part's is hygiene.
      const isPrivate=!!(TOK.internalPrefix&&set.name.replace(/^[^\p{L}\p{N}_]+/u,"").startsWith(TOK.internalPrefix));
      // figma-standard rule 25: a placeholder is no description — one matching the project's
      // descriptionPlaceholder, shorter than its minDescription, or only the component's own name —
      // and tiered as an empty one is. Each setting skips its half when absent; a description that
      // repeats the name is one anywhere. It does not stand in for the guidance sections below,
      // which a placeholder lacks as well.
      const d0=(set.description||"").trim();
      if(d0&&((TOK.descriptionPlaceholder&&new RegExp(TOK.descriptionPlaceholder,"i").test(d0))||d0.toLowerCase()===set.name.toLowerCase()||(TOK.minDescription&&d0.length<TOK.minDescription)))
        F.push({sev:isPrivate?"hygiene":"error",rule:"metadata",key:"metadata|placeholder",
          text:'The description is a placeholder ("'+d0+'"), so people and agents reading the library cannot tell what the component is for',
          advice:isPrivate?"Replace it with a sentence or two saying what the part is and which component it belongs to.":"Replace it with the description: what it is, when to use it and when not to, and how to build it."});
      if(!(set.description||"").trim()) F.push({sev:isPrivate?"hygiene":"error",rule:"metadata",key:"metadata|description",
        text:"No description, so people and agents reading the library cannot tell what the component is for",
        advice:isPrivate?"Write a sentence or two saying what the part is and which component it belongs to.":"Write the description: what it is, when to use it and when not to, and how to build it."});
      // figma-standard rule 25: a public component's description says when to
      // use it (Usage), when not to and what instead (Don't), and how to build
      // it (Code gen notes) — the parts that steer a person's or an agent's
      // choice. A slot part is chosen through its parent, so owes none.
      // Only where the project names its private prefix: without it a private
      // part reads as public and would be asked for sections it never owes.
      else if(TOK.internalPrefix&&!isPrivate&&!slotParts.has(set.name)){
        const d=set.descriptionMarkdown||set.description||"";
        const has=k=>SECTION_RE[k].test(d);
        M.guidable++;
        if(has("usage")&&has("dont")&&has("code")) M.guided++;
        const miss=[["usage","Usage"],["dont","Don't"]].filter(([k])=>!has(k)).map(([,l])=>l);
        if(miss.length) F.push({sev:"warning",rule:"metadata",key:"metadata|guidance",text:"The description has no "+miss.join(" or ")+" section, so whoever picks a component cannot tell when this one fits and when another does",
          advice:"Add "+miss.join(" and ")+" as headings in the description, each with a line or two."});
        if(!has("code")) F.push({sev:"review",rule:"metadata",key:"metadata|guidance-code",text:"The description has no Code gen notes section, so code generated from the library has to guess how the component is built",
          advice:"Add a Code gen notes heading saying how to build it: the element, its props and what it composes."});
      }
      // A variant can hold a description of its own, read in its place wherever that variant is
      // selected or read. Rewriting the set's leaves those copies saying what it used to: five
      // sets of one library carried them, one a different component's text (2026-10-25).
      if(set.type==="COMPONENT_SET"){
        const own=vs.filter(v=>(v.description||"").trim()&&v.description!==set.description);
        if(own.length) F.push({sev:"warning",rule:"metadata",key:"metadata|variant-description",
          text:own.length+" of "+vs.length+" variants carry a description that differs from the set's, so whoever reads "+(own.length===1?"that variant":"those variants")+" gets text the set's description does not say \u2014 e.g. "+own.slice(0,3).map(v=>v.name).join("; "),
          advice:"Clear the variants' descriptions so the set's is the one read, or give each the set's text."});
      }
      // The component's OWN name. This is the one that reaches consumers and the
      // export: a set named " List item - Selection" is indistinguishable from a
      // clean one on the canvas, and the exporter composed it with its page name
      // into a component nobody could account for.
      if(set.name!==set.name.trim()) F.push({sev:"error",rule:"naming",visible:true,key:"naming|component-ws",
        text:'Component name "'+set.name+'" has a space at its start or end, which nobody sees on the canvas and which doubles the component in exports and code',
        advice:'Rename the component "'+set.name.trim().replace(/\s{2,}/g," ")+'".'});
      if(/\s{2,}/.test(set.name)) F.push({sev:"warning",rule:"naming",key:"naming|component-double",text:'Component name "'+set.name+'" has a double space, which nobody sees on the canvas and which breaks search and anything matching the component by name',
        advice:'Rename the component "'+set.name.trim().replace(/\s{2,}/g," ")+'".'});
      if(TOK.propertyCase==="sentence"&&capsInside(set.name)) F.push({sev:"preference",rule:"naming",key:"naming|component-case",text:'Component name "'+set.name+'" is not in sentence case, so it reads unlike the rest of the assets panel and unlike the name code takes from it',
        advice:"Rename it in sentence case, keeping acronyms in capitals."});
      // Option ORDER against the recorded scale. Membership is not checked: a set
      // uses whichever subset of the scale it needs, and a missing step is a
      // coverage question, not an ordering one.
      // figma-standard rule 1: the state axis is last, the disabled axis immediately
      // before it, and a True/False axis without a recorded order lists its default first.
      const axes=Object.entries(defs).filter(([,d])=>d.type==="VARIANT").map(([k])=>k);
      if(SAXIS&&axes.includes(SAXIS)&&axes[axes.length-1]!==SAXIS)
        F.push({sev:"warning",rule:"schema",key:"schema|axis-order|state",text:SAXIS+" is not the last axis ("+axes.join(" \u00b7 ")+"), so its variant picker and properties read in a different order from every other component",advice:"Move "+SAXIS+" to the end of the axes."});
      if(TOK.firstAxis&&axes.includes(TOK.firstAxis)&&axes[0]!==TOK.firstAxis)
        F.push({sev:"warning",rule:"schema",key:"schema|axis-order|first",text:TOK.firstAxis+" is not the first axis ("+axes.join(" \u00b7 ")+"), so its variant picker and properties read in a different order from every other component",advice:"Move "+TOK.firstAxis+" to the front of the axes."});
      if(SAXIS&&TOK.disabledAxis&&axes.includes(SAXIS)&&axes.includes(TOK.disabledAxis)&&axes.indexOf(TOK.disabledAxis)!==axes.indexOf(SAXIS)-1)
        F.push({sev:"warning",rule:"schema",key:"schema|axis-order|disabled",text:TOK.disabledAxis+" is not immediately before "+SAXIS+" ("+axes.join(" \u00b7 ")+"), so its variant picker and properties read in a different order from every other component",advice:"Move "+TOK.disabledAxis+" to just before "+SAXIS+"."});
      for(const [axis,d] of Object.entries(defs)){
        if(d.type!=="VARIANT") continue;
        const opts0=d.variantOptions||[];
        const isBool=opts0.length===2&&opts0.indexOf("True")>-1&&opts0.indexOf("False")>-1;
        const scale=(typeof SCALES!=="undefined"&&SCALES&&SCALES[axis])||null;
        if(!scale&&isBool&&d.defaultValue&&opts0[0]!==d.defaultValue)
          F.push({sev:"warning",rule:"schema",key:"schema|bool-default|"+axis,text:axis+" lists "+opts0.join(" \u00b7 ")+", putting its default, "+d.defaultValue+", second, so the picker leads with the option an instance does not start on",
            advice:"Reorder the options so "+d.defaultValue+" comes first."});
        if(!scale) continue;
        const opts=d.variantOptions||[];
        const known=opts.filter(o=>scale.indexOf(o)>-1);
        const expected=scale.filter(o=>opts.indexOf(o)>-1);
        if(known.join("|")!==expected.join("|"))
          F.push({sev:"warning",rule:"schema",key:"schema|order|"+axis,
            text:axis+" lists "+opts.join(" \u00b7 ")+", out of the recorded order "+expected.join(" \u00b7 ")+", so its picker reads differently from every other component with "+axis,
            advice:"Reorder the options to "+expected.join(" \u00b7 ")+"."});
      }
      // figma-standard rule 3: each disabled variant sits immediately after its
      // rest sibling (the variant equal on every other axis). The order of a
      // set's children is its variant order. Rest is the state scale's first step.
      if(set.type==="COMPONENT_SET"&&TOK.disabledAxis&&TOK.stateAxis&&typeof SCALES!=="undefined"&&SCALES&&SCALES[TOK.stateAxis]){
        const D=TOK.disabledAxis, S=TOK.stateAxis, rest=SCALES[TOK.stateAxis][0];
        const props=(v)=>variantValues(v.name);
        const others=(p)=>Object.keys(p).filter(k=>k!==D&&k!==S).sort().map(k=>k+"="+p[k]).join(", ");
        const kids=set.children.map(props);
        kids.forEach((p,i)=>{
          if(p[D]!=="True") return;
          const r=kids.findIndex(q=>q[S]===rest&&q[D]!=="True"&&others(q)===others(p));
          if(r>-1&&i!==r+1) F.push({sev:"warning",rule:"schema",key:"schema|disabled-order|"+others(p),
            text:"The "+D+"=True variant"+(others(p)?" ("+others(p)+")":"")+" is not immediately after its "+S+"="+rest+" sibling, so the grid no longer pairs each variant with its disabled form",
            advice:"Move it to sit right after its "+S+"="+rest+" sibling."});
        });
      }
      // Property names, each check from its setting and skipped without it:
      // booleanPrefix (every BOOLEAN property starts with it), textPropertyAvoid
      // with textPropertyExceptions (a TEXT property does not end with it unless
      // excepted), swapAvoid (an INSTANCE_SWAP does not end with it), and
      // propertyCase "sentence" (no capitalised word after the first).
      const element=n=>n.type==="TEXT"||n.type==="INSTANCE"||n.type==="SLOT"||(n.children||[]).some(element);
      const revealsElement=k=>{let hit=false;const sc=n=>{const r=n.componentPropertyReferences;if(r&&r.visible===k&&element(n))hit=true;if(!hit&&n.type!=="INSTANCE")(n.children||[]).forEach(sc);};vs.forEach(sc);return hit;};
      for(const [k,d] of Object.entries(defs)){
        const nm=k.split("#")[0];
        // Only a boolean that reveals an element (text, an instance or a slot) takes the
        // prefix; one that switches a style, such as a decorative stroke, stays a bare
        // word (figma-standard rule 21).
        const reveals=d.type==="BOOLEAN"&&revealsElement(k);
        if(reveals&&TOK.booleanPrefix&&!nm.startsWith(TOK.booleanPrefix)){
          const base=nm.replace(/^(Is|Has)\s+/,"");
          F.push({sev:"preference",rule:"naming",key:"naming|prop-boolean|"+nm,text:'Boolean property "'+nm+'" does not start with "'+TOK.booleanPrefix.trim()+'", so it does not read as an on-off switch beside the others',
            advice:'Rename it "'+TOK.booleanPrefix+(/^[A-Z0-9]{2,}\b/.test(base)?base:base.charAt(0).toLowerCase()+base.slice(1))+'".'});
        }
        // A state is a bare word, never "Is …"; "Has" is kept for a True/False variant
        // that reflects content (`Has value`), so a style-switching boolean drops it
        // too (figma-standard rule 21). A revealing boolean is the check above; both
        // run where the project sets booleanPrefix.
        const stateWord=!TOK.booleanPrefix?null:d.type==="VARIANT"?/^Is\s+/:(d.type==="BOOLEAN"&&!reveals?/^(Is|Has)\s+/:null);
        if(stateWord&&stateWord.test(nm)){
          const bare=nm.replace(stateWord,"");
          F.push({sev:"preference",rule:"naming",key:"naming|prop-state|"+nm,text:'Property "'+nm+'" starts with "'+nm.split(/\s/)[0]+'", so it reads unlike the bare states beside it (Disabled, Selected, Open)',
            advice:'Rename it "'+bare.charAt(0).toUpperCase()+bare.slice(1)+'".'});
        }
        if(d.type==="TEXT"&&TOK.textPropertyAvoid&&nm.endsWith(TOK.textPropertyAvoid)&&(TOK.textPropertyExceptions||[]).indexOf(nm)<0)
          F.push({sev:"preference",rule:"naming",key:"naming|prop-text|"+nm,text:'Text property "'+nm+'" ends in "'+TOK.textPropertyAvoid.trim()+'", a word the properties panel already shows, so its names read unlike the rest',
            advice:'Rename it "'+nm.slice(0,nm.length-TOK.textPropertyAvoid.length)+'".'});
        if(d.type==="INSTANCE_SWAP"&&TOK.swapAvoid&&nm.endsWith(TOK.swapAvoid))
          F.push({sev:"preference",rule:"naming",key:"naming|prop-swap|"+nm,text:'Swap property "'+nm+'" ends in "'+TOK.swapAvoid.trim()+'", a word the properties panel already shows, so its names read unlike the rest',
            advice:'Rename it "'+nm.slice(0,nm.length-TOK.swapAvoid.length)+'".'});
        // A later word starting with a capital breaks sentence case, unless it is all capitals:
        // an acronym keeps them (figma-standard rule 18: `Show AM-PM`, `Button - CTA`).
        if(TOK.propertyCase==="sentence"&&capsInside(nm))
          F.push({sev:"preference",rule:"naming",key:"naming|prop-case|"+nm,text:'Property "'+nm+'" is not in sentence case, so it reads unlike the rest of the properties panel',
            advice:"Rename it in sentence case, keeping acronyms in capitals."});
        if(TOK.propertyCase==="sentence"&&d.type==="VARIANT") for(const o of (d.variantOptions||[]).filter(capsInside))
          F.push({sev:"preference",rule:"naming",key:"naming|value-case|"+nm+"|"+o,text:'Option "'+o+'" of '+nm+' is not in sentence case, so it reads unlike the other options in the picker',
            advice:"Rename it in sentence case, keeping acronyms in capitals."});
      }
      // Sizes. The size property's name, the pattern for size properties under
      // another name, and the scale of size names all come from the settings;
      // each part is skipped when its setting is absent.
      const SZA=TOK.sizeAxis||null;
      const SZM=TOK.sizeAxisMatch?new RegExp(TOK.sizeAxisMatch):null;
      const SIZES=(SZA&&typeof SCALES!=="undefined"&&SCALES&&SCALES[SZA])||null;
      for(const [axis,d] of Object.entries(defs)){
        if(d.type!=="VARIANT"||!SZA) continue;
        const isSize=axis===SZA||(SZM&&SZM.test(axis));
        if(!isSize) continue;
        const opts=d.variantOptions||[];
        if(axis!==SZA) F.push({sev:"warning",rule:"schema",key:"schema|size-name|"+axis,
          text:'The size property is named "'+axis+'", not the recorded "'+SZA+'", so it does not line up with the sizes of other components',
          advice:'Rename the property "'+SZA+'".'});
        const off=SIZES?opts.filter(o=>SIZES.indexOf(o)<0):[];
        if(off.length) F.push({sev:"warning",rule:"schema",key:"schema|size-values|"+axis,
          text:axis+" options "+off.join(" \u00b7 ")+" are not on the recorded size scale ("+SIZES.join(" \u00b7 ")+"), so a size picked here means something different elsewhere",
          advice:"Rename each option to the step on the scale it matches."});
        // The steps a component uses are one unbroken run of the scale.
        if(SIZES&&!off.length&&opts.length>1){
          const ix=opts.map(o=>SIZES.indexOf(o)).sort((x,y)=>x-y);
          const gaps=SIZES.slice(ix[0],ix[ix.length-1]+1).filter(o=>opts.indexOf(o)<0);
          if(gaps.length) F.push({sev:"warning",rule:"schema",key:"schema|size-gap|"+axis,
            text:axis+" skips "+gaps.join(" \u00b7 ")+" between "+SIZES[ix[0]]+" and "+SIZES[ix[ix.length-1]]+", so people cannot pick a size its neighbours offer",
            advice:"Add "+gaps.join(" and ")+", or record why the component leaves "+(gaps.length===1?"it":"them")+" out."});
        }
        for(const o of opts){
          if(!/^\d+$/.test(o)) continue;
          const drawn=[...new Set(vs.filter(v=>(v.name||"").split(", ").some(x=>x===axis+"="+o)).map(v=>Math.round(Math.max(v.width||0,v.height||0))))];
          if(drawn.length&&drawn.some(n=>n!==+o)) F.push({sev:"error",rule:"schema",visible:true,key:"schema|size-drawn|"+axis+"|"+o,
            text:axis+"="+o+" draws "+drawn.join("/")+"px, so its name promises a size it does not have",
            advice:"Resize those variants to "+o+"px, or rename the option to the size drawn."});
        }
        if(axis===SZA&&SIZES&&TOK.sizeShared) for(const o of opts){ if(SIZES.indexOf(o)<0) continue;
          const hs=vs.filter(v=>(v.name||"").split(", ").some(x=>x===SZA+"="+o)).map(v=>Math.round(v.height||0));
          if(hs.length){ const h=hs.sort((a,b)=>a-b)[Math.floor(hs.length/2)]; (sizeSeen[o]=sizeSeen[o]||[]).push({set:set.name,h}); } }
      }
      const seen={}; const uniq=F.filter(f=>seen[f.text]?false:(seen[f.text]=1));
      M.sets++; M.variants+=vs.length;
      if((set.description||"").trim()) M.described++;
      // The token checks for a value that could have carried a variable and
      // did not — the same events coverage counts. Matched by key, not by the
      // sentence, so rewording a finding cannot move the coverage figure. FROM `F`, NOT `uniq`: the dedupe exists so the queue does not
      // carry twenty identical rows, and counting the deduped list made twenty
      // raw fills on twenty layers one event against a numerator that counted
      // all twenty bindings. Coverage is a ratio of events; the queue is a list
      // of things to fix, and they are not the same list.
      M.unbound+=F.filter(f=>RAW_KEY.test(f.key)).length;
      out.push({set:set.name, id:set.id, variants:vs.length,
        axes:Object.keys(defs).filter(k=>defs[k].type==="VARIANT"),
        described:!!(set.description||"").trim(),
        page:p.name,
        candidates:uniq});
    }
  }
  // One size name, one value (figma-standard rule 6's ideal): where sets draw the same
  // name at different heights, each set off the most common height is a review.
  for(const [o,list] of Object.entries(sizeSeen)){
    const hs=[...new Set(list.map(x=>x.h))]; if(hs.length<2) continue;
    const count={}; for(const x of list) count[x.h]=(count[x.h]||0)+1;
    const ranked=Object.keys(count).map(Number).sort((a,b)=>count[b]-count[a]||a-b);
    // A majority height is the reference; with no majority every set is asked.
    const common=count[ranked[0]]>count[ranked[1]]?ranked[0]:null;
    for(const x of list){ if(x.h===common) continue; const e=out.find(z=>z.set===x.set); if(!e) continue;
      const others=common!==null?common+"px in "+count[common]+" other component"+(count[common]===1?"":"s"):hs.filter(h=>h!==x.h).join("/")+"px elsewhere";
      e.candidates.push({sev:"review",rule:"schema",key:"schema|size-shared|"+o,
        text:TOK.sizeAxis+"="+o+" is "+x.h+"px here and "+others+", so components of one size do not line up side by side",
        advice:common!==null?"Make it "+common+"px, or record why this component differs.":"Agree one height for "+TOK.sizeAxis+"="+o+" and draw each component at it."}); }
  }
  let measures=null;
  if(skipped===0){
    const colls=file.collections;
    measures={
      sets:M.sets, variants:M.variants, described:M.described, nodes:M.nodes,
      groups:M.groups, hidden:M.hidden, bound:M.bound, unbound:M.unbound,
      autoNamed:M.autoNamed, layers:M.layers, named:M.layers-M.autoNamed, frames:M.frames, staticFrames:M.staticFrames, framesAuto:M.frames-M.staticFrames,
      guidable:M.guidable, guided:M.guided, contrastTotal:M.contrastTotal, contrastPass:M.contrastPass,
      coverage: (M.bound+M.unbound) ? Math.round(M.bound/(M.bound+M.unbound)*1000)/10 : null,
      collections:colls.length, variables:file.variables,
      modes:colls.map(c=>c.modes.map(m=>m.name).join("/")).join(" \u00b7 "),
      pages:file.pages,
      textStyles:file.textStyles,
      effectStyles:file.effectStyles,
      ...(RTL?{rtlSets:M.rtlSets,rtlVariants:M.rtlVariants}:{})
    };
  }
  return {audited:out, measures:measures, ran:ran, ...(settingsNotes.length?{settings:settingsNotes}:{}), at:new Date().toISOString()};
}
if (typeof figma === "undefined") return checkFacts;

await figma.loadAllPagesAsync();
const idc={};
async function tn(id){if(idc[id])return idc[id];const v=await figma.variables.getVariableByIdAsync(id);const c=v?await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId):null;return idc[id]=v?{name:v.name,collection:c&&c.name,key:c&&c.key}:null;}
const pages=[];
for(const p of figma.root.children){
  await p.loadAsync();
  pages.push({name:p.name, id:p.id, sets:p.findAllWithCriteria({types:["COMPONENT_SET","COMPONENT"]})
    .filter(n=>!(n.type==="COMPONENT"&&n.parent&&n.parent.type==="COMPONENT_SET"))});
}
const colls=await figma.variables.getLocalVariableCollectionsAsync();
const file={
  collections:colls.map(c=>({modes:c.modes.map(m=>({name:m.name}))})),
  variables:(await figma.variables.getLocalVariablesAsync()).length,
  pages:figma.root.children.length,
  textStyles:(await figma.getLocalTextStylesAsync()).length,
  effectStyles:(await figma.getLocalEffectStylesAsync()).length
};
return Object.assign(
  await checkFacts({pages}, typeof TOKENS!=="undefined"?TOKENS:undefined, typeof SCALES!=="undefined"?SCALES:undefined,
                   typeof TARGETS!=="undefined"?TARGETS:undefined, tn, file),
  { fileKey:figma.fileKey||null, fileName:figma.root.name });
