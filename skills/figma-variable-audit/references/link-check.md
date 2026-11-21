# The link check

How `scripts/links.js` works and why each step sits where it does. [SKILL.md](../SKILL.md) says what to run and in what order.

## Contents

- [The script](#the-script)
- [Connectivity](#connectivity)
- [The reference set](#the-reference-set)
- [Scope](#scope)
- [What the scan checks](#what-the-scan-checks)
- [Bindings that paint nothing](#bindings-that-paint-nothing)
- [Batching](#batching)

## The script

`scripts/links.js` is the whole check, run as a `figma_execute` body with constants prepended. Do not compose the walk by hand from this page.

| Mode | Where | Prepend | Returns |
|---|---|---|---|
| `keys` | source library | `const MODE = "keys";` | every local variable and style, by key |
| `sets` | consumer | `const MODE = "sets";` | the roots in scope with variant counts, and the published list |
| `scan` | consumer | `const MODE = "scan"; const KEYS = { … }; const TOKENS = { … };` | the broken links, in the components scanner's shape |

- `TOKENS` is the library's `audit-settings` entry, for `componentPages` and `excludeSections`.
- `const SCOPE = [ids];` beside `scan` walks only those sets. With no `SCOPE`, or an empty one, `scan` walks the whole file.
- `const SELF = true;` beside `sets` says the library is its own source. Its bindings are local, so `sets` returns `published: null` and does not probe.
- After a `SELF` run, the caller states that publish visibility does not apply, in place of the script's not-checked line. The dashboard writes that stage line itself; in a session, say it.
- A scan returns one candidate per missing token per set, naming the layers.

The script runs in node against fixture facts, with no Figma: `node tests/test-links.mjs`. The audit dashboard's *Audit* runs it as its fourth stage where the settings name `sourceLibrary`, with the source open in Figma beside the library.

## Connectivity

Multi-file work is prone to the connection silently following the user's own clicks in Figma, or dropping mid-session. Check it before building the reference set, and again before scanning the consumer:

```
figma_get_status (with probe: true)
```

- Check that `currentFileName` is the file you expect.
- To stay pinned to one file while the user works elsewhere, use `figma_navigate` with `lock: true`.
- Re-check after any pause, timeout or reconnect. Never assume the target held.

## The reference set

`keys` mode returns every local variable, with its `resolvedType` and collection. It also returns every text, effect, paint and grid style. Each comes by its stable `.key`.

- **Compare keys, never names**. Names collide and get reused on a different object. A string parsed out of a remote id is not a key either.
- **The script reads every type**. Step 0's narrower scope narrows the report (Step 6), never the reference set. A set filtered to colours reads every number binding as missing.
- **Sanity-check both counts** (`variables.length`, `styles.length`) before using the set.

**Persist the set; never retype or trim it between calls**. Shortening the key list "for efficiency" silently drops valid keys. Each dropped key becomes a false finding. Save the whole `keys` answer to `keys.json`. Read it back verbatim whenever you prepend it as `KEYS` to a consumer call.

Each scan returns `keysRead`, the counts it was handed. `report.mjs --keys keys.json` refuses any batch whose counts differ from the saved answer. The script compares the counts, not the eye.

## Scope

The scan walks only the file's own **editable component definitions**:

- `COMPONENT_SET` roots, and plain `COMPONENT`s outside a set.
- Never an instance as a root, and never a variant twice.
- Only on the pages `TOKENS.componentPages` admits, minus `TOKENS.excludeSections`.

**Inside a placed instance it reads only what that copy overrode**, and the instance's own frame counts as inside. Everything inherited belongs to the component it came from, which is audited in its own right. A row filed against the component that merely places it would name a layer nobody can fix there.

Skipping instances wholesale would lose the case that matters most: a binding overridden on this copy alone. A binding inside an instance is the consumer's when the override names `boundVariables` or that binding's own property. The instance's override list is read before its own frame, since the frame is the node it names most often. Nested instances add to the set rather than replace it.

**This scope is intended, not a shortcut to reconsider**. It can cut the layers checked by 10–100x on a file with heavy reuse.

It will not catch a one-off override on an instance placed outside a component. That is a different question: auditing every placed instance, not whether the file's own components are linked. Note this limit once in the report if relevant. Do not offer an instance-level pass, and do not ask about it unless the user does.

## What the scan checks

The scan reads every variable binding a node carries: every key of `node.boundVariables`. That covers fills, strokes, effects, radii, spacing, padding, sizing and string bindings.

It also reads every style reference:

```
fillStyleId  strokeStyleId  textStyleId  effectStyleId  gridStyleId
```

Each id is resolved once and cached. Variables and styles are separate systems in Figma's API and are checked separately.

`checkFacts` classifies each missing key. The finding's state and severity say which case it is; the script's comments say why each is its own state.

| State | Severity | Why |
|---|---|---|
| The id no longer resolves | error | nothing resolves a dangling id |
| The source holds it but does not publish it | error | the layer renders from its last value and never receives an update |
| The source publishes the name under another key | error | the binding sits on a superseded generation of that token |
| The source does not carry the name at all | review | it may belong to a second library this run did not read |

Variable and style names are compared through a spelling fold. It lowercases, then folds colour→color, grey→gray, behaviour→behavior and centre→center. So `Colour/…` on a retired key matches a source publishing `Color/…`. That finding's advice names the token to rebind to.

**A variable inside an applied style is not raised**. Figma copies a style's variable bindings onto the layer that applies it. A fill, stroke or effect binding on a layer that applies the matching style is skipped and counted in `measures.styled`. The style reference itself is still checked.

**The published list is read in the consumer**, since publishing is a fact about the subscription. An empty list is a failed probe, never a library that publishes nothing. Used as a reference, it would report every binding broken. So it is ignored, and the run says publish visibility was not checked.

Figma's team-library API lists variables only, so "held but not published" can never be raised for a style. Each probe is reported for itself.

## Bindings that paint nothing

**A binding that paints nothing is not raised**. Take a stroke weight bound on a layer with no stroke paint. It has no row in Figma's Stroke panel. It cannot be seen, selected or removed there.

- Such layers are dropped from every finding, and a finding left with none disappears.
- The run reports how many it dropped (`measures.dead`), since an unstated silence reads as absence.
- A finding with some painted layers stands for those.
- Clearing such a binding takes `setBoundVariable(prop, null)`.

## Batching

A library too big for one plugin call is scanned in batches. The cost is variants times bound layers, so the size that fails is not knowable in advance. The dashboard batches because a 121-set library overran a four-minute cap and lost the whole stage.

1. Run `const MODE = "sets";` in the consumer once. It enumerates the roots with their variant counts and reads the published list, resolving no bindings.
2. Run `scan` with `const SCOPE = [ids];` for each batch. Pass `KEYS.published` from the enumeration, so the probe is read once.
3. Union each batch's `seen` rather than summing `distinctVariables`. A variable bound by forty sets is one variable, not forty.

- A supplied `KEYS.published` list object is used as given, even when its lists are empty: a failed probe stays failed across every batch.
- A null or absent `KEYS.published` makes `scan` probe again, so never pass `null` through.
- Where `sets` returned `published: null` (a `SELF` run), pass `published: { variables: [], styles: [] }` instead.
- An id in `SCOPE` that no longer resolves, or resolves to anything but a `COMPONENT_SET` or `COMPONENT`, is dropped, not raised.
- `SCOPE` ids skip the `componentPages` and `excludeSections` filters: they come from `sets`, which already applied them.
- A single `scan` with no `SCOPE`, or an empty one, still walks the whole file, which suits a session with one call.
- After any timeout, re-run `figma_get_status` before resubmitting. Never assume the connection is still good.
