// Experiment: does Figma-code name alignment change how well Claude writes design-system code from a Figma instance?
// Five conditions x 12 instances x RUNS runs, model = the dashboard proxy's model (claude-sonnet-5).
import fs from 'node:fs';
const RUNS = Number(process.env.RUNS || 3);
const OUT = new URL('./results.json', import.meta.url);

const API = `Components from @arc/design-system (React). Use exactly these props:
<Button buttonRole="primary|secondary|tertiary" size="large|medium|small" color="danger" startIcon={<XIcon />} endIcon={<XIcon />} disabled loading>{label}</Button>   (color="danger" only for destructive buttons; omit color otherwise)
<IconButton icon={<XIcon />} buttonRole="secondary|tertiary" size="large|medium|small" color="danger" disabled aria-label="..." />
<TextField label="..." value="..." placeholder="..." helperText="..." error disabled prefix="..." />
<Alert severity="error|warning|success|info"><AlertTitle>{title}</AlertTitle>{description}</Alert>   (AlertTitle only when there is a title)
<Checkbox checked indeterminate disabled />
<Switch checked disabled />
<Chip label="..." color="default|error|info|success|warning" icon={<XIcon />} />
Icons are components named after the icon in PascalCase with an Icon suffix, e.g. trash -> <TrashIcon />.`;

const NOAPI = `Use the components from @arc/design-system (a React library built on MUI). Icons are components named after the icon in PascalCase with an Icon suffix, e.g. trash -> <TrashIcon />.`;

