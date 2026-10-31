/*
 * A component prop's name as the HTML attribute its value is written in: the
 * one rule to-code styles by (`namer().attr`), to-markup writes, and parity's
 * `-attr` check reads (adapt.mjs). Two rules once did this: to-code split
 * camelCase and prefixed `data-`, parity only kebab-cased, so parity checked an
 * attribute the generated CSS never reads (toolkit review, 2026-10-31).
 *
 *   attrWords('showIcon') → 'show-icon'   attrWords('Show icon') → 'show-icon'
 *   propAttr('size', { kind: 'class' })   → 'data-size'
 *   propAttr('tone', { kind: 'element' }) → 'tone'   ('size' → 'data-size': an HTML attribute's name)
 *   propAttr('size', null)                → 'size'   (markup written by hand: the words, a project's `rename` for the rest)
 *
 * A name is a Figma property's or a contract key's: a contract key is the
 * Figma name camelCased, and both give the same words.
 */
// an HTML or ARIA attribute a prop must not be spelt as on a custom element (code-standard rules 9 and 10)
// (HTML's global attributes among them: a `style` prop on the host would be its inline style)
export const TAKEN = new Set(['role', 'align', 'valign', 'hidden', 'disabled', 'title', 'lang', 'width', 'height', 'border', 'bgcolor', 'size',
  'style', 'class', 'id', 'slot', 'dir', 'name', 'is', 'part', 'tabindex', 'inert', 'popover', 'draggable', 'translate', 'autofocus', 'nonce', 'accesskey', 'spellcheck', 'contenteditable', 'enterkeyhint', 'inputmode', 'autocapitalize', 'exportparts', 'itemprop']);

// a name's words, hyphenated: camelCase split, then anything not a letter or digit one hyphen
export const attrWords = (name) => String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* The attribute, by the project's `styles.naming` where to-code writes its sheets: a class-named component's props
   are `data-` attributes, a custom element's its own unless the name is taken. With no naming (markup written by
   hand, which no generated sheet reads) the words alone. */
export function propAttr(name, naming) {
  const w = attrWords(name);
  if (!naming) return w;
  return naming.kind === 'element' && !TAKEN.has(w) ? w : `data-${w}`;
}
