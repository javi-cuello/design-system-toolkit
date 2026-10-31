// Run: node plugins/component-guidelines/tests/test-guidelines.js
//
// code.js is a Figma plugin main thread with no module boundary, so this runs
// it in a context holding a stub `figma` and asserts on what it defines. The
// one piece of logic in it that is not a Figma call is reading a description
// into its Usage and Don't lists; the rest (the panel's position, the
// selection) needs a file and is checked by hand.

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

var noop = function () {};
var figma = {
  showUI: noop, on: noop, notify: noop,
  ui: { postMessage: noop, resize: noop, reposition: noop },
  root: { setRelaunchData: noop },
  currentPage: { selection: [] },
};
var ctx = vm.createContext({ figma: figma, __html__: '', console: console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8'), ctx);
var parseGuidelines = vm.runInContext('parseGuidelines', ctx);
var nodeCanvasPos = vm.runInContext('nodeCanvasPos', ctx);

eq(parseGuidelines(''), { usage: [], dont: [] }, 'no description, no lists');
eq(parseGuidelines('Usage\n- Use for the main action\n• One per view\n\nDon’t\n* Stack two\nBehaviour\nOpens a menu'),
  { usage: ['Use for the main action', 'One per view'], dont: ['Stack two'] },
  'a heading alone on its line opens a list; a bullet is stripped; a known heading not shown closes the list before it');
eq(parseGuidelines('A button.\nUSAGE\nPrimary actions\nCode gen notes\nmaps to <button>'),
  { usage: ['Primary actions'], dont: [] },
  'text before the first heading is no item; headings match without case; a multi-word heading closes the list');
eq(parseGuidelines("Don't\nNest buttons\nDont\nUse two primaries"),
  { usage: [], dont: ['Nest buttons', 'Use two primaries'] }, "both spellings of Don't");
eq(parseGuidelines('Usage of icons\nNot a list'), { usage: [], dont: [] }, 'a heading word inside a sentence is no heading');

eq(nodeCanvasPos({ absoluteBoundingBox: { x: 10.4, y: 20, width: 100, height: 30.6 } }), { x: 10, y: 71 }, 'the panel sits 20px below the node');
eq(nodeCanvasPos({ absoluteBoundingBox: null }), null, 'a node with no box places no panel');

console.log(failures ? 'FAIL — ' + failures + ' of ' + checks : 'pass — ' + checks + ' checks');
process.exit(failures ? 1 : 0);
