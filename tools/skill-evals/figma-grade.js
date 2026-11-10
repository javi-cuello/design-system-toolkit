// A figma_execute body: grades the frames a Figma task's agent built.
// Fill CONFIG from `node tools/skill-evals/figma.mjs grade-config <tasks> <task> <run>`,
// then send the file. It needs figma-components-audit's probes cached in the
// file at the current hash (that skill's SKILL.md, *Session probes*): the grade
// is FCA.composedFrame with { receipt: true } and FCA.references, never a
// second copy of either. It adds what those cannot see: a hidden or empty
// screen, a loose layer beside the screens (`strays`), and a receipt from
// another run (`stale`). A screen is a frame or an instance, on the page or in
// a Section at any depth. It never switches the page the user is on: the
// page is loaded, not opened (setCurrentPageAsync hung for minutes, 2026-11-11).
const CONFIG = { page: "", template: "", hash: "", run: "" };

const out = { page: CONFIG.page, run: CONFIG.run, references: [], flows: [], frames: [], strays: [] };
if (figma.root.getPluginData("fca.probes.hash") !== CONFIG.hash) return { ...out, error: "probes absent or stale: paste skills/figma-components-audit/scripts/probes.js first" };
try {
  (0, eval)("(" + figma.root.getPluginData("fca.probes.v1") + ")")();
  const pages = figma.root.children.filter((p) => p.name === CONFIG.page);
  if (pages.length !== 1) return { ...out, error: pages.length + " pages named " + CONFIG.page };
  const page = pages[0];
  await page.loadAsync();
  const template = await figma.getNodeByIdAsync(CONFIG.template);
  if (!template || !/^COMPONENT(_SET)?$/.test(template.type)) return { ...out, error: "no template component " + CONFIG.template };
  // a reference is a designer's screen: never a composed frame, nor anything on an eval page
  out.references = [...new Set((await FCA.references(template)).filter((r) => !r.composed && !/^Eval — /.test(r.page || "")).map((r) => r.frame))];
  const screens = [];
  (function walk(nodes, hidden) {
    for (const n of nodes) {
      if (n.type === "SECTION") walk(n.children, hidden || n.visible === false);
      else if (n.type === "FRAME" || n.type === "INSTANCE") screens.push({ n, hidden: hidden || n.visible === false });
      else out.strays.push(n.name);
    }
  })(page.children, false);
  for (const { n, hidden } of screens) {
    const r = await FCA.composedFrame(n, null, { receipt: true });
    let receipt = null;
    try { receipt = JSON.parse(n.getSharedPluginData("fca", "receipt") || "null"); } catch (e) { receipt = null; }
    const findings = r.findings.map((x) => x.kind);
    if (hidden) findings.push("hidden");
    if (!r.instances) findings.push("empty");
    if (receipt && receipt.run !== CONFIG.run) findings.push("stale");
    out.frames.push({ name: n.name, instances: r.instances, findings, receipt });
  }
  out.flows = page.flowStartingPoints.map((p) => p.name);
  return out;
} catch (e) {
  return { ...out, frames: [], error: "grader threw: " + (e && e.message || e) };
}
