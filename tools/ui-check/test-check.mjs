#!/usr/bin/env node
// node tools/ui-check/test-check.mjs — each design-standard rule the page check
// measures, fired on a page that breaks it and quiet on one that keeps it.
// Needs Chrome ($CHROME, else the macOS default install); skips, saying so, without one.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkPages, judge, limits } from './check.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const L = limits();
ok('the limits are the house settings', L.maxSegments === 4 && typeof L.shiftTolerance === 'number');

// The judge alone, on surveys: one breach per rule, then a clean page.
const clean = { groups: [{ name: 'g', buttons: 4 }], tablists: [{ name: 't', rows: 1, tabs: 3 }], menus: [{ name: 'm', disabled: false, first: 'All areas (5)', choosable: 2, hidden: 0 }], bars: [{ name: 'b', facetAfterSearch: false }] };
ok('a page keeping every rule has no finding', judge(clean, [{ name: 'Files', tops: [100, 100, 100] }], L).length === 0);
const hit = (patch, tops = [100, 100]) => judge(Object.assign({}, clean, patch), [{ name: 'Files', tops }], L);
ok('rule 4: five segmented buttons', hit({ groups: [{ name: 'g', buttons: 5 }] }).some((x) => /rule 4/.test(x)));
ok('rule 3: tabs on two rows', hit({ tablists: [{ name: 't', rows: 2, tabs: 9 }] }).some((x) => /rule 3/.test(x)));
ok('rule 3: a facet after the search', hit({ bars: [{ name: 'b', facetAfterSearch: true }] }).some((x) => /rule 3/.test(x)));
ok('rule 5: a menu with nothing to choose, enabled', hit({ menus: [{ name: 'm', disabled: false, first: 'All areas (0)', choosable: 0, hidden: 0 }] }).some((x) => /rule 5/.test(x)));
ok('…and quiet once disabled', !hit({ menus: [{ name: 'm', disabled: true, first: 'All areas (0)', choosable: 0, hidden: 0 }] }).some((x) => /rule 5/.test(x)));
ok('rule 5: a hidden option', hit({ menus: [{ name: 'm', disabled: false, first: 'All areas (5)', choosable: 2, hidden: 1 }] }).some((x) => /rule 5/.test(x)));
ok('rule 12: a menu opening on a bare "All (5)"', hit({ menus: [{ name: 'm', disabled: false, first: 'All (5)', choosable: 2, hidden: 0 }] }).some((x) => /rule 12/.test(x)));
ok('rule 2: a tab switch that moves the bar 62px', hit({}, [424, 362, 424]).some((x) => /rule 2/.test(x)));
ok('…and none within the tolerance', !hit({}, [424, 424 + L.shiftTolerance]).some((x) => /rule 2/.test(x)));

// The browser half: the survey and the tab switch read a real page.
const CHROME = (await import('../shared/cdp.mjs')).findChrome();
if (!fs.existsSync(CHROME)) { console.log(`skip: no Chrome at ${CHROME}; the browser half did not run`); console.log(`${n}/${n} passed`); process.exit(0); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-check-'));
const write = (name, body) => { const f = path.join(dir, name); fs.writeFileSync(f, `<!doctype html><title>t</title><main><h1>Page</h1>${body}</main>`); return 'file://' + f; };
// Breaks each rule: the second tab grows the header 800ms after the click (late content)
// and shows a panel whose menu opens on a bare "All"; the search sits in an icon wrapper.
const bad = write('bad.html', `<div id="head" style="height:20px"></div>
<div role="tablist" aria-label="Files"><button role="tab" aria-selected="true" onclick="document.getElementById('head').style.height='20px';document.getElementById('p2').hidden=true">One</button><button role="tab" aria-selected="false" onclick="setTimeout(()=>document.getElementById('head').style.height='80px',800);document.getElementById('p2').hidden=false">Two</button></div>
<div class="bar"><span class="icon"><input type="search" aria-label="Filter"></span><select aria-label="Area"><option>All areas (0)</option><option disabled>Empty (0)</option></select></div>
<div role="group" aria-label="Level">${'<button aria-pressed="false">x</button>'.repeat(4)}<button aria-pressed="true">y</button></div>
<div id="p2" hidden><select aria-label="Kind"><option>All (3)</option><option>A (3)</option></select></div>`);
// Keeps every rule, and carries what is not a filter: a labelled form field, a toolbar of independent toggles, link tabs.
const good = write('good.html', `<style>@media (prefers-color-scheme: dark) { body { background: #000; color: #fff } }</style><div role="tablist" aria-label="Pages"><a role="tab" href="#a">A</a><a role="tab" href="#b">B</a></div>
<div class="bar"><select aria-label="Area"><option>All areas (5)</option><option>Components (5)</option></select><input type="search" aria-label="Filter"></div>
<div role="group" aria-label="Level"><button aria-pressed="true">All</button><button aria-pressed="false">Draft</button></div>
<div role="group" aria-label="Format">${'<button aria-pressed="false">B</button>'.repeat(6)}</div>
<label>Country <select><option>Spain</option></select></label>
<fieldset><legend>How did you hear?</legend>${['A','B','C','D','E'].map((x, i) => `<label><input type="radio" name="h"${i ? '' : ' checked'}> ${x}</label>`).join('')}</fieldset>`);
const shotsDir = path.join(dir, 'shots');
fs.mkdirSync(shotsDir);
const [r, g, e] = await checkPages([bad, good, 'file://' + path.join(dir, 'missing.html')], { shots: shotsDir });
const has = (re) => r.findings.some((x) => re.test(x));
ok('in a browser: five segmented buttons are found', has(/rule 4/));
ok('in a browser: the facet after a wrapped search is found', has(/rule 3: in/));
ok('in a browser: the menu with nothing to choose is found', has(/rule 5: menu "Area" offers nothing/));
ok('in a browser: a bare "All" in the second tab\'s view is found', has(/rule 12: menu "Kind"/));
ok('in a browser: the tab bar that moves 60px on a switch is found', has(/rule 2: switching tabs in "Files" moves it 60px/));
ok('in a browser: a page keeping every rule is clean, its form field, five-option radio question, toolbar and link tabs left alone', g.findings.length === 0 && g.notMeasured.length === 1);
ok('a page that cannot be loaded is an error, never findings or clean', Boolean(e.error) && !e.findings);
// 2026-10-11: --shots saves each page whole in the three looks a reviewer needs, and they differ.
const png = (f) => fs.readFileSync(f);
ok('--shots saves desktop, dark and phone for each page checked', g.files.length === 3 && g.files.every((f) => fs.existsSync(f) && png(f).length > 1000) && /-desktop\.png$/.test(g.files[0]) && /-dark\.png$/.test(g.files[1]) && /-phone\.png$/.test(g.files[2]));
ok('…the dark one is not the light one', !png(g.files[0]).equals(png(g.files[1])));
ok('a project with no settings of its own gets the house limits', limits('no-such-project').maxSegments === L.maxSegments);
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
