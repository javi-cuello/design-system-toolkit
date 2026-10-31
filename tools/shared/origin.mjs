// Is a request's Origin Figma itself? figma.com or one of its subdomains,
// matched by hostname: a suffix match on the string let "evilfigma.com"
// through once. One definition for the two local services that let the
// Figma plugin in (tools/snapshot/router.mjs, tools/figma-audit/server.mjs).
export const isFigmaOrigin = (origin) => {
  try { const h = new URL(origin).hostname; return h === 'figma.com' || h.endsWith('.figma.com'); } catch { return false; }
};
