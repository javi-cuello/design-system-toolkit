// Runs the extension check in node against fixture facts, with no Figma.
//   node skills/figma-variable-audit/tests/test-extensions.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "scripts", "extensions.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const checkExtensions = await new AsyncFunction(src)();

let failed = 0, passed = 0;
const expect = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) passed++;
  else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
};
const kinds = (r) => r.findings.map((f) => f.kind + " " + f.extension + " " + f.token);

const MODES = ["Light", "Dark"];
const parent = {
  name: "04. Semantic - Brand", modes: MODES,
  tokens: [
    { name: "Colour/Background/Primary/soft", perMode: { Light: "Colour/Brand/Acme/Primary/3", Dark: "Colour/Brand/Acme/Primary/3" } },
    { name: "Colour/Background/Primary/inverse", perMode: { Light: "Colour/Brand/Acme/Primary/9", Dark: "Colour/Brand/Acme/Primary/9" } },
    // not a brand ramp: a shared neutral, which no brand needs to override
    { name: "Colour/Stroke/selected", perMode: { Light: "Colour/Palette/Grey/12", Dark: "Colour/Palette/Grey/12" } },
  ],
};
const ov = (target) => ({ Light: target, Dark: target });

// 1. an extension that overrides every brand-backed token is clean
{
  const r = checkExtensions({ brandGroup: "Brand", parent, extensions: [{ name: "Brand B", overrides: {
    "Colour/Background/Primary/soft": ov("Colour/Brand/Brand B/Primary/3"),
    "Colour/Background/Primary/inverse": ov("Colour/Brand/Brand B/Primary/9"),
  } }] });
  expect("a fully overridden extension raises nothing", kinds(r), []);
  expect("and the parent's own brand is reported, so a reader knows what inheriting means",
    [r.parentBrands, r.brandTokens], [["Acme"], 2]);
}

// 2. a token left inherited renders the parent's brand
{
  const r = checkExtensions({ brandGroup: "Brand", parent, extensions: [{ name: "Brand B", overrides: {
    "Colour/Background/Primary/soft": ov("Colour/Brand/Brand B/Primary/3"),
  } }] });
  expect("a brand-backed token with no override is reported",
    kinds(r), ["inherits Brand B Colour/Background/Primary/inverse"]);
  expect("and the finding says whose colour it will render",
    /renders the parent's brand \(Acme\)/.test(r.findings[0].text), true);
}

// 3. a token the parent backs with a shared neutral is nobody's business
{
  const r = checkExtensions({ brandGroup: "Brand", parent, extensions: [{ name: "Brand B", overrides: {
    "Colour/Background/Primary/soft": ov("Colour/Brand/Brand B/Primary/3"),
    "Colour/Background/Primary/inverse": ov("Colour/Brand/Brand B/Primary/9"),
  } }] });
  expect("a token aliasing a shared palette is never reported as inherited",
    r.findings.filter((f) => f.token === "Colour/Stroke/selected").length, 0);
}

// 4. an override pointing at another brand's ramp
{
  const r = checkExtensions({ brandGroup: "Brand", parent, extensions: [{ name: "Brand B", overrides: {
    "Colour/Background/Primary/soft": ov("Colour/Brand/Brand B/Primary/3"),
    "Colour/Background/Primary/inverse": ov("Colour/Brand/Brand C/Primary/9"),
  } }] });
  expect("an override on another brand's ramp is reported once per mode",
    kinds(r).filter((k) => k.startsWith("foreign")).length, 2);
  expect("and it names both brands",
    /points at Brand C's ramp, while the rest of Brand B points at Brand B's/.test(r.findings.find((f) => f.kind === "foreign").text), true);
}

// 5. an override that covers one mode and not the other
{
  const r = checkExtensions({ brandGroup: "Brand", parent, extensions: [{ name: "Brand B", overrides: {
    "Colour/Background/Primary/soft": { Light: "Colour/Brand/Brand B/Primary/3" },
    "Colour/Background/Primary/inverse": ov("Colour/Brand/Brand B/Primary/9"),
  } }] });
  expect("a half-covered override is reported as partial, not as inherited",
    kinds(r), ["partial Brand B Colour/Background/Primary/soft"]);
  expect("and it names the mode that falls back", /not in Dark/.test(r.findings[0].text), true);
}

// 6. a project whose ramps are not grouped by brand gets no brand findings
{
  const flat = { name: "P", modes: MODES, tokens: [{ name: "T", perMode: { Light: "Colour/Accent/3", Dark: "Colour/Accent/3" } }] };
  const r = checkExtensions({ parent: flat, extensions: [{ name: "X", overrides: {} }] });
  expect("no Brand group in the ramp paths means nothing is invented", [kinds(r), r.brandTokens], [[], 0]);
}

// 7. no brandGroup in the settings, no brand findings, even on brand-grouped ramps
{
  const r = checkExtensions({ parent, extensions: [{ name: "Brand B", overrides: {} }] });
  expect("no recorded brand group means nothing is invented", [kinds(r), r.brandTokens], [[], 0]);
}

console.log(failed ? `FAIL — ${failed} of ${passed + failed}` : `pass — ${passed} of ${passed} assertions`);
process.exit(failed ? 1 : 0);
