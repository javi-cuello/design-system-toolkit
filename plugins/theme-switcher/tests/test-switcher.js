// Run: node plugins/theme-switcher/tests/test-switcher.js
//
// code.js is a Figma plugin main thread with no module boundary, so this runs
// it in a context holding a stub `figma` and asserts on the two pieces that
// are not Figma calls: the stable half of a collection id, which every pin
// comparison uses, the race every team-library call runs, and the rows read
// from a file's local collections (the instant pass, which needs no library).

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

// Startup reads the window size and builds the model; against this stub it
// stops at the first call the stub lacks, inside its own async function. That
// is not what is tested here, so its rejection is let go.
process.on('unhandledRejection', function () {});
var noop = function () {};
var notices = [];
var figma = {
  showUI: noop, on: noop,
  notify: function (m) { notices.push(m); },
  ui: { postMessage: noop, resize: noop },
  root: { getRelaunchData: function () { return {}; }, setRelaunchData: noop, getPluginData: function () { return ''; }, setPluginData: noop },
  currentPage: { id: 'p', children: [], selection: [] },
  variables: {},
};
function col(id, name, modes, ext) {
  return { id: id, name: name, isExtension: !!ext, parentVariableCollectionId: ext || undefined,
    modes: modes.map(function (m, i) { return { modeId: id + '#' + i, name: m }; }) };
}
var ctx = vm.createContext({ figma: figma, __html__: '', console: console, setTimeout: setTimeout, Promise: Promise });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8'), ctx);
var keyOf = vm.runInContext('keyOf', ctx);
var within = vm.runInContext('within', ctx);

eq(keyOf('VariableCollectionId:abc123/1233:2790'), 'VariableCollectionId:abc123', 'a remote id\'s key drops the local half that changes between generations');
eq(keyOf('VariableCollectionId:abc123/1225:1037'), keyOf('VariableCollectionId:abc123/1233:2790'), 'so two generations of one collection compare equal');
eq(keyOf('VariableCollectionId:12:34'), 'VariableCollectionId:12:34', 'a local id is its own key');
eq(keyOf(null), '', 'no id, no key');

var model = vm.runInContext('model', ctx);
function rows(cols) {
  figma.variables.getLocalVariableCollectionsAsync = function () { return Promise.resolve(cols); };
  figma.variables.getVariableCollectionByIdAsync = function (id) { return Promise.resolve(cols.filter(function (c) { return c.id === id; })[0] || null); };
  return model(true).then(function (m) {
    return { themes: m.themes, brands: m.brands.map(function (b) { return b.name; }),
      choices: m.choices.map(function (c) { return c.name + ': ' + c.modes.map(function (x) { return x.name; }).join('/'); }) };
  });
}
var shapes = Promise.all([
  // Brands as modes of one collection.
  rows([col('c1', 'Primitives - Colour', ['Light', 'Dark']), col('c2', 'Semantic', ['Light', 'Dark']),
    col('c3', 'Primitives - Global', ['Mode 1']), col('c4', 'Semantic - Brand', ['A', 'B'])]),
  // Brands as extended collections.
  rows([col('c1', 'Colour', ['Light', 'Dark']), col('c2', 'Semantic - Brand', ['Light', 'Dark']),
    col('c5', 'Acme', ['Light', 'Dark'], 'c2')]),
]).then(function (got) {
  eq(got[0], { themes: ['Light', 'Dark'], brands: [], choices: ['Semantic - Brand: A/B'] }, 'a collection whose modes are not themes is its own row');
  eq(got[1], { themes: ['Light', 'Dark'], brands: ['Semantic - Brand', 'Acme'], choices: [] }, 'extensions stay the brand row and add no choice row');
});

notices.length = 0; // startup may have said something to the stub
shapes.then(function () { return Promise.all([
  within(Promise.resolve('fast'), 50),
  within(new Promise(noop), 10),
  within(Promise.reject(new Error('no teamlibrary permission')), 50),
  within(Promise.reject(new Error('no teamlibrary permission')), 50),
]); }).then(function (got) {
  eq(got, ['fast', null, null, null], 'an answer in time is the answer; one that never comes or fails is left out');
  eq(notices, ['no teamlibrary permission'], 'a failure is said once, not swallowed and not repeated');
  console.log(failures ? 'FAIL — ' + failures + ' of ' + checks : 'pass — ' + checks + ' checks');
  process.exit(failures ? 1 : 0);
});
