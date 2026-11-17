# DTCG schemas

The Design Tokens Community Group's own JSON Schemas, copied verbatim so `../test-schema.mjs` checks an export against the standard offline, and changes only when the toolkit adopts a new version of it.

- `dtcg-2025.10/format.json` — <https://www.designtokens.org/schemas/2025.10/format.json>, the Format Module 2025.10 (token files).
- `dtcg-2025.10/resolver.json` — <https://www.designtokens.org/schemas/2025.10/resolver.json>, the Resolver Module 2025.10 (`tokens.resolver.json`).

Both are self-contained bundles (each referenced sub-schema is inside, under its own `$id`), so validating needs no network. Copied 2026-11-17. Never edited here: a new spec version is a new folder beside this one, fetched from the same address with its version in place of 2025.10.
