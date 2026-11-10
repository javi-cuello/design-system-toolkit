// apply.js - SKILL.md step 6: write descriptions in one batch and report each.
// Fill CONFIG.docs with [id, markdown] pairs (six to nine per call; every member
// of a virtual set gets the same string) and send this file's body as the code
// of one figma_execute call. An empty string clears the description: both fields
// are set, since descriptionMarkdown alone can leave the plain-text one behind.
const CONFIG = {
  docs: [
    // ["0:2345", "Purpose paragraph.\n\n## Usage\n- Item"]
  ]
};

// Each write is read back. Figma rewrites some markdown as it stores it, harmlessly: trailing spaces and
// trailing blank lines go, and a "* " bullet at a line's start becomes "- " (observed 2026-11-10). Only
// those are forgiven, and a bullet only outside a code fence. Anything else that differs, such as the
// backslash it doubles in an escaped "\|", is a write that did not land as written, and is not ok.
const norm = (s) => { let fence = false; return String(s || '').split('\n').map((l) => {
  if (/^```/.test(l)) fence = !fence;
  l = l.replace(/\s+$/, '');
  return fence ? l : l.replace(/^\* /, '- ');
}).join('\n').replace(/\n+$/, ''); };
const applied = [];
for (const [id, md] of CONFIG.docs) {
  const n = await figma.getNodeByIdAsync(id);
  if (!n) { applied.push({ id, ok: false, err: 'not found' }); continue; }
  try {
    n.descriptionMarkdown = md;
    if (md === '') n.description = '';
    const stored = n.descriptionMarkdown || '';
    const cleared = md !== '' || (n.description || '') === '';
    if (norm(stored) === norm(md) && cleared) applied.push({ id, name: n.name, ok: true, len: stored.length });
    else applied.push({ id, name: n.name, ok: false, err: cleared ? 'stored text differs from what was written' : 'plain description not cleared', stored });
  } catch (e) {
    applied.push({ id, name: n.name, ok: false, err: String(e) });
  }
}
return applied;
