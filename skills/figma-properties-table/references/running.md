# Running the scripts

How to load the script, load the rows, and drive the `PT` calls safely. [SKILL.md](../SKILL.md) steps 1, 2, 4 and 6 point here.

## Contents

- [1. Load the script](#1-load-the-script)
- [2. Load the rows](#2-load-the-rows)
- [3. The calls, and apply](#3-the-calls-and-apply)
- [4. A file already documented by hand](#4-a-file-already-documented-by-hand)

## 1. Load the script

**Paste `scripts/properties-table.js` once per file, ever — not once per session.** It caches its own source into the document's plugin data. Every later call loads it with this two-line bootstrap:

```js
if (typeof PT === 'undefined') { var s = figma.root.getPluginData('pt.src.v1'); if (s) (0, eval)('(' + s + ')')(); }
```

**Verify the first paste.** The load returns `sourceHash`, and `node scripts/hash.js` prints what it should be. Equal means the bytes that reached the file are the bytes on disk. Set `globalThis.__PT_EXPECT` to that value at the top of the paste. A mismatch is then refused before it is cached, rather than reported after.

The hash covers code only, with comments stripped, so a reworded comment is not a false alarm. Any change to the script's code changes the hash. Each file's cached copy is then refused until the script is pasted once more. This is the one step nothing else can check. A 32KB transcription that is subtly wrong produces plausible tables, and caching it would make that permanent.

`node tests/test-properties-table.js` covers the protocol itself.

*Why caching works:* the sandbox has `eval`, and globals persist across `figma_execute` calls within one file. `Function.prototype.toString()` returns real source. All three were tested, not assumed. Re-sending the script on every call had been the largest single cost of running these skills.

## 2. Load the rows

The rows command prints a `PT.rows({...})` call. It holds the rows of every component on the named pages, read from the open file:

```sh
node tools/component-contract/contract-rows.mjs --live <project> <page name…>
node tools/component-contract/contract-rows.mjs --live <project> --file <key> <page name…>
```

Add `--file <key>` where the project routes several library files.

It needs two things running:

- the project's audit service (`bin/audit <project>`)
- the Desktop Bridge open in the file, which connects to the service when it starts

A page with many large sets takes a while, since the walk flips each boolean. Run the printed call through the bridge before planning or applying.

The rows are kept in the document's plugin data per component, so a resumable `apply()` finds them on later calls. **Load them again at the start of every run**, since they are the file as it was when they were read.

A component no contract can be derived for is named on stderr. Both `plan()` and `applyPage()` skip a page whose components have no rows loaded, and say so. Never write rows by hand, and never read the properties another way.

## 3. The calls, and apply

```js
PT.rows({ ... })            // printed by tools/component-contract/contract-rows.mjs --live
await PT.profile()          // learn this file's scaffolding; persisted into the document
await PT.pages()            // pages that have a properties table
await PT.plan('❖ Button')   // dry run: proposed rows plus evidence, writes nothing
await PT.apply()            // generate everything, resumable
await PT.audit()            // verify output, plus component-hygiene findings ({ labels: true } holds labels to containment)
```

`profile()` runs once per file. Its result is stored in the document's plugin data, so later sessions skip straight to `apply()`. This is a *second* cache, apart from the source cache: one holds the script, the other what the script learned. Override anything detection gets wrong with `PT.setConfig({ ... })`.

`apply()` builds its own queue and works to a time budget. It saves the remainder back into the document and returns `remaining`. Call it again until `done` is true. The queue survives a dropped Desktop Bridge connection. Writes are change-detected, so re-running over a correct file is effectively free and safe.

**A call that times out has not stopped.** The budget is checked between pages, not inside them. So one page holding several large sets can overrun it. The bridge stops waiting after about 30 seconds, but the code keeps running inside the plugin. Calling again starts a second run beside the first, and runs in flight slow each other until every call times out.

So, after a timeout:

1. Wait.
2. Read what the last call left before calling again.
3. Where calls still time out, fill one page per call with `PT.applyPage(name)`.

Keep the default budget rather than raising it toward the bridge's limit. An explicit `apply({ pages: [...] })` is treated as a one-off and leaves any saved queue alone.

## 4. A file already documented by hand

`apply()` mirrors the components and does not preserve prose. Anything a person wrote that the script would not derive is replaced. So before applying, run `await PT.audit({ labels: true })`.

Its `problems` compare what is there with what would be written, so nothing is compared by hand (toolkit-standard §D 23):

- each title against the component names
- each subcomponent label against containment
- each table's row names against the rows loaded from the contract

`labelsUnchecked` names a page whose containment scan ran out of time; read its labels from `plan()` instead.

Agreement across the file means `apply()` is a refresh. Disagreement means reading a `plan()` before letting it write. Each disagreement is a finding: either a component has drifted from its documentation, or a rule in this skill is wrong.
