# The record and the dashboard

Where a run's results go, the shape of the project's audit record, how rows are filed, re-audits, sweeps, and the dashboard that renders the record. [SKILL.md](../SKILL.md) steps 2b, 2c and 6 point here.

## Contents

- [Delivery](#delivery)
- [The record's shape](#the-records-shape)
- [Filing rows](#filing-rows)
- [Re-audit](#re-audit)
- [Sweep](#sweep)
- [The dashboard](#the-dashboard)
- [Consistency rows](#consistency-rows)

## Delivery

Step 2c has three answers, and the chat report is in every one.

| Answer | What the run gives |
|---|---|
| **Here** | The chat report, plus the `.md` mirror where the surface is a terminal. |
| **As a page too** | The chat report, plus Audit lite's results page in place of the `.md` mirror: one page for both audits. With no record, file the run's rows to a scratch record first, as for the chat report. |
| **On the dashboard too** | Offered only where the project has a record. The chat report, plus the rows the maintainer works through on the dashboard. |

Print the results page with the command below, and publish it as an artifact exactly as printed.

```sh
node tools/figma-audit/fix-queue.mjs --data <record> --page [--not-scanned <text>]
```

Where there is a record, rows are filed to it whichever answer is given (step 6).

## The record's shape

**The record is a file in the project, never a published document**. It is `<project>/audit/<fileKey>.json`, kept under version control beside the context document. There is one per library, because a library is a Figma file and two files have two runs.

```
libraries/<fileKey>   name, figmaUrl, lastRunAt, metrics{}, deferred{}
                      (`displayTitle` and `connector` appear in some records
                       and are read by no code; neither is required)
rows/<finding id>     bucket, sev, rule, where, node, visible, fix[], rec[]  — the definition
                      check                                                — the SCANNER's own wording,
                                                                             what a re-scan matches on
                      origin, n                                            — who filed it, its render number
                      done, note, updatedAt                                — the maintainer's
                      verified, verifiedAt, verifyNote                     — only a run that read the file
                      ruledAt                                              — closed by a rulebook entry
                      appliedAt, appliedCode                               — what a fix ran
                      failedAt, failedWhy                                  — why a fix did not land
runs/<id>             fileKey, at, kind, scope, found, cleared, open, note, coverage, sets, variants, variables
scores/<fileKey>      at, rows[], median, model
fingerprints/<fileKey> at, sets{}, diff{}, readFile
```

Every row also carries `owner`, the skill that raised it. **A skill closes only rows it owns**, so a components scan that does not raise a file-level finding leaves it alone.

**The record holds results only**. Settings and rulings live in the context document, read on every run. They are the `audit-settings` block in §5, keyed by file key, and the rulings table in §6. A copy of either kept in the record drifts from the document.

**A row's identity is the finding, never its bucket number**. That is its `key` or, for a row written before keys, the component and the check's own wording. Numbers change on every render, so a key that renumbers reattaches the last run's ruling to whatever now sits in that position. A run reconciles by key and writes the definition back whole; a partial write drops the maintainer's ticks.

**Read the record before scanning, and write it after**. It holds the fingerprints that say what moved, and the notes that answer questions this run would otherwise ask again.

## Filing rows

**Rows are filed through one writer, never by hand**. Use `POST /rows` on the project's dashboard service. When no service runs, use `node tools/figma-audit/rows.mjs --data <record>` with the same payload, whose shape is at the top of `rows.mjs`. The dashboard's *Audit* goes through the same call.

The writer mints the key and matches a row already there by owner, component and wording. It reopens a closed row the scan raises again. From a full scan, it closes this skill's rows the scan no longer raises.

**A scan that no longer raises a finding closes its row**. Without that, an audit can only ever add, and the queue reports findings that no longer exist. A full scan read the file, so it may stamp. It matches on the row's `check`, the scanner's own wording, never on `fix`. The judge's rewrite does not match by design, and matching on it clears everything.

**With no API key for the dashboard's judge**, `bin/audit <project> <fileKey>` runs the scanners through the project's service and writes a payload. The session judges it, and a dropped finding moves to `dismissed` with its reason. Then `bin/audit --file <payload>` shows what filing would add and close, and adding `--write` files it.

**With no record** (a one-off conversation run), file the findings into a scratch record, never the project's. Running `node tools/figma-audit/rows.mjs --data <scratchpad>/audit/<fileKey>.json` with the payload on stdin creates it. Render the queue from it as from a record, then delete it. It is never offered as the project's record.

## Re-audit

The maintainer works the queue between runs, so a re-audit starts from what they left, not from a blank scan. Steps 1–5 of the workflow are unchanged; step 6 writes the record instead of composing a fresh queue.

1. **Read the record first**. It holds their ticks and notes, and their rulings are in the context document. A row they have ruled on is never raised again as though new.
2. **Re-scan, then reconcile by key, never by position**. An open row that still reproduces keeps its tick and note untouched. A row that no longer reproduces is **verified**, with a one-line reason. A finding with no stored row is new.
3. **A row ticked done that still reproduces gets `verified: false`**, with what is still wrong. "The maintainer believes this is done and it is not" is the most useful thing a re-audit produces.
4. **Only a pass that read the file stamps verification**. The dashboard can record that a fix was applied, and re-scan the one component it touched. Any wider claim is the run's to make, or the record starts asserting what nothing measured.
5. **Preserve the fields you do not own**. A row is one document and a write replaces it, so a stamp written without the maintainer's note erases it. Read, merge, write.
6. **Write every part of the record in the same pass**. That is `libraries/<fileKey>` with every measure recomputed, a new `runs/` entry, `fingerprints/<fileKey>` with its diff, and `scores/<fileKey>` where the project keeps scores. A partly written record is inconsistent, which is worse than one that is simply old.
7. **The delta goes in the record, not in chat**. Answer in one line: it ran, and the record has it. No table, and no account bucket by bucket.
8. **The first run of a new library is the exception**, and keeps the full chat report. It builds the record a later session reads, and there is nothing yet to read from.

## Sweep

A full re-audit is minutes of scanning and judgement, while "has anything moved since the last run?" takes under a second. Keeping the two apart makes checking cheap enough to do often.

A sweep hashes each component set over its axes, properties, layer tree and bindings, and diffs that against the stored fingerprints. It writes `fingerprints/<fileKey>` and answers in one line. It raises no findings, touches no row and writes nothing to Figma.

- **Offer it unprompted** when a session connects to a library that has a record. "Six sets have moved since the last run" decides whether an audit is worth running at all.
- **Triggers:** *sweep*, *what changed*, *anything moved*. Also run it at the start of a full audit, so the report can say what changed, not only what is wrong.
- **A sweep never stamps and never clears**. A moved fingerprint says a component was edited, not that it broke; deciding that is the audit's job.
- **The script is `scanner/sweep.js`**, so the dashboard and a session share one definition of a fingerprint.
- **Return the file's identity and refuse a mismatch**. A hosted call takes no file key and reads whatever file the plugin is paired to. Without the guard, a sweep against the wrong file silently writes "every set removed" over the baseline.

## The dashboard

The record is rendered and written by a local service in this repo, `tools/figma-audit/server.mjs`, with no dependencies and one instance per project. Its page is the **Audits** page of the project's docs site: queue, scores, history and About. The service builds it from `tools/docs-site` into `<project home>/site/` and keeps it current. There is no standalone page.

```sh
node tools/figma-audit/server.mjs --data ~/Projects/<project>/figma-design-system/audit --port 9231
```

Then open `http://localhost:9231/audits/`. Each project's instance runs on its own port inside 9223–9232. The plugin connects to every server in that range, so several can run at once.

**It is not a published artifact, for a structural reason**. An artifact is sandboxed and cannot reach `localhost`, so its only route to Figma is a hosted relay with a single-use pairing code. Figma ends a plugin's iframe runtime every one to three minutes, so the pairing breaks constantly, and no plugin patch fixes it. Served from `localhost`, the page has no sandbox: the Desktop Bridge plugin scans ports 9223–9232 on launch and dials in by itself.

**Start the service before Figma**. The plugin scans on launch, and its discovery loop runs only while it has no connection. A plugin already attached to another server never notices a new one. Running the service as a login agent makes this automatic.

**The dashboard gives the maintainer four moves**. A run should expect to find their results rather than repeat them.

| Move | What it does |
|---|---|
| **Check changes** | The fingerprint sweep. |
| **Audit** | After a Check changes that saw sets move, it asks: *Audit changes* over those sets, or *Audit all*. Otherwise it audits the whole library. It files findings as rows. Then it runs the foundations audit, the validator for the recorded code target and the link check, each filing its own rows. |
| **Do it** | Bucket 1: writes and applies the fix, then re-scans and stamps itself. |
| **Verify ticked** | Re-checks everything ticked. |

**A tick is the maintainer's claim; only a pass that read the file may stamp it**. That is why the two are separate, and why a run still has work to do.

**A ruling recorded from the dashboard is a row in the context document's rulings log, not a note**. A note sits on one row and the judgement pass never sees it, so every sibling finding returns on the next run. *Record as ruling* appends the note as a row in the §6 rulings table, where the judgement pass reads it.

Where the ruling is about a recorded scale (`optionOrder`) rather than an exception, change the scale in `audit-settings` instead. That is deterministic, needs no judgement round, and stops the candidate being raised at all.

**A run that changes rows says what it did, where the reader is**. Verifying, fixing and auditing all move rows out of the queue, so the only evidence of the work is a shorter list. The outcome goes to a **toast**: what was attempted, what held, what did not, and a way back to the queue. Warnings and errors do not time out, because they carry something to act on. A row vanishing without an account looks the same as a row lost by mistake.

## Consistency rows

Beside this skill's own rows, the queue carries rows under this owner with the target `consistency`. They check the library against itself across components, which a scan of one set at a time cannot see. One prop may be a True/False variant on some components and a boolean on others. One prop name may be spelled two ways, or one prop may be numeric on some components and named on others.

`tools/component-contract/analyze.mjs` computes them from the stored contracts, and the docs service files them whenever the snapshot moves. Each filing is a full run that names the checks it made. So a finding no longer raised closes, and this skill's own rows are never touched. A finding that is on purpose is ruled, and a ruled row is not reopened.
