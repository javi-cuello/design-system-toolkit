// A prompt template filled from text the Figma file, the code or a project
// wrote. One pass over the template, so a `{{…}}` inside a value is left as
// written: filled one key after another, a Figma name holding "{{CODE}}" had
// the code list spliced into it (toolkit review, 2026-10-31). A key the values
// lack is left as written too. Pure: the dashboard and its tests import it.
export const fillPrompt = (template, values) =>
  String(template).replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(values, k) ? String(values[k]) : m));
