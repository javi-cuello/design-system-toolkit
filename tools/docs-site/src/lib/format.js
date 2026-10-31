// Formatting every page shares, stated once.
import { displayName } from '../../../shared/names.js';

// The site's base path, for links.
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

// Dates in UTC. In the build machine's own zone a run at 22:13Z read as the
// next day beside a date-only snapshot stamp that did not move. A value that
// is not a date renders as nothing rather than "Invalid Date".
// Written in the project's dialect: "22 Sept 2026" for en-GB, "Sep 22, 2026"
// for en-US, from the one `language` its context document states. This
// module renders on both sides — the pages at build, the dashboard in the
// browser — so it imports nothing of Node's: importing project.js here put
// `createRequire` in the browser bundle and the dashboard threw on load.
// project.js sets the language for the build; the page's <html lang> carries
// it to the browser.
// A language tag the runtime does not know ("en_US", "British English") would
// throw from every date on every page; it falls back instead.
const known = (l) => { try { return l && Intl.DateTimeFormat.supportedLocalesOf([l]).length ? l : null; } catch { return null; } };
const lang = () => known(typeof document !== 'undefined' ? document.documentElement.lang : globalThis.__docsLanguage) || 'en-GB';
const valid = (iso) => Boolean(iso) && !Number.isNaN(new Date(iso).getTime());
export const day = (iso) => (valid(iso) ? new Date(iso).toLocaleDateString(lang(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : null);
export const month = (iso) => (valid(iso) ? new Date(iso).toLocaleDateString(lang(), { month: 'short', timeZone: 'UTC' }) : null);
export const date = (iso) => (valid(iso) ? new Date(iso).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null);

// A number in the project's dialect, with its thousands separator
// ("31,381"), so a figure of five digits reads at a glance.
export const num = (n) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString(lang()) : String(n));
// A percentage to one decimal everywhere, so two figures side by side carry
// the same precision; a whole 0 or 100 is said whole. Rounded down, never to
// nearest: 99.97% coverage is not 100%, and a rounded 100.0% read as done
// beside a measure that was not. The one formatter: the dashboard's own,
// which floored, and this one, which rounded, disagreed on exactly that case.
// The epsilon keeps a float like 0.29 * 100 (28.999…) from flooring a step low.
export const percent = (n) => (n === 0 || n === 100 ? `${n}%` : `${(Math.floor(n * 10 + 1e-9) / 10).toLocaleString(lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);

// A count and its noun: "1 token", "12 tokens".
export const plural = (n, word) => `${num(n)} ${word}${n === 1 ? '' : 's'}`;

// Quotes too: the dashboard writes escaped values into attributes.
export const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// Figma descriptions are written in markdown: `code` names a property or
// value, **bold** stresses. Escaped first, so nothing else becomes markup.
export const md = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// A set's name on its page: without the page's name, or Figma's private
// underscore. `Tabs - Tab item` on the Tabs page is "Tab item". The sidebar's
// sub-items and the page's own part sections say it the same way.
// A component's name as a page shows it: `displayName` in names.js, which the parity engine shares.

export const partName = (name, title) => {
  // without the status marker leading any segment, whatever the project's is (figma-standard rule 13), then the private prefix
  const bare = displayName(name).replace(/^_/, '').trim();
  // the page's title is cut only on a word boundary: `Tables/Cell` does not start with `Table`
  const rest = bare.startsWith(title) && !/[\p{L}\p{N}]/u.test(bare[title.length] || '') ? bare.slice(title.length).replace(/^[\s/\u2013-]+/, '') : bare;
  return rest || bare;
};

// The set a component page is about: the one named for the page, else its
// first public set, else its first. Every other set on the page is a part,
// with a sub-page of its own under the page's address.
// A set's own name, as the page's title is written: without the category it
// sits in (`Accordion/`) and the status marker before it (`🚧 `). A library
// that names its sets `Accordion/🚧 Accordion` otherwise had no set "named
// for the page", and five pages each got a second page at their own address.
const ownName = (name) => displayName(name).replace(/^[^\p{L}\p{N}_]+/u, '').trim();
export const mainSet = (page) => page.components.find((c) => c.name.trim() === page.title || ownName(c.name) === page.title) || page.components.find((c) => !c.private) || page.components[0];
