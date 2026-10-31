# Shared

Small libraries more than one tool imports, kept in one place so each has one definition. Nothing here runs on its own.

| File | What it gives |
|---|---|
| `walk.mjs` | One walk of a repo's files, skipping what every check skips (`node_modules`, build output, dot-folders). |
| `dialect.cjs` | Which English spelling the toolkit's own words use for a project (its `language` setting), so generated text follows the project; the doc generator's sandbox copy is held to it by `test-dialect.mjs`. |
| `repo-config.cjs` | A repo's `snapshot.config.json`, read one way: `readRepoConfig` tells a missing file from a malformed one, `repoConfig` says which under the tool's name and exits 2. Every command that needs the file reads it here. |
| `cdp.mjs` | The Chrome DevTools client every browser run uses (parity, ui-check, the docs checks, the contract tools): `findChrome` (`$CHROME`, else the usual macOS and Linux places), `launch` (its own profile, killed at exit), `newPage`, `navigate`, `viewport`, `media`, `screenshot`, `pool`. |
| `origin.mjs` | `isFigmaOrigin`: whether a request comes from Figma itself (figma.com or a subdomain, by hostname), for the two local services the Figma plugin talks to. |
| `names.js` | How a component's Figma name is shown to a reader (`displayName`, `fullName`), and a variant's name read as its prop values (`variantValues`): one definition for the docs site, the parity engine, the contract tools and the sandbox scripts that copy it, each held to it by `test-names.mjs`. |
| `colour.js` | The sRGB transfer both ways, WCAG 2 relative luminance and contrast ratio (WCAG 2.2's 0.04045 threshold), and OKLab to linear sRGB: imported by the parity engine, copied by the components audit's scanner and the OKLCH generator, each copy held to it by `test-colour.mjs`. |
| `real-path.mjs` | `realPath` and `samePath`: a path in its on-disk spelling, so a shell that entered through `~/projects` on a case-insensitive disk still matches a stored `~/Projects` path (project-check, parity, the contract tools). |
| `knowledge.mjs` | `uiFile` (is a project file interface work) and `pagesFor` (the knowledge pages to read before writing it, by its kind and the words in its path): one notion for the edit hook and the push check's `Knowledge:` gate (toolkit-standard §D 21). |
| `output.mjs` | What keeps a written file the same for the same input (toolkit-standard §D 23): `compareNames`, one sort order whatever the machine's locale, and `writeReport`, which leaves a run's report alone when only its date and seconds moved (the snapshot store, the contract and parity tools). |
| `prop-attr.mjs` | A component prop's name as the HTML attribute its value is written in (`propAttr`, `attrWords`): the one rule to-code styles by, to-markup writes and parity's `-attr` check reads, held by `test-prop-attr.mjs`. |
| `code-inventory.mjs` | What a code library contains, read from its folders, and how its components line up with the ones in Figma (used by the docs site and the audit). |

```sh
node tools/shared/test-code-inventory.mjs
node tools/shared/test-real-path.mjs
node tools/shared/test-dialect.mjs
node tools/shared/test-output.mjs
node tools/shared/test-knowledge.mjs
node tools/shared/test-prop-attr.mjs
node tools/shared/test-cdp.mjs    # needs Chrome
```

A file belongs here only when two or more tools import it; one used by a single tool lives in that tool's folder.
