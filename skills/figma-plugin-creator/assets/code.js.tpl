// {{name}} — v0.1.0 · standard v{{standard}}
// @ts-check
// {{purpose}}
// Data stored: (document in README; keep pluginData entries under 100 kB)

figma.showUI(__html__, { themeColors: true, width: 320, height: 400 });

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'run': {
        figma.skipInvisibleInstanceChildren = true;
        // …Async APIs only (getNodeByIdAsync, getMainComponentAsync, …)
        figma.ui.postMessage({ type: 'done', id: msg.id });
        break;
      }
      case 'close': figma.closePlugin(); break;
    }
  } catch (e) {
    figma.notify(String(e && e.message || e), { error: true });
  }
};
