// The Lucide release the icon importer pins (plugins/lucide-icon-importer), so the icon-name check
// (figma-foundations-audit library.mjs iconChecks) reads the names of the set the library's icons were
// imported from. Read by the dashboard service and bin/audit; null when the importer is not there.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const UI = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "plugins", "lucide-icon-importer", "ui.html");
export const lucideVersion = () => {
  try { return (/LUCIDE_STATIC_VERSION = '([\d.]+)'/.exec(readFileSync(UI, "utf8")) || [])[1] || null; }
  catch { return null; }
};
