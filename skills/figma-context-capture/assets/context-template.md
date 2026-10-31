# Design System Context — {PROJECT NAME}

> **For Claude / figma-* skills:**
>
> 1. Match the connected file's `fileKey` in §2; apply that library's rules (§4) + shared conventions (§3) + policies (§5).
>
> 2. Rules and §6 rulings outrank file evidence — report conflicts, never re-derive.
>
> 3. **This document records rules and rulings, not state.** Counts, coverage and inventory are always read live, never quoted from here. Where a figure does appear (audit output in §4), it is dated evidence of a past run, never current truth.
>
> 4. Discovery only for `[TBD]`. Untagged = confirmed; `[inferred]` = pattern-derived (sample noted).
>
> 5. New rulings: end the run by outputting updated §5/§6 lines for paste-back.
>
> 6. Stale-copy check: file evidence showing a queued fix already completed, or conventions this document doesn't know, suggests an outdated copy of this document — prompt the maintainer to swap in the latest version before treating it as a conflict.
>
> > **Deployment (once):** in Claude Code, none: this doc lives at `<project home>/design-system-context.md`, where the tools and skills read it. In a claude.ai Project, add this doc to the Project's knowledge, and add to
>
> custom instructions: `Before any figma-* skill, load the design system context doc and match by fileKey.`
>
> > Never apply one library's section to a different `fileKey`.

**Project:** {name} · **Platforms:** {web / iOS / Android / …} · **Last rules update:** {date} **Canonical copy:** {repo URL or "this file"}

---

## 1 · The system in one page (human overview)

{One or two short prose paragraphs a new designer — or the project — could read: what kind of system this is (brands, themes, platforms), where the source of truth lives, how components consume it, the one or two conventions that make it distinctive. No keys, no counts, no jargon that needs the rest of the document.}

**Why it's built this way** — {5–8 one-line load-bearing decisions WITH their reasons (ADR-style: decision + why). Only decisions whose reason isn't obvious from the rule itself. Unknown whys become open items, then rulings.}

---

## 2 · File registry

| File | fileKey | Role | Audience |
|---|---|---|---|
| {name} | `{key}` | {component library / variable source / doc resource / consumer / code package / guidance site / brand source} | {public / internal / team-only} |

Non-Figma units belong in this table too — the token repo, the guidance site, the brand source — carrying `—` for `fileKey`. A system's source of truth is frequently not a Figma file (Primer's is a repo; GOV.UK has no Figma-variable pipeline at all), and a registry that can only name Figma files silently omits the half that outranks them. **Audience** is a separate axis from Role: a library can be a component library and still be internal-only, and skills must not assume a captured library is publishable. Skills find a file's row by `fileKey`, never by column position, so a column can be added without invalidating an existing document.

Dependency: {which files consume which}.

---

## 3 · Shared conventions (all libraries)

*The toolkit's standards (`figma-standard`, the house defaults in `standards/audit-settings.json` and the naming preferences in `standards/naming-preferences.json`) apply where this document is silent; anything recorded here overrides them.*

Only rules genuinely true across every library — durable content, not observations.

