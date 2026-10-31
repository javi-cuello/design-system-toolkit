// Run: node plugins/component-graph/tests/test-graph.js
//
// code.js is a Figma plugin main thread with no module boundary, so this runs
// it in a context holding a stub `figma` and asserts on the node helpers it
// defines: they decide what counts as a component, an authored placement and
// a library, and every count the graph shows rests on them. The scan, the
// cache and the canvas drawing need a file and are checked by hand.

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var checks = 0, failures = 0;
function eq(actual, expected, what) {
  checks++;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.log('  FAIL  ' + what + '\n          expected ' + JSON.stringify(expected) + '\n          actual   ' + JSON.stringify(actual));
  }
}

// Startup scans the file and reads the cache; against this stub it stops at
// the first call the stub lacks, inside its own async function. That is not
// what is tested here, so its rejection is let go.
process.on('unhandledRejection', function () {});
var noop = function () {};
var figma = {
  showUI: noop, on: noop, notify: noop,
  ui: { postMessage: noop },
  root: { name: 'stub', getRelaunchData: function () { return {}; }, setRelaunchData: noop },
};
var ctx = vm.createContext({ figma: figma, __html__: '', console: console, setTimeout: setTimeout, clearTimeout: clearTimeout });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8'), ctx);
var get = function (name) { return vm.runInContext(name, ctx); };

// a page holding a frame, a set of two variants, and an instance whose own tree holds a nested instance
var page = { type: 'PAGE', name: 'Page 1', id: 'p' };
var set = { type: 'COMPONENT_SET', name: 'Button', id: 's', parent: page };
var variant = { type: 'COMPONENT', name: 'Size=Large', id: 'v', parent: set };
var label = { type: 'TEXT', name: 'Label', parent: variant };
var frame = { type: 'FRAME', name: 'Card', parent: page };
var outer = { type: 'INSTANCE', name: 'Button', parent: frame };
var inner = { type: 'INSTANCE', name: 'Icon', parent: outer };
var deep = { type: 'INSTANCE', name: 'Badge', parent: frame };
outer.children = [inner];
frame.children = [outer, { type: 'GROUP', name: 'g', parent: frame, children: [deep] }];

eq(get('collapseToSet')(variant).id, 's', 'a variant collapses to its set');
eq(get('collapseToSet')(set).id, 's', 'a set is itself');
eq(get('nearestComponentAncestor')(label, false).id, 'v', 'a layer\'s nearest component is the variant it sits in');
eq(get('nearestComponentAncestor')(variant, true).id, 'v', 'with includeSelf, a component is its own');
eq(get('nearestComponentAncestor')(frame, true), null, 'a frame on a page has none');
eq(get('pageOf')(label).id, 'p', 'a layer\'s page');
eq(get('isNestedInsideAnotherInstance')(inner), true, 'an instance inside an instance is a mirrored copy');
eq(get('isNestedInsideAnotherInstance')(outer), false, 'an instance placed in a frame is authored');
eq(get('findTopLevelInstances')(frame).map(function (n) { return n.name; }), ['Button', 'Badge'],
  'the first instance on each branch, through groups, never inside an instance');

var libraryGroupOf = get('libraryGroupOf');
eq(libraryGroupOf('Core / Forms / Input'), 'Core', 'a library is the name\'s first segment');
eq(libraryGroupOf('Input'), null, 'no prefix, no library');
eq(libraryGroupOf('/Input'), null, 'an empty first segment is no library');
eq(libraryGroupOf(' / Input'), null, 'a blank first segment is no library');

eq(get('detailsList')([{ id: 'a', name: 'B', count: 1, remote: false, extra: 1 }, { id: 'b', name: 'A', count: 1 }, { id: 'c', name: 'C', count: 5 }])
  .map(function (e) { return e.id; }), ['c', 'b', 'a'], 'details list most used first, then by name');

// batches run in bounded chunks and keep the input's order
var running = 0, most = 0;
get('mapInBatches')([1, 2, 3, 4, 5], 2, function (n) {
  running++; most = Math.max(most, running);
  return new Promise(function (done) { setTimeout(function () { running--; done(n * 10); }, 6 - n); });
}).then(function (out) {
  eq(out, [10, 20, 30, 40, 50], 'mapInBatches keeps the order whatever finishes first');
  eq(most, 2, 'and never runs more than a batch at once');
  console.log(failures ? 'FAIL — ' + failures + ' of ' + checks : 'pass — ' + checks + ' checks');
  process.exit(failures ? 1 : 0);
});
