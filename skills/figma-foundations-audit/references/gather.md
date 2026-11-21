# Gathering the facts

Step 3 of [SKILL.md](../SKILL.md): the three ways to gather the facts, and what the stored snapshot cannot say.

## Contents

- [The three paths](#the-three-paths)
- [From the snapshot](#from-the-snapshot)
- [Which component sits inside which](#which-component-sits-inside-which)
- [Live, for a file with no snapshot](#live-for-a-file-with-no-snapshot)
- [From the Audit lite plugin](#from-the-audit-lite-plugin)
- [What the snapshot cannot say](#what-the-snapshot-cannot-say)

## The three paths

| Path | When | Runs |
|---|---|---|
| From the snapshot | The project has a stored snapshot | `scripts/from-snapshot.mjs` |
| Live | A file with no snapshot | `scripts/foundations.js` through `figma_execute` |
| Audit lite | A library with nothing else set up | The plugin's copy of `scripts/foundations.js` |

All paths end in the same pure `checkFacts`, so a finding is the same finding either way. A file-level finding names `Page list` as its set. The live and snapshot paths were diffed on a real library and gave identical findings.

## From the snapshot

Prefer this path where the project has a snapshot. Every fact these rules read is already in the store. Reading the file live for them is a second reader of one fact (toolkit-standard §D 5).

`scripts/from-snapshot.mjs` takes `{ pages, specs, icons }` and returns the same `{ pages, components }` the live gather produces. It hands them to the same `checkFacts`.

| Input | What it is | Where it is stored |
|---|---|---|
| `pages` | The page names in file order | `_meta.pages` |
| `specs` | One resolved spec per component: name, id, page, and the components its variants instantiate | The component's stored spec |
| `icons` | The icon page's components, as `{ name, page }` | `store.iconComponents(tokens)` joins the two stored facts |

The caller resolves the specs, because a skill reads no file outside its own folder.

## Which component sits inside which

**One owner: `tools/snapshot/graph.cjs`.** Pass its `parentsByName` output as `{ parents }`, or `--parents` on the CLI. Without it, the adapter falls back to a walk over names. `parentsFrom` in the result says which ran.

The fallback walk follows three rules:

- It resolves an instance to the longest stored name the string starts with. It never cuts at the first ` / `, since a component may be named `Table - Cell / Fill`.
- A name two specs share resolves to neither, rather than to whichever file was read last.
- An icon is addressed by both its stored name and its prefixed one. A consumer's `instanceOf` says `Icon/plus` where the icon is stored as `plus`.

## Live, for a file with no snapshot

Run `scripts/foundations.js` through `figma_execute`. Prepend `const TOKENS = { … };` as `node tools/snapshot/projects.cjs settings <project> <fileKey>` prints it.

It returns `{ audited: [{ set, id, page, candidates }], fileKey, fileName }`. Refuse the result if `fileKey` is not the library's.

## From the Audit lite plugin

The Audit lite plugin (`plugins/audit-lite`) carries `scripts/foundations.js` as a generated block. Its `sync.mjs` writes the block and `bin/check` holds it equal. The plugin runs it after the components scan, on the same settings.

**A change to `foundations.js` is followed by `node plugins/audit-lite/sync.mjs`.**

## What the snapshot cannot say

Each limit is reported, never hidden:

| Limit | What the run does |
|---|---|
| A page's node id is not stored | Nothing to do: the finding's id is only a link, and every rule reads names |
| A page no component sits on never reaches the store | `pagesWithNoComponent` names those pages, so a page-level rule over one is reported unchecked, not clean |
| Mode pins are not stored | The pin checks go under *Not checked* |
| Page section cards are not stored | The template check goes under *Not checked*, since `from-snapshot.mjs` builds no `templates` |
| A store older than plugin 0.34.0 strips a page prefix from a name | The component is named in `namesNotSettled`, and a name check over it is unchecked, never clean |
| A store older than plugin 0.35.0 records no icon page | `iconComponents` returns those sources under `unplaced`, and the run says how many icons it could not place |

**Why the page prefix matters.** The store namespaces a component whose name does not start with its page's name. So `cursor` on a `Graphic` page is stored `Graphic/cursor`. Every rule here reads names, and that prefix looks like a slash a designer typed. Plugin 0.34.0 records `figmaName` where the two differ.

**Why the icon page matters.** The plugin exports an icon page as SVGs and writes no component folder, so an icon has no stored spec. A spec per glyph would swamp the store. Its name was always stored, and plugin 0.35.0 records the page it sits on. A reader may not assume what an icon page is called.
