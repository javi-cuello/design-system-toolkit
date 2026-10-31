// consumer-usage.js - SKILL.md step 2f: where the library's components are used
// in a consumer (screens) file. Read-only. Send this file's body as the code of
// figma_execute({ fileKey: <consumer> }), then re-pin the library before writing.
// Returns one row per component, most used first: how many instances, and the
// screens (page > top-level frame) they sit on.
const GONE = /does not exist/;
const usage = new Map();   // component or set name -> { count, screens }
let broken = 0;            // instances whose main Figma would not read
for (const page of figma.root.children) {
  await page.loadAsync();
  for (const inst of page.findAllWithCriteria({ types: ['INSTANCE'] })) {
    const main = await inst.getMainComponentAsync().catch(e => {
      if (GONE.test(e && e.message)) { broken++; return null; }
      throw e;
    });
    if (!main) continue;
    const nm = (main.parent && main.parent.type === 'COMPONENT_SET') ? main.parent.name : main.name;
    let top = inst, hops = 0;
    while (top.parent && top.parent.type !== 'PAGE' && hops++ < 40) top = top.parent;
    if (!usage.has(nm)) usage.set(nm, { count: 0, screens: new Set() });
    const u = usage.get(nm);
    u.count++;
    u.screens.add(page.name + ' › ' + top.name);
  }
}
// Plain arrays: a Map or Set does not survive the bridge's JSON.
const components = [...usage]
  .map(([name, u]) => ({ name, count: u.count, screens: [...u.screens].sort() }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
return { components, broken };
