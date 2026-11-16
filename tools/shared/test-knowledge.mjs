#!/usr/bin/env node
// tools/shared/knowledge.mjs: which project files are interface work, and the
// knowledge pages named for one. Run by bin/check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uiFile, pagesFor, componentPage } from './knowledge.mjs';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('markup, components and stylesheets are interface work; a script, a story, a parity fixture and a doc are not',
  ['src/a.tsx', 'site/templates/home.php', 'src/a.module.scss', 'src/x.astro'].every(uiFile)
  && !['src/lib/a.ts', 'src/a.stories.tsx', 'src/a/parity.mjs', 'tests/parity/frame.html', 'README.md'].some(uiFile));
const p = (rel) => pagesFor(rel).map((x) => path.basename(x));
ok('a path\'s words name its patterns: a dialog, an upload, a settings form, a sidebar switcher',
  p('src/screens/people/delete-dialog.tsx').includes('dialogs.md')
  && p('src/screens/people/import/UploadStep.tsx').includes('upload.md') && p('src/screens/people/import/UploadStep.tsx').includes('steppers.md')
  && ['forms.md', 'settings.md'].every((x) => p('src/app/(account)/account/settings-form.tsx').includes(x))
  && p('src/screens/shell/workspace-switcher.tsx').includes('sidebars.md'));
ok('a stylesheet gets the visual and code fundamentals; markup the five design areas and the semantics',
  p('src/a.scss').includes('visual.md') && p('src/a.scss').includes('css-architecture.md') && !p('src/a.scss').includes('ux.md')
  && ['ux.md', 'interaction.md', 'visual.md', 'content.md', 'accessibility.md', 'html-semantics.md'].every((x) => p('src/a.tsx').includes(x)));
ok('no pattern from a word that only contains one: a table is not tabs, design is not sign-in',
  !p('src/table.tsx').includes('navigation.md') && !p('src/design-system/x.tsx').includes('authentication.md'));
const all = 'src/dialog-upload-form-settings-nav-sidebar-menu-pager-search-filter-select-chip-step-login-consent-button-accordion-toast-table-grid-chart-stats-inspector.tsx';
ok('every page named exists, and every pattern page has a word that names it',
  ['src/a.scss', all].flatMap(pagesFor).every((x) => fs.existsSync(path.join(TK, x)))
  && pagesFor(all).filter((x) => x.includes('/patterns/')).length === fs.readdirSync(path.join(TK, 'knowledge/ui/patterns')).filter((f) => f.endsWith('.md')).length);
// 2026-11-16: a component's page comes first, and every component page has a word that names it.
ok('a path\'s words name its component page before its pattern: a tooltip, a button, a segmented control',
  p('src/components/Tooltip.tsx')[0] === 'tooltip.md' && p('src/components/Tooltip.tsx').includes('dialogs.md')
  && p('src/ui/icon-button.scss')[0] === 'button.md' && p('src/SegmentedControl.vue').includes('segmented-control.md')
  && !p('src/table.tsx').some((x) => x === 'tabs.md')
  && !['src/OrderDetails.tsx', 'src/DateRangePicker.tsx', 'src/ActionSheet.tsx', 'src/ThemeToggle.tsx'].some((f) => pagesFor(f).some((x) => x.includes('/components/'))));
const comps = 'src/button-link-tabs-breadcrumbs-dialog-drawer-popover-tooltip-accordion-checkbox-radio-switch-select-combobox-segmented-slider-toast-alert-badge-chip-input-textarea-searchbox-label-feedback-message-progress-spinner.tsx';
ok('every component page has a word that names it, and every one named exists',
  pagesFor(comps).filter((x) => x.includes('/components/')).length === fs.readdirSync(path.join(TK, 'knowledge/ui/components')).filter((f) => f.endsWith('.md') && f !== 'README.md').length
  && pagesFor(comps).every((x) => fs.existsSync(path.join(TK, x))));
ok('a two-word component name is read joined: TextArea, FieldError, ProgressBar, a search input',
  p('src/TextArea.tsx')[0] === 'text-area.md' && p('src/field-error.tsx')[0] === 'feedback-message.md'
  && p('src/ProgressBar.vue')[0] === 'progress-indicator.md' && p('src/search-input.scss').includes('search-input.md')
  && !p('src/area-chart.tsx').some((x) => x === 'text-area.md'));
ok('…and a word that names other things names no component: a data loader, a results page, a folder of inputs',
  !['src/data/loader.ts', 'src/pages/SearchResults.tsx', 'src/inputs/date-picker.tsx'].some((f) => pagesFor(f).some((x) => /spinner|search-input|text-input/.test(x))));
// 2026-11-16: a Figma component's name finds its page, the whole name before its words, and none where no page names it.
const c = (x) => (componentPage(x) || '').replace('knowledge/ui/components/', '');
ok('a Figma name finds its page: spaces, a private prefix, a part of a set, the whole name before a word',
  c('Text input') === 'text-input.md' && c('_Feedback message') === 'feedback-message.md' && c('Checkbox control') === 'checkbox.md'
  && c('Search input') === 'search-input.md' && c('Icon button') === 'button.md' && c('Tab bar item') === 'tabs.md' && c('Progress indicator') === 'progress-indicator.md');
ok('…the head noun, last in English, wins over a modifier', c('Alert dialog') === 'modal-dialog.md' && c('Input label') === 'label.md'
  && c('Link button') === 'button.md' && c('Tag input') === 'text-input.md');
ok('…and a project\'s own name routes through its aliases', (componentPage('Notice', { Notice: 'alert' }) || '').endsWith('/alert.md') && componentPage('Notice') === null);
ok('…and a button group is no component page, a radio group is the radio page', componentPage('Button group') === null && c('Radio group') === 'radio.md' && c('Tab bar') === 'tabs.md');
ok('…and a name no page holds is no page, not a guess', componentPage('Avatar') === null && componentPage('Card header') === null);
console.log(`${n}/${n} passed`);
