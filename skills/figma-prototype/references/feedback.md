# Feedback on a prototype, step by step

Each step of [SKILL.md](../SKILL.md)'s *Feedback on a prototype* in full. Step numbers match SKILL.md. The evidence is `knowledge/code/agent-prototyping.md`, *Feedback on a prototype*.

## Step 1 — find it

Keep the threads pinned inside a frame that carries a receipt. To tell, walk up from the thread's node until `getSharedPluginData("fca", "receipt")` is set.

- A thread pinned elsewhere is not on a prototype. Leave it alone.
- A thread whose layer no longer exists is reported to the user.

**A thread pinned to a whole frame** names its layer only by where the pin sits. Its layer is the deepest visible layer whose bounds hold the frame's origin plus the thread's `offset`. For example, a "remove button" pinned to a frame meant the header's icon button under the pin.

## Step 2 — route it to one level

Route each thread to the lowest level that holds it.

| Level | When | What to do |
|---|---|---|
| **This frame** | The comment is about this screen | Fix the frame. Fix the same thing on every other composed frame that shows it, since a flow's screens share their chrome. |
| **This project** | The default for a decision about how the product works or looks | Record it, if the commenter may rule (below), and fix the frame. |
| **Every project** | The same correction has come up in a second project | Only with the user's yes: a knowledge-base section or a step here, with a case, by toolkit-standard §C. |

**Who may rule.** The context document names who may rule, in §3 *Governance*. On a one-maintainer project, that is the maintainer.

- Their decision is recorded as `figma-context-capture`'s *Recording a decision* says. The comment's link ends its why, and the commenter is who decided.
- Anyone else's comment is fixed on the frame only. Its decision goes to the context document's §7 as an open item.

**A fix to what the reference brought.** A frame fix that removes or changes what the reference screen brought is also a decision. Asked by someone who may rule, it is a §6 decision with Scope `Screen`; anyone else's goes to §7. Without that record, every later copy of the reference brings the old thing back.

**Never a memory note.** What is not in a ruling, a page or a step is lost on purpose.

## Step 3 — close it

The API cannot resolve a comment, so a reply closes the thread. Post it, and log it, in one call:

```sh
node skills/figma-prototype/scripts/figma-feedback.mjs <fileKey> --reply <id> <message> \
  --log <project>/tests/evals/feedback.jsonl --area <area> --routed <level> --note "<what went wrong>"
```

- Give the project's absolute path, since the script runs from the toolkit.
- It posts as [compose.md](compose.md), *Step 5*, says. A bridge's own comment tool may hold an older key, so use the script.
- The reply is plain text: `Routed:` and where the thread went. That is the frame fixed, the ruling's date, the §7 open item, the page or step proposed, or "reported to the user".

The person resolves the thread. A person replying after the run's reply, while the thread is unresolved, opens it again.

**The log** takes one line per thread:

| Field | Holds |
|---|---|
| `--area` | One of design-standard's five: `ux`, `interaction`, `visual`, `content`, `accessibility`. It is for routing. |
| `--routed` | The level the thread went to |
| `--note` | What went wrong, in your own words |

## Step 4 — learn from the pile, not the latest comment

When a log line makes the count a multiple of ten, the script says so. Then:

1. Run `node skills/figma-prototype/scripts/figma-feedback.mjs kinds <project>/tests/evals/feedback.jsonl`.
2. Read every note.
3. Group the notes into kinds, in your own words. The kinds come from the notes, never from the five areas.
4. Report the kinds to the user, with the one change that would have prevented the largest: a knowledge section, a step or a decision.

Ten is a first reading, not a statistic.

**Offers to retire.** Offer to retire a decision a later comment contradicts. Offer a guidance page where two live decisions share a topic. Both follow `figma-context-capture`'s *Retiring a decision, and guidance pages*. Write either only after the user's yes.
