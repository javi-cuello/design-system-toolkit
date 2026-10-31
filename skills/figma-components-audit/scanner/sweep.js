// @runs: the audit dashboard's Audit (tools/figma-audit/server.mjs serves it at /scripts), as well as a session.
// Fingerprint sweep — SHARED by every project. Hashes each component set over
// its axes, properties, layer tree and which properties are bound. Read-only.
// Returns fileKey and fileName so the caller can refuse a diff computed
// against the wrong file: a hosted call takes no file key and reads whatever
// the plugin is paired to.
// Runs as an async body with `figma` in scope.
await figma.loadAllPagesAsync();
// Same project rule as the audit's: which pages hold components. The two must
// agree, or the sweep fingerprints a different set than the audit walks and
// "nothing moved" stops meaning anything.
const TOK=(typeof TOKENS!=="undefined"&&TOKENS)||{};
const PAGES=TOK.componentPages?new RegExp(TOK.componentPages):null;
const SECTION=TOK.sectionHeader?new RegExp(TOK.sectionHeader):null;
const SKIPSEC=new Set(TOK.excludeSections||[]);
let section=null;
const j=x=>JSON.stringify(x);
function hash(str){let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))>>>0;return h.toString(36);}
const sets={};
for(const p of figma.root.children){
  if(SECTION&&SECTION.test(p.name)) section=p.name;
  if(section&&SKIPSEC.has(section)) continue;
  if(PAGES&&!PAGES.test(p.name)) continue;
  await p.loadAsync();
  for(const set of p.findAllWithCriteria({types:["COMPONENT_SET","COMPONENT"]})){
    if(set.type==="COMPONENT"&&set.parent&&set.parent.type==="COMPONENT_SET") continue;
    const defs=set.componentPropertyDefinitions||{};
    const variants=set.type==="COMPONENT_SET"?set.children:[set];
    const sig=[];
    for(const v of variants){
      (function walk(n,d,path){ if(d>8||n.type==="SLOT") return;
        sig.push(path+"|"+n.name+"|"+n.type+"|"+(n.visible!==false)+"|"+j(Object.keys(n.boundVariables||{}).sort()));
        if(n.type==="INSTANCE") return;
        if("children" in n) n.children.forEach((c,i)=>walk(c,d+1,path+"/"+i));
      })(v,0,"");
    }
    sets[set.name]=hash(set.name+"::"+j(Object.entries(defs).map(([k,dd])=>k+":"+dd.type+":"+((dd.variantOptions||[]).join("·"))))+"::"+sig.join("§"));
  }
}
return {sets, at:new Date().toISOString(), fileKey:figma.fileKey||null, fileName:figma.root.name};
