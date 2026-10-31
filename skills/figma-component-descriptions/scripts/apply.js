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

const applied = [];
for (const [id, md] of CONFIG.docs) {
  const n = await figma.getNodeByIdAsync(id);
  if (!n) { applied.push({ id, ok: false, err: 'not found' }); continue; }
  try {
    n.descriptionMarkdown = md;
    if (md === '') n.description = '';
    applied.push({ id, name: n.name, ok: true, len: (n.descriptionMarkdown || '').length });
  } catch (e) {
    applied.push({ id, name: n.name, ok: false, err: String(e) });
  }
}
return applied;