**Language & naming** — {dialect · anything this project does **differently** from figma-standard rule 8 (privacy prefix), figma-standard rule 20 (sibling and family separators) and figma-standard rule 11 (page markers); cite them by number otherwise, because §3's precedence makes a copy here an override of the rule it copies}

**Tokens** — {the grammar as a one-line **formula** first, Carbon-style — `[slot] / [slot] / …` with one real example per pattern — then as **named slot anatomy** — each slot's official name, meaning, and vocabulary (e.g. Category / Element / Role / Type / Emphasis / State). Slot STRUCTURE is derivable from token names; slot NAMES are maintainer vocabulary — capture them as `[TBD]` and ask, never invent labels. When asking, offer the published synonyms rather than a single word, because the same slot carries different names across systems and the maintainer may recognise one of them: Carbon publishes `[element]-[role]-[order]-[state]`, Primer publishes Prefix · Namespace · Property · Variant · Scale. Capture per slot whether it is **required, optional, or at-most-one** — Primer's Property is always required and only one Variant is permitted per token, and a formula that records order but not cardinality will validate token names that the project would reject. Note whether an anatomy page exists in the human docs layer (Atlassian/Primer/Carbon all publish one) · tier model and alias policy (which tiers exist, which are consumable, where theming happens — as rules, never as a transcribed alias graph) · vocabulary canon that binds components too · consumption rules (e.g. semantic-only) · interaction/state tokens · elevation · scales with their gaps}

**Variants** — {canonical axis order · State/Disabled placement · sparse-grid principle stated as a principle, not an enumeration}. Axis order is a **house convention, not industry practice** — no major public system publishes an axis-order canon, and the nearest published position (Primer's) is "mirror the parameters the code framework already uses". So ask for this one rather than treating the house default as the obvious answer, and where the project has a code implementation, its parameter order is stronger evidence than any convention.

**Descriptions** — {public structure with exact headings · bullet punctuation · recurring house lines · private compact form · any documentation contract that lives outside Figma}. Mature systems document components on a website rather than in the design tool — Carbon requires published usage, style, code and accessibility guidance per component — so a Figma description schema may be only half the project's real contract. Record the external half if there is one; a skill that satisfies the Figma description while ignoring a required docs page has done half the job.

**Canvas documentation furniture** — {page wrapper anatomy, header component and its text layers, sections, which frame each skill targets}

**Quality** — {accessibility floor · annotations stance}

The four lines below are **maintainer-only facts**: no Figma read can reach them. They stay `[TBD]` until someone answers, and a plausible-looking guess is worse here than a visible gap, because every one of them changes what a skill is allowed to conclude.

**Lifecycle & status** — {the statuses this project uses · what a component must satisfy to advance · **what each status exempts from audit**}. Every mature system has this and each draws the ladder differently: Primer runs Experimental → Alpha → Beta → Stable → Deprecated with published criteria per rung, Carbon gates "stable" behind tests plus published guidance, GOV.UK gates publication behind contribution criteria. The exemption half is the operative part for skills — an audit that holds an experimental component to stable rules generates a fix queue the maintainer will correctly ignore, and a skill that then learns to discount its own findings is worse than one that never ran.

**Versioning & deprecation** — {how the library versions · **how a deprecation is marked in Figma** (name prefix? a Status variant? description line?) · when deprecated things are actually removed}. Carbon keeps deprecated assets one whole major and removes them the next; Primer shows the consumer a warning and names the replacement. The Figma marking is the part skills need: without it, a deprecated component is indistinguishable from a live one and gets audited, documented and fixed as though it had a future.

**Platforms & parity** — {which platforms ship · which library serves each · **where they are permitted to diverge**}. Omit this line entirely for a single-platform project. Divergence is the load-bearing half: Carbon ships separate web and native mobile kits, Primer keeps Primer Mobile internal-only, GOV.UK is web-only by decision. "Same component, different platform" is a defect on some projects and the intended design on others, and nothing in the file says which.

**Governance** — {who may change the library · who may issue a §6 ruling · how a change reaches published}. GOV.UK routes contributions through a working group that re-forms twice a year; Primer takes Figma branches but a maintainer merges and publishes. This decides whether a skill's finding is something the person in the session can act on at all, or a proposal that has to go somewhere else first.

---

## 4 · Per-library rules

### {Library name} — `{fileKey}`
{Only durable, per-file rules: state model and size vocabulary · scope rules (what is not a subject) · legitimate local collections · slot-published families · queued fixes with their blast radius. NO counts and NO coverage lists — those are read live, never recorded. The one exception is audit output too expensive to recompute, such as a full deep walk's variant grids: keep it here beside the fix queue it explains, headed with its date and the words "re-run to refresh", and say plainly whether that queue has been executed.}

### {Source / foundations file} — `{fileKey}`
{Collections with modes and publish visibility (and the mechanism when hidden) · primitive ramp grammar (steps, anchors, alphas) · text-style groups and grammar (groups drive doc-generator units) · effect-style taxonomy · documentation state (contract match ⇒ refills; doc furniture provenance).}

**Authored vs generated pages — record this for any file that holds documentation.** A file mixing hand-built pages with generated ones needs the split written down, page by page: which are **generated** (a doc run refills them) and which are **authored** (**a doc run must never overwrite them**).

*Why it is a slot rather than a note:* the doc-generator's "refills, no new page anatomy" rule protects the *shape* of a page, not its *content* — so nothing stops a refill regenerating over a page a human wrote, and the output looks like ordinary success. This is toolkit-standard §D 19's failure shape: a refill silently reverting what nobody wrote into the instructions the next run reads. The risk is real wherever a second skill also writes documentation — `figma-tokens-examples` builds mapping tables onto exactly such a page — and the two skills cannot warn each other, because a skill never reads another skill's files. This document is the only place the coordination can live.

---

## 5 · Skill configuration

The three blocks below are **machine-read on every run** and no skill can work
around a missing one: the router will not deliver a snapshot, the docs site
will not build, and the audit stops rather than scan without rules. They were
absent from this template while all four captured projects carried them —
each invented independently, which is why their order and their surrounding
prose all differ. Fill them first.

**Project facts** — the display name every output uses, and the phase that
switches outputs on and off (`design`: handoff spec and tracker; `build`: adds
parity; `maintenance`: drops the tracker). Optional: `port`, where the
figma-audit service serves the docs site and audit (9223–9232, one per
project), `editorPort`, where the contract editor serves the library and the
docs site links to it (9250 when absent; one per project where two run at
once), and `publish` (`password` or `public`), who may read the published
site. Read through the snapshot contract (snapshot-standard rule 18); stated
nowhere else.

```json project
{"name": "{Display name}", "phase": "design", "port": 9232}
```

**Snapshot routing** — which Figma files this project owns, and therefore
which snapshots the router accepts for it (snapshot-standard rules 3 and
17). `repo` where the project has one; without it the snapshot is stored in
this folder. Keys are enough to start: each file stamps its own id on its
first snapshot, the router refuses that first payload and prints the id, and
the id goes here beside its key. A second component library that is another
platform's carries `"platform"`.

```json snapshot-routing
{
  "files": {
    "library": [{ "key": "{file key}" }],
    "screens": { "key": "{file key}" }
  }
}
```

**Audit settings** — the machine-readable half of this document, keyed by file
key: the collection and axis names this project uses, and what its code is
built as. It is the only copy — the audit record holds results, never
settings. House defaults (`audit-defaults` in `standards/audit-settings.json`
block) fill anything left out, and a key here overrides them. Leave out what
this project does not state: an axis with no recorded order is not checked,
and a library with no `codeTarget` gets no "in code" claims rather than
another platform's.

```json audit-settings
{
  "libraries": {
    "{file key}": {
      "name": "{library name}",
      "tokens": { "semantic": "{collection name}" },
      "pages": { "componentPages": "{regex, only where the pages to audit are not the marked ones}" },
      "codeTarget": "web",
      "_notes": ["{what is deliberately left out, and why}"]
    }
  }
}
```

**Naming preferences** — only where this project names things differently
from the house (`standards/naming-preferences.json`): separators, the private
prefix, property case, the boolean prefix, the words a text or swap property
avoids. One block for the project, not per library, and never a `naming`
section in the audit settings; leave it out to take the house's. A name that
departs from a preference is filed as one, not as a defect.

```json naming-preferences
{ "booleanPrefix": "{only what differs from the house}" }
```

- **variable-audit** — source file · collection keys (with any hidden-by-design noted as defect-if-bound) · consumer files · exclusions
- **doc-generator** — source / target / doc component library · unit rule per text-style group · colour value format `[TBD until first run]` · **the authored-page list below**
- **properties-table** — target frame · column profile `[TBD until first run]`
- {other skills as relevant}

**Cross-skill policies.** The toolkit's working rules — finding classification, `[check-token]` on unverified tokens and documentation runs as refills (toolkit-standard §D 14, 15 and 16), and the tracked metric (figma-standard rule 17) — apply as written and are **deliberately not restated here**. Record in this section only where this project *deviates* from one, naming the rule number, with a §6 ruling behind it.

*Why the blank:* §3's header makes anything recorded in this document outrank the toolkit's standards. A pre-filled copy of a toolkit rule therefore **silently overrides the rule it copies** — it freezes at the date the document was generated, stops receiving updates to the source, and is indistinguishable from a decision someone actually made. Earlier revisions of this template shipped those four rules pre-filled and had exactly that effect. One rule, one home; cite the handle, never the text.

- {project-specific policies that are not deviations from a toolkit rule}

**Overrides** — one line per override, in exactly this form, because the command in toolkit-standard §C clause C reads it to compute each rule's cross-project coverage:

```
- **Overrides:** figma-standard rule 1 — this project orders Role before Size.
```

Silence means agreement: the toolkit's standards apply wherever this document is silent, so a rule not listed here counts as holding on this project. List an override here **and** as a dated §6 ruling — this line is what a script reads, the ruling is where the reasoning lives.

---

## 6 · Rulings log (append-only; newest last)

| Date | Scope | Ruling | Why | Decided by |
|---|---|---|---|---|
| {date} | {library/project} | {decision, one line} | {reason, one line — the why is mandatory} | {who — a person or a body} |

**Decided by** matters once more than one person can rule. A ruling made by someone without the authority to make it is a preference wearing a ruling's clothes, and the next maintainer has no way to tell the two apart. On a single-maintainer project, fill it once and stop thinking about it.

---

## 7 · Open items

{Only genuinely open questions — each with where/when it resolves. **Delete an item when it closes; never keep a struck-through tick-list.** Nothing is lost: the outcome and its reasoning live in §6, the rule it produced lives in §3–§5, and any work it generated lives in §8's queue. A list of ticks buries the few items that still need attention.}

## 8 · Working notes

{Bridge/tooling quirks · suggested first runs · model/effort prefs · project comms constraints · out-of-scope files.}
