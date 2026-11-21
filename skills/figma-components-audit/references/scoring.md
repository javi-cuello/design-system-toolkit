# Scoring — on request only

The 0–100 score per component, produced only when the maintainer asks. The tracked metric bans a composite score unless asked ([fix-queue.md](fix-queue.md), *Report rules*); this file is the sanctioned path for when they do.

The score never replaces the fix queue. It is a second lens over the **same verified findings**, after judgement and with exceptions suppressed, never a separate scan. A score from raw scanner candidates would count the false positives the judgement layer exists to remove.

## The model

Six weighted dimensions give each component a score from 0 to 100. The weights follow FigmaLint's measured category weights, the same source as the skill's priority order ([architecture.md](architecture.md), *Grounding*).

Two deviations are deliberate. Descriptions rise from 3 to 10, because the description is the prompt an AI reads before generating anything. Accessibility gets its own dimension, because FigmaLint checks it without weighting it separately.

| Dimension | Weight | Fed by |
|---|---|---|
| Tokens | 25 | Binding walk (§3, §3.4, §3.5c) |
| Properties / API | 20 | Schema, naming, unused props (§1, §2, §3.10c/e) |
| States | 20 | Coverage and rendering (§3.5a/d, §3.7a) |
| Structure & hygiene | 15 | Groups, layer names, hidden layers, text properties and resilience (§3.8, §3.10f); right to left where the project mirrors (§3.12) |
| Metadata | 10 | Descriptions on the set and its properties (§3.6) |
| Accessibility | 10 | Structural checks only (§3.7) |

The section numbers are [scanner-checks.md](scanner-checks.md)'s. `scanner/scoring.json` holds the dimensions, weights and rule mapping.

Each dimension starts at its full weight and loses a fraction of it per verified finding: **error −25%, warning −10%, review −5%**, floored at zero.

## Rules that keep it honest

- **N/A reweights, never zeroes** (Curtis's Pass/Fail/N-A). A dimension that does not apply, such as States on a non-interactive component, is removed. Its weight is spread pro rata across the rest, since scoring it either way distorts the comparison.
- **Unscanned is not 100**. A dimension not scanned is excluded the same way, the score is marked **partial**, and the gap is named. This is the silence rule ([conventions-universal.md](conventions-universal.md) §11) applied to arithmetic. A partial score never appears without its exclusion list.
- **One gate: a publication-blocking defect caps the component at 25/100**, whatever the other dimensions earn. An unused property means consumers never receive the component (scanner-checks §3.10c). Averaging that against good token coverage would show a healthy number for a component that does not exist downstream. The cap is stated with its reason on the row.
- **The bare number never ships alone**. A composite hides which part moved, so every score shows its six sub-scores. A re-run reports the delta per dimension, not just the total.

## The score report

Triggers: "score report", "score the library", "score my components". The report has one row per component set, worst first, each row deep-linked: `Score | T | P | S | St | M | A | gate/partial flags`. It closes with the library median and the standard metrics block.

**Computed, never added up by hand** (toolkit-standard §D 23). Once the verified findings are filed, run:

```sh
node tools/figma-audit/scores.mjs --data <record> --sets <scan.json>
```

It prints the table from the record through the model the dashboard applies (`tools/figma-audit/score-model.mjs` over `scanner/scoring.json`). Each dimension shows its delta against the record's last scores. `--json` prints the `scores/<fileKey>` document to write in the same pass.

Paste the table as it stands, and add the metrics block it names on stderr. A run with no record uses the scratch record the fix queue was rendered from.

Chat comes first, as for the fix queue; an optional `.md` mirror holds fuller detail per finding. The report complements the fix queue in the same conversation. Every deduction on a score row is an item already in the queue. A deduction with no queue item is a bug in the report.
