# Code Connect

What Figma's Code Connect is, what it reads and checks, how to keep a library ready for it, and how an agent or a developer uses it. As of 2026-11-17; Figma's tooling changes monthly, so re-check anything dated before relying on it.

**Implements:** the step after [reading a design file into code](figma-handoff.md): pairing each Figma component with the code component that ships it.

## What it is

**What good looks like**
- [strong] Code Connect links a Figma component to its code component, so Dev Mode shows the production snippet and the MCP server gets real imports and props instead of generated markup ([Figma, Code Connect](https://developers.figma.com/docs/code-connect/)).
- [strong] It maps components and their properties. It does not map variables: a variable's Dev Mode text is its own code syntax field (code-standard rule 52), a separate mechanism.

**How**
- [strong] Two routes. The **UI** runs in Figma with no install and allows one-to-many mappings, but has no property mapping or dynamic examples, takes one code library, and its Inspect panel shows only file and component name. The **CLI** (`@figma/code-connect`) gives property mapping, dynamic snippets and snippets in Inspect ([Figma, UI and CLI compared](https://developers.figma.com/docs/code-connect/comparing-cc/); [help](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect)).
- [strong] A connection made in the CLI shows in the UI but can only be edited in the CLI.
- [strong] **Template files are the current format**: `.figma.ts` or `.figma.js`, for any framework or language. The framework parsers (`figma.connect(...)` in `.figma.tsx`, and the HTML, SwiftUI and Compose ones) are legacy: 2.0.0 (18 August 2026) limited them to `migrate` and `unpublish`, and 1.5.0 said they were unmaintained after 17 August ([releases](https://github.com/figma/code-connect/releases)). A guide or a snippet written with `figma.connect` predates that.
- [strong] A template reads a property through the selected instance: `getString`, `getBoolean`, `getEnum`, `getInstanceSwap`, `getSlot`; nests with `findInstance`, `findConnectedInstances`, `findLayers` and `executeTemplate()`. Build the snippet inside `figma.code`, never by concatenating strings ([template API](https://developers.figma.com/docs/code-connect/template-api/)).
- [strong] A property is matched by its literal name: a rename in Figma breaks the mapping (`breaking-changes-in-a-figma-library.md` in `research/` has the test).

## What it checks

**What good looks like**
- [strong] `figma connect publish` validates against the Figma API (`--skip-validation` turns that off). Files it cannot read are skipped without a word unless `--exit-on-unreadable-files` is set, which Figma recommends for CI. A mapping made in the UI blocks a CLI publish unless `--force` ([CLI reference](https://developers.figma.com/docs/code-connect/cli-reference/)).
- [weak] The CLI reference does not list which mismatches fail a publish. Tested elsewhere: an enum value that no longer matches does not fail it (`research/figma-and-code/breaking-changes-in-a-figma-library.md`). One source each; unchecked since.
- [strong] `figma connect preview` renders snippets as Dev Mode would, and syntax-checks TS, JS, JSX and TSX output only.

## How to support it

**How**
- [strong] Publish the library, then connect: the UI needs published components, and the CLI needs the file's node URL (`figma connect create <node-url>` writes a starter file from the component's properties).
- [strong] A Dev or Full seat on Professional, Organization or Enterprise. Professional allows one active library and one active framework; the others are deactivated and the MCP server does not return them ([quickstart](https://developers.figma.com/docs/code-connect/quickstart-guide/)). The README says Organization and Enterprise only; the docs and the Help Center agree against it.
- [strong] A nested instance is connected on its own; the parent's mapping does not reach it.
- [moderate] One mapping per component, kept in the repo beside the code. Property names in Figma the code's words, so the mapping is a rename-free pass-through (figma-standard rule 21).
- [moderate] CI: `npx figma connect publish --exit-on-unreadable-files` on a push to main, filtered to the mapping files, with the token as a secret. The token needs the Code Connect: Write and File content: Read scopes; a plan token lasts up to a year, a personal one at most 90 days ([CI/CD](https://developers.figma.com/docs/code-connect/ci-cd/)). Figma gives no PR-time `parse` guidance.
- [strong] Config sits under `codeConnect` in `figma.config.json`: `include`, `exclude`, `label`, `language`, `parser`, `documentUrlSubstitutions`, `defaultBranch`. Several frameworks take one config each, run with `--config` ([config](https://developers.figma.com/docs/code-connect/api/config-file/)).

## How to use it

**How**
- [strong] The MCP server's `get_design_context` returns generated React and Tailwind by default; on the remote server, `clientFrameworks` set to the Code Connect `label` returns the mapped snippet. `get_code_connect_map` returns `componentName`, `source`, `snippet`, `snippetImports`, `label` ([MCP tools](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)).
- [strong] `get_variable_defs` lists the variables and styles a selection uses; it is not Code Connect, and returns nothing for raw hex values (third-party; unchecked).
- [moderate] A component with no mapping comes back as generated markup. Figma's own test of 27 cases is summarised in `research/ai-and-docs/building-screens-with-an-agent.md`.

**Cases**
- A Figma button's `Size=Large` is renamed `Lg` → the template's `getEnum` keys still say `Large`, the publish passes, and Dev Mode prints the wrong prop. Edit the template in the same change as the rename.
- A card nests a button → the button has its own mapping, or the card's snippet shows an unmapped placeholder.
- A snippet needs a token → write the token's CSS name in the example, from the same name the build writes (code-standard rule 52); Code Connect does not read variables for it.

## Known limits

- [moderate] `get_code_connect_map` returns an empty map without saying why: a wrong file key and a timeout look the same ([issue 407](https://github.com/figma/code-connect/issues/407)).
- [moderate] `tsconfig` `paths` in imports are not supported ([issue 408](https://github.com/figma/code-connect/issues/408)); `preview` lacks nested components ([issue 412](https://github.com/figma/code-connect/issues/412)); `normalizePropName` strips every `#` from a property name ([issue 419](https://github.com/figma/code-connect/issues/419)).
- [weak] Not verified: `links` and data attributes, the parameters of `add_code_connect_map` and `send_code_connect_mappings`, whether a snippet can reference a variable, and any forum-only reports.

**Check**
- *Script:* none today. A repo with mapping files could be checked against the snapshot's component property names and options; no registered repo has any yet.
- *Judgement:* Does each mapped property name equal the code's prop, and does each nested instance have its own mapping?

**Sources:** the Figma developer docs and Help Center pages linked above, the `figma/code-connect` releases and issues (fetched 2026-11-17).
