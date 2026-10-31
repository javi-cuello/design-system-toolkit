/*
 * tools/shared/knowledge.mjs — which project files are interface work, and
 * which knowledge pages to read before writing one (toolkit-standard §D 21).
 *
 *   uiFile(rel)    → whether a project file (repo-relative) draws an interface
 *   pagesFor(rel)  → the knowledge pages for an interface file: the
 *                    fundamentals its kind of file needs, and each pattern its
 *                    path names (the caller has decided it is interface work)
 *
 * One notion of "UI work" for the edit hook (tools/claude-hooks), which names
 * the pages beside the first change, and the push check (tools/project-check),
 * which refuses a UI commit without a `Knowledge:` trailer. Written 2026-10-20,
 * after a session built a whole screen without reading the pages §D 21 says
 * new UI work starts from: the rule had a closing question and nothing else.
 * Patterns are chosen by words in the path, nothing cleverer: a page a word
 * misses is still in the list of fundamentals and the patterns folder.
 */

// a stylesheet, or markup and components; a parity fixture or a story is not interface work
export const UI = /\.(html|astro|jsx|tsx|vue|svelte|php|s[ac]ss|css)$/;
const NOT_UI = /(^|\/)(parity\.mjs|[^/]+\.stories\.\w+)$|(^|\/)tests\/parity\//;
export const uiFile = (rel) => UI.test(rel) && !NOT_UI.test(rel);

const STYLE = ['knowledge/ui/design/visual.md', 'knowledge/ui/design/accessibility.md',
  'knowledge/code/css-architecture.md', 'knowledge/code/tokens.md', 'knowledge/code/responsive.md'];
const MARKUP = ['knowledge/ui/design/ux.md', 'knowledge/ui/design/interaction.md', 'knowledge/ui/design/visual.md',
  'knowledge/ui/design/content.md', 'knowledge/ui/design/accessibility.md',
  'knowledge/code/html-semantics.md', 'knowledge/code/accessibility.md'];

// a word of the path (split on / - _ . and camelCase) → the pattern page it names
const PATTERNS = [
  [/^(dialog|modal|drawer|sheet|popover|tooltip|panel|confirm)/, 'dialogs'],
  [/^(upload|dropzone|attach|import)/, 'upload'],
  [/^(form|field|input|edit|textarea|fieldset)/, 'forms'],
  [/^(settings?|preferences?|account|profile)$/, 'settings'],
  [/^(nav|navigation|tabs?|breadcrumbs?)$/, 'navigation'],
  [/^(sidebar|rail|shell|switcher)/, 'sidebars'],
  [/^(menu|dropdown)/, 'menus'],
  [/^(pagination|pager)/, 'pagination'],
  [/^search/, 'search'],
  [/^filter/, 'filtering'],
  [/^(select|checkbox|radio|switch|picker|combobox|listbox)/, 'selection'],
  [/^(chip|tag|badge|pill)/, 'chips'],
  [/^(step|wizard)/, 'steppers'],
  [/^(login|logout|auth|signin|signup|password|invitation|onboarding)/, 'authentication'],
  [/^(consent|cookie|privacy|permission)/, 'consent'],
  [/^(button|action|toolbar)/, 'actions'],
  [/^(accordion|disclosure|collapse|expand)/, 'disclosure'],
  [/^(toast|alert|banner|feedback|error|empty|loading|spinner|progress|notice)/, 'feedback'],
  [/^table/, 'tables'],
  [/^(grid|datagrid)$/, 'data-grid'],
  [/^(chart|graph|viz|sparkline)/, 'data-visualisation'],
  [/^(stats?|kpi|dashboard|metric)/, 'data'],
  [/^(inspector|properties|property)/, 'property-editors'],
];

export function pagesFor(rel) {
  const words = rel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().split(/[/\-_.]+/).filter(Boolean);
  const patterns = PATTERNS.filter(([re]) => words.some((w) => re.test(w))).map(([, p]) => `knowledge/ui/patterns/${p}.md`);
  const base = /\.(s[ac]ss|css)$/.test(rel) ? STYLE : MARKUP.concat(/\.(m?js|jsx|tsx|vue|svelte|astro)$/.test(rel) ? ['knowledge/code/javascript.md'] : []);
  return [...new Set(patterns.concat(base))];
}