// Each instance: aligned Figma view, current Suiteify Figma view, mapping notes for current names, and checks.
const I = [
 { id:'btn-danger', aligned:['Button',{ 'Button role':'Primary','Size':'Small','Color':'Danger','Start icon':'True (icon: trash)','End icon':'False','Label':'Delete','Disabled':'False','Loading':'False' }],
   current:['Button',{ 'Role':'Primary','Size':'Small','Feedback':'Danger','Left icon':'True (icon: trash)','Right icon':'False','Label text':'Delete','Disabled':'False','State':'Rest' }],
   req:[/<Button\b/,/buttonRole="primary"/,/size="small"/,/color="danger"/,/startIcon=\{<TrashIcon/,/>\s*Delete\s*</], bad:[/variant=/,/\brole=/,/feedback/i,/leftIcon/,/disabled/,/endIcon/] },
 { id:'btn-loading', aligned:['Button',{ 'Button role':'Tertiary','Size':'Medium','Color':'Default','Start icon':'False','End icon':'True (icon: arrow-right)','Label':'Next','Disabled':'False','Loading':'True' }],
   current:['Button',{ 'Role':'Tertiary','Size':'Medium','Feedback':'Neutral','Left icon':'False','Right icon':'True (icon: arrow-right)','Label text':'Next','Disabled':'False','State':'Loading' }],
   req:[/<Button\b/,/buttonRole="tertiary"/,/size="medium"/,/endIcon=\{<ArrowRightIcon/,/\bloading\b/,/>\s*Next\s*</], bad:[/variant=/,/color=/,/startIcon/,/\bstate=/i,/\bdisabled\b/] },
 { id:'btn-disabled', aligned:['Button',{ 'Button role':'Secondary','Size':'Large','Color':'Default','Start icon':'False','End icon':'False','Label':'Cancel','Disabled':'True','Loading':'False' }],
   current:['Button',{ 'Role':'Secondary','Size':'Large','Feedback':'Neutral','Left icon':'False','Right icon':'False','Label text':'Cancel','Disabled':'True','State':'Rest' }],
   req:[/<Button\b/,/buttonRole="secondary"/,/size="large"/,/\bdisabled\b/,/>\s*Cancel\s*</], bad:[/variant=/,/color=/,/Icon=/,/loading/] },
 { id:'iconbtn', aligned:['Icon button',{ 'Button role':'Tertiary','Size':'Small','Color':'Danger','Icon':'trash','Disabled':'False' }],
   current:['Icon button',{ 'Role':'Tertiary','Size':'Small','Feedback':'Danger','Disabled':'False','State':'Rest' }, 'Nested instance: Icon container with icon "trash"'],
   req:[/<IconButton\b/,/icon=\{<TrashIcon/,/buttonRole="tertiary"/,/size="small"/,/color="danger"/,/aria-label=/], bad:[/variant=/,/feedback/i,/<Button\b/,/disabled/] },
 { id:'tf-error', aligned:['Text field',{ 'Label':'Company name','Value':'Acme Ltd','Helper text':'Name is required','Error':'True','Disabled':'False','Prefix':'(none)' }],
   current:['Text input',{ 'Value':'True','Value text':'Acme Ltd','Error text':'Name is required','Prefix':'False','Prefix text':'','Validation':'Error','Disabled':'False','State':'Rest' }, 'Nested instance: _Label with Label text "Company name"'],
   req:[/<TextField\b/,/label="Company name"/,/value="Acme Ltd"/,/helperText="Name is required"/,/\berror\b(?!Text)/], bad:[/<TextInput/,/errorText/,/validation/i,/disabled/,/prefix=/] },
 { id:'tf-prefix', aligned:['Text field',{ 'Label':'Amount','Value':'1,200','Helper text':'','Error':'False','Disabled':'True','Prefix':'€' }],
   current:['Text input',{ 'Value':'True','Value text':'1,200','Error text':'','Prefix':'True','Prefix text':'€','Validation':'None','Disabled':'True','State':'Rest' }, 'Nested instance: _Label with Label text "Amount"'],
   req:[/<TextField\b/,/label="Amount"/,/value="1,200"/,/prefix="€"/,/\bdisabled\b/], bad:[/<TextInput/,/prefixText/,/\berror\b/,/helperText="[^"]+"/] },
 { id:'alert-title', aligned:['Alert',{ 'Severity':'Warning','Title':'Session expiring','Description':'You will be signed out in 2 minutes.' }],
   current:['Alert',{ 'Feedback':'Warning','Title':'True','Title text':'Session expiring','Description text':'You will be signed out in 2 minutes.' }],
   req:[/<Alert\b/,/severity="warning"/,/<AlertTitle>\s*Session expiring\s*<\/AlertTitle>/,/You will be signed out in 2 minutes\./], bad:[/feedback/i,/title=/,/variant=/] },
 { id:'alert-danger', aligned:['Alert',{ 'Severity':'Error','Title':'(none)','Description':'Payment failed. Try another card.' }],
   current:['Alert',{ 'Feedback':'Danger','Title':'False','Title text':'Payment failed','Description text':'Payment failed. Try another card.' }],
   req:[/<Alert\b/,/severity="error"/,/Payment failed\. Try another card\./], bad:[/severity="danger"/,/<AlertTitle/,/feedback/i] },
 { id:'cb-checked', aligned:['Checkbox',{ 'Checked':'True','Indeterminate':'False','Disabled':'True' }],
   current:['Checkbox',{ 'Selected':'True','Indeterminate':'False','Disabled':'True','State':'Rest' }],
   req:[/<Checkbox\b/,/\bchecked\b/,/\bdisabled\b/], bad:[/selected/i,/indeterminate/,/defaultChecked/] },
 { id:'cb-indet', aligned:['Checkbox',{ 'Checked':'False','Indeterminate':'True','Disabled':'False' }],
   current:['Checkbox',{ 'Selected':'False','Indeterminate':'True','Disabled':'False','State':'Rest' }],
   req:[/<Checkbox\b/,/\bindeterminate\b/], bad:[/selected/i,/\bdisabled\b/,/\bchecked\b(?!=\{false\})/] },
 { id:'switch', aligned:['Switch',{ 'Checked':'True','Disabled':'False' }],
   current:['Switch',{ 'Selected':'True','Disabled':'False','State':'Hover' }],
   req:[/<Switch\b/,/\bchecked\b/], bad:[/selected/i,/\bdisabled\b/,/hover/i,/defaultChecked/] },
 { id:'chip', aligned:['Chip',{ 'Label':'Paid','Color':'Success','Icon':'True (icon: check)' }],
   current:['Chip',{ 'Label text':'Paid','Icon':'True (icon: check)','Feedback':'Success' }],
   req:[/<Chip\b/,/label="Paid"/,/color="success"/,/icon=\{<CheckIcon/], bad:[/feedback/i,/labelText/,/variant=/] },
];

const MAP = {
 'Button': 'Code Connect mapping for Button: Role -> buttonRole (lowercase value); Size -> size (lowercase); Feedback=Danger -> color="danger", Neutral -> omit; Left icon -> startIcon; Right icon -> endIcon; Label text -> children; Disabled=True -> disabled; State=Loading -> loading; State Rest/Focus/Hover/Press -> nothing.',
 'Icon button': 'Code Connect mapping for Icon button -> <IconButton>: icon from the nested Icon container -> icon; Role -> buttonRole; Size -> size; Feedback=Danger -> color="danger"; Disabled=True -> disabled; State -> nothing; always add aria-label.',
 'Text input': 'Code Connect mapping for Text input -> <TextField>: nested _Label Label text -> label; Value text -> value (when Value=True); Error text -> helperText; Validation=Error -> error; Prefix=True -> prefix={Prefix text}; Disabled=True -> disabled; State -> nothing.',
 'Alert': 'Code Connect mapping for Alert: Feedback Danger -> severity="error", Warning/Success/Info -> lowercase severity; Title=True -> <AlertTitle>{Title text}</AlertTitle>; Description text -> children.',
 'Checkbox': 'Code Connect mapping for Checkbox: Selected=True -> checked; Indeterminate=True -> indeterminate; Disabled=True -> disabled; State -> nothing.',
 'Switch': 'Code Connect mapping for Switch: Selected=True -> checked; Disabled=True -> disabled; State -> nothing.',
 'Chip': 'Code Connect mapping for Chip: Label text -> label; Feedback Neutral -> color="default", others lowercase (Danger -> error); Icon=True -> icon.',
};

const CONDS = {
 aligned_api:   { view:'aligned', api:true,  map:false },
 current_api:   { view:'current', api:true,  map:false },
 current_map:   { view:'current', api:true,  map:true },
 aligned_noapi: { view:'aligned', api:false, map:false },
 current_noapi: { view:'current', api:false, map:false },
};

function describe([name, props, nested]) {
  return `Figma instance of component "${name}"\nProperties:\n` + Object.entries(props).map(([k,v])=>`  ${k}: ${v}`).join('\n') + (nested?`\n${nested}`:'');
}
function prompt(inst, c) {
  const v = inst[c.view];
  return [c.api?API:NOAPI, c.map?MAP[v[0]]:'', describe(v),
    'Write the JSX for exactly this instance. Output only one code block with the JSX element, no imports, no explanation. Include only props that the instance sets; omit defaults and false booleans.'].filter(Boolean).join('\n\n');
}
async function call(p) {
  for (let t=0;t<4;t++){
    try{
      const r = await fetch('http://localhost:9230/claude',{method:'POST',headers:{'content-type':'application/json',Origin:'http://localhost:9230'},body:JSON.stringify({prompt:p,max_tokens:400})});
      const j = await r.json(); if (j.ok) return j;
    }catch(e){}
    await new Promise(r=>setTimeout(r,2000*(t+1)));
  }
  return {ok:false,text:''};
}
function grade(inst, text) {
  const code = (text.match(/```[a-z]*\n([\s\S]*?)```/)||[,text])[1];
  const req = inst.req.map(r=>r.test(code)); const bad = inst.bad.map(r=>r.test(code));
  return { reqPass: req.filter(Boolean).length, reqTotal: req.length, badHits: bad.filter(Boolean).length, exact: req.every(Boolean) && !bad.some(Boolean), code };
}
const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : [];
const done = new Set(results.map(r=>r.cond+'|'+r.id+'|'+r.run));
let usd = 0;
const jobs=[];
for (const [cond,c] of Object.entries(CONDS)) for (const inst of I) for (let run=0;run<RUNS;run++) if(!done.has(cond+'|'+inst.id+'|'+run)) jobs.push({cond,c,inst,run});
const CONC=6; let i=0;
await Promise.all(Array.from({length:CONC},async()=>{ while(i<jobs.length){ const {cond,c,inst,run}=jobs[i++]; const j=await call(prompt(inst,c)); usd+=(j.spend&&j.spend.usd)||0; results.push({cond,id:inst.id,run,ok:j.ok,...grade(inst,j.text||'')}); }}));
fs.writeFileSync(OUT, JSON.stringify(results,null,1));
// summary
const by={}; for(const r of results){ const b=by[r.cond]||(by[r.cond]={n:0,req:0,reqT:0,bad:0,exact:0}); b.n++; b.req+=r.reqPass; b.reqT+=r.reqTotal; b.bad+=r.badHits; b.exact+=r.exact?1:0; }
console.log('usd this run', usd.toFixed(3));
for(const [k,b] of Object.entries(by)) console.log(k.padEnd(14), 'n',b.n,'props correct',(100*b.req/b.reqT).toFixed(1)+'%','wrong-prop hits',b.bad,'fully correct',(100*b.exact/b.n).toFixed(1)+'%');
