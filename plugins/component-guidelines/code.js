// Component guidelines — v2.0.5 · plugin-standard v1.5.0
// @ts-check
// Hand-written vanilla JS (rewrite; the previous compiled-TS version had no
// source in the repo and parsed a Markdown description format that doesn't
// match real project descriptions — see CHANGELOG).
"use strict";

const TOOL_ID = 'component-guidelines';
const DISPLAY_NAME = 'Component guidelines';

/** Known section headings, case-insensitive, matched as a standalone line
 *  (any length — single OR multi-word, e.g. "Code gen notes"). Spelling
 *  varies by project (Behavior/Behaviour) — toolkit-standard §D 20 makes the
 *  dialect a project setting, so both are accepted. Only 'usage' and 'dont' are shown;
 *  every OTHER recognized heading still closes the current section so its
 *  content is never misattributed (the bug this list exists to prevent). */
const HEADINGS = {
  'usage': 'usage',
  "don\u2019t": 'dont', "don't": 'dont', 'dont': 'dont',
  'behavior': null, 'behaviour': null,
  'composition': null,
  'code gen notes': null,
};

/** Position a fixed-width panel just below a node's bounding box, in canvas
 *  coordinates (matches figma.showUI's `position` / figma.ui.reposition). */
function nodeCanvasPos(node) {
  const box = node.absoluteBoundingBox;
  if (!box) return null;
  return { x: Math.round(box.x), y: Math.round(box.y + box.height + 20) };
}

/** Parse a component description into { usage: string[], dont: string[] }.
 *  Format observed in real project descriptions: a heading word alone on its
 *  own line (no "##", no leading "-" on it), followed by one item per line
 *  until the next heading or end of text. A leading "-•*" on an item line is
 *  stripped defensively but not required. */
function parseGuidelines(description) {
  const usage = [];
  const dont = [];
  let section = null;
  if (!description) return { usage, dont };
  for (const raw of description.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const norm = line.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(HEADINGS, norm)) {
      section = HEADINGS[norm]; // null for a recognized-but-ignored heading —
      continue;                 // still closes the previous section correctly.
    }
    if (!section) continue;
    const item = line.replace(/^[-•*]\s*/, '').trim();
    if (!item) continue;
    (section === 'usage' ? usage : dont).push(item);
  }
  return { usage, dont };
}

async function refresh() {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) {
    figma.ui.postMessage({ type: 'state', state: 'empty' });
    return;
  }
  const node = sel[0];
  const pos = nodeCanvasPos(node);
  if (pos) figma.ui.reposition(pos.x, pos.y);

  if (node.type !== 'INSTANCE') {
    figma.ui.postMessage({ type: 'state', state: 'not-instance' });
    return;
  }
  const main = await node.getMainComponentAsync();
  if (!main) {
    figma.ui.postMessage({ type: 'state', state: 'no-component' });
    return;
  }
  const parent = main.parent;
  const fromSet = parent && parent.type === 'COMPONENT_SET';
  const description = (fromSet ? parent.description : main.description) || '';
  const name = fromSet ? parent.name : main.name;

  const { usage, dont } = parseGuidelines(description);
  if (!usage.length && !dont.length) {
    figma.ui.postMessage({ type: 'state', state: 'no-guidelines', name });
    return;
  }
  figma.ui.postMessage({ type: 'guidelines', name, usage, dont });
}

try {
  const initialSel = figma.currentPage.selection;
  const initialPos = initialSel.length === 1 ? nodeCanvasPos(initialSel[0]) : null;
  const showOptions = { themeColors: true, width: 280, height: 200 };
  if (initialPos) showOptions.position = initialPos;
  figma.showUI(__html__, showOptions);
  figma.root.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME });

  figma.ui.onmessage = (msg) => {
    if (msg && msg.type === 'resize') {
      const h = Math.max(120, Math.min(900, Math.round(msg.height || 200)));
      figma.ui.resize(280, h);
    }
  };

  figma.on('selectionchange', () => { refresh().catch((e) => figma.notify(String(e && e.message || e), { error: true })); });
  refresh().catch((e) => figma.notify(String(e && e.message || e), { error: true }));
} catch (e) {
  figma.notify(String(e && e.message || e), { error: true });
}
