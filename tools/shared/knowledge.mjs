/*
 * tools/shared/knowledge.mjs — which project files are interface work, and
 * which knowledge pages to read before writing one (toolkit-standard §D 21).
 *
 *   uiFile(rel)    → whether a project file (repo-relative) draws an interface
 *   pagesFor(rel)  → the knowledge pages for an interface file: the
 *                    fundamentals its kind of file needs, and each component
 *                    and pattern its path names (the caller has decided it is
 *                    interface work)
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

// a word of the path → the component page it names, listed before the patterns: the component is what is being built.
// Only a word that names one component: details, range, sheet, toggle and dropdown each name others too (DateRangePicker, ActionSheet);
// so do loader (a data loader), search alone (a results page) and inputs (a folder of every input)
const COMPONENTS = [
  [/^(button|btn|fab)s?$/, 'button'], [/^links?$/, 'link'], [/^tabs?$/, 'tabs'], [/^breadcrumbs?$/, 'breadcrumbs'],
  [/^(dialog|modal)s?$/, 'modal-dialog'], [/^drawers?$/, 'drawer'], [/^popovers?$/, 'popover'], [/^(tooltip|toggletip)s?$/, 'tooltip'],
  [/^accordions?$/, 'accordion'], [/^checkbox(es)?$/, 'checkbox'], [/^radios?$/, 'radio'], [/^switch(es)?$/, 'switch'],
  [/^selects?$/, 'select'], [/^(combobox|autocomplete)s?$/, 'combobox'], [/^segmented$/, 'segmented-control'], [/^sliders?$/, 'slider'],
  [/^(toast|snackbar)s?$/, 'toast'], [/^(alert|banner|callout)s?$/, 'alert'], [/^(badge|pill)s?$/, 'badge'], [/^(chip|tag)s?$/, 'chip'],
  [/^(input|textfield|textinput)$/, 'text-input'], [/^textareas?$/, 'text-area'], [/^(searchbox|searchfield|searchinput|searchbar)$/, 'search-input'],
  [/^labels?$/, 'label'], [/^(feedbackmessage|fielderror|errormessage|helpertext|inlinemessage)s?$/, 'feedback-message'],
  [/^(progress|progressbar|progressindicator)$/, 'progress-indicator'], [/^spinners?$/, 'spinner'],
];

export function pagesFor(rel) {
  const words = rel.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().split(/[/\-_.]+/).filter(Boolean);
  // a two-word name split by its case or a hyphen (TextArea, field-error) is also read joined
  const joined = words.concat(words.slice(1).map((w, i) => words[i] + w));
  const patterns = COMPONENTS.filter(([re]) => joined.some((w) => re.test(w))).map(([, c]) => `knowledge/ui/components/${c}.md`)
    .concat(PATTERNS.filter(([re]) => words.some((w) => re.test(w))).map(([, p]) => `knowledge/ui/patterns/${p}.md`));
  const base = /\.(s[ac]ss|css)$/.test(rel) ? STYLE : MARKUP.concat(/\.(m?js|jsx|tsx|vue|svelte|astro)$/.test(rel) ? ['knowledge/code/javascript.md'] : []);
  return [...new Set(patterns.concat(base))];
}

/* A Figma component's name → its knowledge page, or null where none names it: "Text input",
   "_Feedback message", "Checkbox control". The whole name is tried joined first, then each pair of
   words and each word from the last: in English the head noun comes last, so "Alert dialog" is a
   dialog and "Input label" a label. `aliases` maps a project's own names (from its context document)
   to a page name. A set no page names is "no page" to the caller, never a finding. */
export function componentPage(name, aliases = {}) {
  const words = String(name).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  const own = Object.entries(aliases).find(([k]) => k.toLowerCase().replace(/[^a-z0-9]+/g, '') === words.join(''));
  if (own) return `knowledge/ui/components/${own[1].replace(/\.md$/, '')}.md`;
  // a group of buttons is the actions pattern's, not the button page's (button.md hands groups there); a checkbox
  // or radio group is its own page's
  if (/^button(group|set)s?$/.test(words.join(''))) return null;
  const tries = [words.join('')].concat(words.slice(1).map((w, i) => words[i] + w).reverse(), [...words].reverse());
  for (const w of tries) { const hit = COMPONENTS.find(([re]) => re.test(w)); if (hit) return `knowledge/ui/components/${hit[1]}.md`; }
  return null;
}
