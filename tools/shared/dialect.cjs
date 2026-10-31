'use strict';
/*
 * The dialect of the words the TOOLKIT writes — never of the words a project's
 * file holds.
 *
 * A section heading the docs site draws, a column header the doc generator
 * writes into a Figma page: ours. They were British because this repo is, so a
 * library whose own convention is en-US had "Colour" written into it by its own
 * documentation run.
 *
 * The setting lives in the project's context document and nowhere else, by the
 * maintainer's instruction — not in the house defaults, because that is a
 * second place for a project's own choice to be set from. Absent means en-GB.
 *
 * A project's OWN spelling is untouched: token names, component names and
 * descriptions are the project's, and `guidance.cjs` already reads a
 * description heading in either spelling.
 *
 * The list is deliberately short. It holds the words this toolkit actually
 * writes into a reader's view, added when one is found rather than in case —
 * a general en-GB→en-US dictionary would respell the project's own words the
 * first time one slipped through.
 */
const US = {
  Colour: 'Color', colour: 'color', Colours: 'Colors', colours: 'colors',
  Behaviour: 'Behavior', behaviour: 'behavior',
  Grey: 'Gray', grey: 'gray',
  Centre: 'Center', centre: 'center',
  Organisation: 'Organization', organisation: 'organization',
  Licence: 'License', licence: 'license',
};
const RE = new RegExp('\\b(' + Object.keys(US).join('|') + ')\\b', 'g');

/** `say('Colour', 'en-US')` → `'Color'`. Any other language is left alone. */
function say(text, language) {
  if (!text || String(language || '').toLowerCase() !== 'en-us') return text;
  return String(text).replace(RE, (w) => US[w] || w);
}

module.exports = { say };
