# What makes a design system agent-ready?

What "agent-ready" means as a result a design-system team can test, how agents go wrong against a system, and where the work to fix that sits.

A design-system team is told its system should be "AI-ready", or "agentic", and is handed a list of files to add: an `llms.txt`, an `AGENTS.md`, an MCP server. A month later the files exist. A product engineer asks an agent for a confirmation dialog, and it imports a modal from a public library and colours the heading with a hex value copied from a screenshot. Nobody can say whether the system got more ready, because nobody said what ready meant.

---

## What this answers

- [Agentic versus AI-ready](#agentic-versus-ai-ready): are they the same claim
- [How agents differ](#how-agents-differ): what an agent does differently
- [Four ways agents fail](#four-ways-agents-fail): how an agent fails against a system
- [Agent-ready as an outcome](#agent-ready-as-an-outcome): what ready means, as an outcome
- [Layers of readiness](#layers-of-readiness): which layers carry readiness
- [Old discipline, three additions](#old-discipline-three-additions): is this a new kind of system
- [Maintaining agents](#maintaining-agents): what agents add by maintaining the system
- [The smallest useful start](#the-smallest-useful-start): where to begin
- [Signs of readiness](#signs-of-readiness): how a team knows it got there

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in five paragraphs. The eight parts that follow this one are mapped in [layers of readiness](#layers-of-readiness).

---

## Agentic versus AI-ready

No: one label carries two claims, that agents can build product screens with the system and that agents help run the system itself, and they are proved by different evidence.

In a review, one person means a product team's agent can build a settings screen from the library; another means an agent has been opening pull requests on it. Both say "agentic".

The first claim is about agents that consume the system; the rest of the series calls it **agent-ready**, and is about it. The second is about agents that maintain it, writing its fixes, tests, docs and migrations; it is called **agent-maintained**, and [maintaining agents](#maintaining-agents) covers it.

The sources blur the two. [Brad Frost's *Agentic design systems in 2026*](https://bradfrost.com/blog/post/agentic-design-systems-in-2026/) is about the first: AI limited to the system's own materials. [Figma's *Design systems and AI*](https://www.figma.com/blog/design-systems-ai-mcp/), by Ana Boyer, and [Atlassian's *Building the context engine for the AI era*](https://www.atlassian.com/blog/ai-at-work/atlassian-design-system-building-the-context-engine-for-the-ai-era) cover both: the system as context for coding agents, and AI put to work on the system's code, tests and content.

Robin Di Capua's essay [*A design system harness*](https://brandstructure.design/articles/a-design-system-harness) draws a third line, which the series keeps. A well-built system is *machine-ready*: discoverable, machine-readable and internally consistent. Getting an agent to apply it is the job of the harness around the agent. In his words, "readiness is not judgment."

| | Agent-ready | Agent-maintained |
|---|---|---|
| Whom the agent works for | A product team building screens | The design-system team |
| What it touches | Product code that imports the system | The system's own repository and docs |
| What failure looks like | Invented components, invented props, raw values, rebuilds | A wrong fix, a test that proves nothing, a doc that drifts |
| State of the evidence | Vendor tests and a few studies | Activity counts and maintainers' accounts |

Before any talk of tooling, ask which claim is meant. **Use "agent-ready" only for claims about agents building with the system, describe agents that work on the system as maintenance tooling, and judge each on its own evidence.**

---

## How agents differ

An agent picks a component by matching the words of its task against the words the system offers, and wherever the system says nothing, it fills the gap with what it has seen most often, which is public code.

Take one task, which the rest of this guide keeps coming back to. A marketplace's product team asks an agent to add a step before a saved search is deleted: ask the person to confirm, and say that deletion can't be undone. The marketplace's library has a `Dialog`, a `Button` whose destructive style is set with `tone="critical"`, and a `Text` component.

A new designer would open the docs, or ask someone which button style a destructive action takes. An agent sees "confirm" and "delete" and looks for a matching name. If its context holds a `Dialog` whose description mentions confirmation, it finds it. If not, it reaches for the names that dominate public code: `Modal`, `ConfirmDialog`, `Heading`. A public benchmark has counted that pull, name by name; [Part 2](what-the-library-carries-for-an-agent.md#the-weight-of-names) has the count and what it means for naming.

Three more habits separate an agent from a person:

- **It doesn't remember.** A correction given in one session is gone in the next unless it is written somewhere the agent reads. [Figma's page on LLM context design](https://www.figma.com/resource-library/llm-context-design/) puts it plainly: a model that guessed an off-brand blue will guess it again tomorrow.
- **It works within a budget.** Everything it reads takes space in a finite context, and [Anthropic's guidance on context](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) describes accuracy falling as that context fills. It needs a way to fetch the one page it needs.
- **It reports more than it did.** [*Design Theater*](https://arxiv.org/abs/2607.22928), a benchmark of 120 interfaces from five generative UI tools, found over 25 percent of the design reasons the tools gave were not implemented, rising to 34 percent for functional requirements. An agent saying it used the system is not evidence that it did.

Design every page of your system for a reader that matches text, forgets between sessions, has a budget and over-reports. **Every gap a system leaves is filled from public code, so the useful question about any missing page is what an agent would guess in its place.**

---

## Four ways agents fail

In four ways: it invents a component, invents a prop, hard-codes a value, or rebuilds a component it should have imported, and each produces a screen that renders and looks close to right.

That last part is why they get past review. Here is the confirm-before-delete step written the way an agent with no system context tends to write it. The code is illustrative. Before reading the second version, see how many of the four you can find in the first.

```jsx
// What the agent wrote
import { Button } from "@marketplace/ui";
import { Modal } from "@mui/material";                 // (1) a component the system does not have

export function DeleteSavedSearch({ open, onCancel, onDelete }) {
  return (
    <Modal open={open} onClose={onCancel}>
      {/* (4) a hand-built dialog panel */}
      <div role="dialog" className="confirm-box">
        {/* (3) raw values */}
        <h2 style={{ color: "#1F2937", fontSize: 20 }}>Delete this saved search?</h2>
        <p>Alerts for it will stop. This cannot be undone.</p>
        <Button onClick={onCancel}>Cancel</Button>
        {/* (2) a prop that does not exist */}
        <Button kind="danger" onClick={onDelete}>Delete</Button>
      </div>
    </Modal>
  );
}
```

```jsx
// The same step on the system
import { Dialog, Button, Text } from "@marketplace/ui";

export function DeleteSavedSearch({ open, onCancel, onDelete }) {
  return (
    <Dialog open={open} onClose={onCancel} title="Delete this saved search?">
      <Text>Alerts for it will stop. This cannot be undone.</Text>
      <Dialog.Actions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button tone="critical" onClick={onDelete}>Delete</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
```

**An invented component.** Not finding a modal under a name it expected, the agent imported Material UI's. When the system's `Dialog` changes, this screen doesn't follow.

**An invented prop.** `kind="danger"` is plausible and wrong; the `Button` takes `tone`. In plain JavaScript, React passes the unknown prop through and the button renders in its default style. In TypeScript the type checker rejects it, which is one reason typed props are part of readiness.

**A hard-coded value.** `#1F2937` matches the light theme today. In dark mode the heading is dark grey on a dark surface, and a rebrand that edits the colour token never reaches it.

**A rebuild.** The `<div role="dialog">` looks right, but its heading isn't its accessible name, so a screen reader announces a dialog with no title, and it carries none of the system's decisions, such as which button takes focus first.

Every source that measured agents against a system describes the same four: [Figma's Code Connect test](https://www.figma.com/blog/the-benefits-of-code-connect-in-mcp/), Storybook's Reshaped experiment ([Part 4](how-the-system-reaches-the-agent.md#reference-on-demand)), and the open-design-system-bench's grading rules.

| Failure | What a reviewer sees | What catches it mechanically | Who pays later |
|---|---|---|---|
| Invented component | A working modal | An import rule: only the system's packages for UI | The next design change, which misses this screen |
| Invented prop | A button in the wrong style | A type check against the component's props | The person who clicks Delete without the warning colour |
| Hard-coded value | Correct colours in light mode | A lint rule that rejects raw colours and sizes | Dark mode, every theme, the next rebrand |
| Rebuild | A dialog that looks right | A lint rule that bans raw elements the system covers | Keyboard and screen-reader users |

Use the four names in your reviews and in your checks. **Count the four in every change an agent writes, because each is invisible at a glance and each has a mechanical check that is cheaper than a reviewer's attention.** The checks, and how to make them run every time, are [Part 5](what-keeps-an-agent-on-track.md#guardrails-and-checks) and [Part 6](agent-workflow-enforcement.md).

---

## Agent-ready as an outcome

A system is agent-ready to the degree that an agent, given an ordinary product task that never names a component, builds it from the system's real components, with their real props and tokens, importing rather than rebuilding, at a cost in tokens and time the team accepts.

A server, an `llms.txt` or an `AGENTS.md` is a means to that, never the thing itself.

**"Never names a component."** A task that says "use the Dialog" tests obedience, not whether the system can be found; real tasks arrive as "ask before deleting".

**Real components, props, tokens, imports.** These are [the four failures](#four-ways-agents-fail), turned round: the absence of all four, not an improvement on one.

**At a cost the team accepts.** In Atlassian's test of portable design context, a `DESIGN.md` file got agents to more of the guidance than no context, and still cost more tokens than giving them nothing ([Part 4](how-the-system-reaches-the-agent.md#reference-on-demand) has the test). A definition that counted only correct output would call that file an improvement.

Two boundaries keep the definition honest. First, readiness belongs to the system, the agent and its harness together ([Anthropic's post on evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) evaluates the model and its harness as one): a system can be ready for a coding agent with its server connected and not for a hosted tool that can't reach it, so a claim names its setup.

Second, readiness is not quality. Brad Frost's [`ds-ai-rails` skill](https://github.com/bradfrost/skills/blob/main/skills/design-systems/ds-ai-rails/SKILL.md) keeps apart what the system knows, what the organisation wants agents to do, what is enforced, and whether the result works for its users; correct imports prove neither good design nor working behaviour.

The definition has a serious rival. Google's `DESIGN.md` format, open-sourced from its Stitch tool in April 2026, aims at every generated screen sharing one visual identity, and [its philosophy document](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md) treats tokens as context rather than instructions. That's the right outcome for a new product with nothing to import. For a product with a library, the outcome above holds, because a full visual description is also a recipe for rebuilding what should be imported ([Part 4](how-the-system-reaches-the-agent.md#reference-on-demand)).

| A claim that counts files | What it doesn't say |
|---|---|
| "We have an MCP server" | Whether what it serves describes `tone`, or only lists it |
| "We publish an `llms.txt`" | Whether an agent finds `Dialog` when asked to confirm a deletion |
| "We have an `AGENTS.md`" | Whether anything stops the agent when it writes `#1F2937` |
| "Every component is documented" | Whether the documentation is the text an agent's search matches against |

Write the outcome sentence down for your own product, with a real task and a cost ceiling. **A list of files is a plan; readiness is what an agent does with them on a task that names no component.** Choosing it over `DESIGN.md`'s outcome depends on your team having a coded library to import.

---

## Layers of readiness

Five layers carry it, each the subject of a later part: content, record, delivery, checks and measurement, with screens and prototypes where they meet a real task.

A weakness in a lower layer can't be fixed in a higher one: a server can only serve what the content says. The stack below shows the five, bottom up, with the work that draws on all of them.

<svg role="img" viewBox="0 0 760 430" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="Helvetica, Arial, sans-serif">
<title>The layers of an agent-ready design system, from the bottom up. Content, Part 2: components, typed props, tokens, names and the mapping to code. Record, Part 3: one extracted record every output reads. Delivery, Part 4: rules, reference on demand, a portable snapshot. Checks, Parts 5 and 6: lint, validators and gates that catch the four failures. Measurement, Part 9: repeated agent runs on tasks that name no component. To the right, the work, Parts 7 and 8: screens and prototypes, which draw on every layer.</title>
<rect x="0" y="0" width="760" height="430" fill="#ffffff"/>
<rect x="20" y="340" width="470" height="62" rx="8" fill="#e6ecfc" stroke="#1f4fd8"/>
<text x="38" y="366" font-size="15" font-weight="700" fill="#1f4fd8">Content (Part 2)</text>
<text x="38" y="388" font-size="12" fill="#15171c">Components, typed and described props, bound tokens, names, mapping to code</text>
<rect x="20" y="268" width="470" height="62" rx="8" fill="#eef6ee" stroke="#2e7d32"/>
<text x="38" y="294" font-size="15" font-weight="700" fill="#2e7d32">Record (Part 3)</text>
<text x="38" y="316" font-size="12" fill="#15171c">One extracted record that the docs, server and checks all read</text>
<rect x="20" y="196" width="470" height="62" rx="8" fill="#fff6e0" stroke="#a66b00"/>
<text x="38" y="222" font-size="15" font-weight="700" fill="#a66b00">Delivery (Part 4)</text>
<text x="38" y="244" font-size="12" fill="#15171c">Rules always loaded, reference on demand, a portable snapshot</text>
<rect x="20" y="124" width="470" height="62" rx="8" fill="#fdecea" stroke="#c62828"/>
<text x="38" y="150" font-size="15" font-weight="700" fill="#c62828">Checks (Parts 5 and 6)</text>
<text x="38" y="172" font-size="12" fill="#15171c">Lint, type checks, validators, and gates that make them run</text>
<rect x="20" y="52" width="470" height="62" rx="8" fill="#f1ecfa" stroke="#5e35b1"/>
<text x="38" y="78" font-size="15" font-weight="700" fill="#5e35b1">Measurement (Part 9)</text>
<text x="38" y="100" font-size="12" fill="#15171c">Repeated agent runs on tasks that name no component</text>
<text x="20" y="32" font-size="13" fill="#5b6270">Each layer can only pass on what the layers below it hold</text>
<line x1="505" y1="384" x2="505" y2="70" stroke="#5b6270" stroke-width="2"/>
<polygon points="499,78 505,64 511,78" fill="#5b6270"/>
<rect x="540" y="160" width="200" height="130" rx="8" fill="#15171c"/>
<text x="640" y="196" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle">The work</text>
<text x="640" y="218" font-size="12" fill="#ffffff" text-anchor="middle">(Parts 7 and 8)</text>
<text x="640" y="246" font-size="12" fill="#ffffff" text-anchor="middle">Screens and prototypes,</text>
<text x="640" y="264" font-size="12" fill="#ffffff" text-anchor="middle">built on every layer</text>
<line x1="505" y1="225" x2="540" y2="225" stroke="#5b6270" stroke-width="2"/>
</svg>

Follow the confirm-before-delete task up the stack, and each layer has one job in it.

- **Content** is what the library itself says: `Dialog` exists, is described in words that match "confirm" and is mapped from Figma to code; `tone` is typed and described; the heading colour is a bound semantic token. [Part 2](what-the-library-carries-for-an-agent.md) covers it.
- **Record** is where those facts live once, so the docs and the lint rule never give two answers. [Part 3](design-system-docs-as-one-record.md) argues for one committed extraction.
- **Delivery** is how the record reaches the agent: a short rules file always loaded, reference fetched on demand, a portable snapshot for tools that can reach nothing else. [Part 4](how-the-system-reaches-the-agent.md) compares them.
- **Checks** catch the four failures whether or not the agent read anything, and gates make them run. [Part 5](what-keeps-an-agent-on-track.md) names the parts of the harness; [Part 6](agent-workflow-enforcement.md) argues that a written rule is advisory until something refuses.
- **The work** is where all of this meets a task: conventions above the component in [Part 7](building-screens-with-an-agent.md), prototypes in [Part 8](prototyping-from-real-components.md).
- **Measurement** says whether the rest worked. [Part 9](measuring-agent-readiness.md) separates static counts from agent runs.

The order is the point. Atlassian found that squeezing its guidance into one portable file removed much of its components' usage guidance: the delivery choice deleted content ([Part 4](how-the-system-reaches-the-agent.md#reference-on-demand)). In the other direction, a server that faithfully serves an undescribed `tone` prop delivers a list of four words, and the agent still guesses which one means destructive.

When an agent fails, trace the failure down the stack. **Fix the lowest layer that could have prevented the failure, because a fix higher up has to be repeated on every run.** An invented `kind` prop is a content gap before it's a delivery gap, and a check for it is the safety net, not the cure. The layer model is a framing rather than a published standard.

---

## Old discipline, three additions

It is mostly not a new kind of system: the content an agent needs is the old design-system discipline made non-optional, and only three things are new, namely delivery to a reader with a budget, names kept near public conventions, and measurement by running agents.

That content (components for everything repeated, typed props, semantic tokens, a mapping from design to code, written intent) is what teams were already told to produce for people. Figma's recommendations for its MCP server are the handoff advice the company gave before agents, and Di Capua makes the same observation: designers spent years learning to name colours by meaning rather than value, and that's the habit agents need.

What changed is who absorbs the gaps. When the docs never said which tone a destructive action takes, a designer asked in a channel: one conversation. An agent doesn't ask. It writes `kind="danger"` in every session, for every team, and the gap costs a defect per run.

Three things have no pre-agent equivalent:

- **Delivery with a budget.** A person can browse a docs site; an agent pays in tokens for everything it reads. [Part 4](how-the-system-reaches-the-agent.md) covers it.
- **Distance from public conventions.** A library's names now also pay for being far from what models expect: one that calls its switch `Toggle` loses whenever an agent works without the API in context and writes `Switch`. [Part 2](what-the-library-carries-for-an-agent.md#the-weight-of-names) measures that distance.
- **Measurement by behaviour.** An agent's output differs between runs, so knowing whether a change helped means running the agent several times and reading rates. [Part 9](measuring-agent-readiness.md) covers it.

More of the old discipline isn't always better: a complete description of how a component looks is also a recipe for drawing it, and Atlassian's agents rebuilt components instead of importing them ([Part 4](how-the-system-reaches-the-agent.md#reference-on-demand)). Documentation for agents points at the component; it doesn't describe it into being.

Atlassian, Primer, Carbon, Spectrum, Ant Design and TDesign all ship some mix of an MCP server, skills and an `llms.txt`, but that is six teams adopting formats published by others within two years ([`llms.txt`](https://llmstxt.org/) in September 2024, [MCP](https://www.anthropic.com/news/model-context-protocol) that November). It shows what tooling exists, not what it achieves.

Treat agent-readiness as the reason to finish the work your system already owed, then add the three new parts. **A team that buys the new parts first ends up with a fast delivery surface carrying the same gaps.**

---

## Maintaining agents

Agents already do maintenance work on public design systems, mostly well-bounded changes that end in a test or a review, with people keeping the decisions, and whether that makes the systems better hasn't been measured anywhere.

The evidence is activity counts and maintainers' accounts. Primer, GitHub's design system, is the clearest public record: its React repository has 336 pull requests opened by GitHub's Copilot coding agent, 164 merged, and in 2026 so far 98 of 740 merged pull requests came from it, about 13 percent. They run from chores ("Upgrade `@primer/live-region-element` to 0.8.1") to features.

The repository also keeps [17 agent skills](https://github.com/primer/react/tree/main/.agents/skills). One, [`deprecations`](https://github.com/primer/react/blob/main/.agents/skills/deprecations/SKILL.md), says exactly how to retire a component: a JSDoc `@deprecated` tag, `"status": "deprecated"` in its docs metadata, a changeset, a pointer to the replacement. That connects the two kinds of agent: the tag the maintaining agent writes is the flag a product agent reads.

Ant Design shows a different pattern. [A maintainer's post](https://ant.design/docs/blog/ai-open-source-contribution), by Yanbing Gao, describes working with Codex and six skills in the repository. For one bug, an Alert whose close button didn't appear, the agent traced the cause, made a one-line fix and turned a test into a regression case. A person confirms what the public API should do before any edit, and because the maintainer opens those pull requests, author counts like Primer's miss this work entirely.

Elsewhere the evidence is lighter. Atlassian names migration tooling, testing and content updates as work it hands to AI, and Frost's [public skills](https://github.com/bradfrost/skills) are mostly audit, plan and migrate tools. In [zeroheight's survey](https://zeroheight.com/resources/state-of-ai-in-design-systems/), documentation writing is the AI use practitioners are most satisfied with (63 percent), though in Storybook's Reshaped experiment the docs Claude wrote came out inaccurate ([Part 4](how-the-system-reaches-the-agent.md#reference-on-demand)).

Treat maintaining agents as tooling for your system team. **Give agents the maintenance tasks that end in a test, a lint result or a changeset, keep API intent and retirement decisions with people, and never cite agent-maintained as evidence of agent-ready.** No published comparison of defect rates or review time between agent and human changes exists yet, so this is a judgement from the accounts above.

---

## The smallest useful start

One real task, one agent setup, three runs: write a task the way the product team would, with no component named, run it, read the imports, count the four failures, fix the lowest layer behind the most frequent one, and run it again.

The sources agree on starting small: Figma's page on LLM context design with one widely used component, Frost's `ds-ai-rails` with one system, one consuming project and one AI environment. Anthropic's evals guidance puts a suite at 20 to 50 tasks from real failures, which is where this ends up, not where it begins.

For the marketplace, the first afternoon looks like this. In your own product, swap in a task your team would really write.

1. Write the task in product language: "Before a saved search is deleted, ask the person to confirm. Say that it cannot be undone. Offer an undo for ten seconds after deleting." The undo is the deliberate gap: the library has no toast.
2. Run it three times in the setup the product team actually uses.
3. Read each result's imports first. Anything from outside `@marketplace/ui` for UI is a candidate invented component.
4. Search for raw colours and sizes (`#`, `px`, `rem` in style attributes) and raw elements the library covers (`<button`, `<dialog`, `role="dialog"`).
5. Check every prop on every system component against its definition.
6. Tally the four failures per run, and note what happened at the gap: did the agent build a toast, import one, or say the system had none?

The tally points at a layer. If two runs out of three wrote `Modal`, the `Dialog` description doesn't match "confirm" or "delete": a content fix. If all three wrote `kind`, the `tone` prop is undescribed or out of reach: content first, then delivery. If the hex value appears, add a lint rule that rejects raw colours. Then run the same three again and compare.

Start with a task, not a file. **Spend the first afternoon running an agent and reading its imports, and spend the first fix on whatever caused the most frequent failure.** Adding an `llms.txt` or a server before that afternoon means choosing a fix before knowing the fault.

---

## Signs of readiness

A team has got there when repeated runs of tasks that name no component come back without the four failures, at a cost the team accepts, in the setup product teams really use.

Static counts (components described, tokens bound, files published) are leading indicators of that, not the answer: the thing being tested is behaviour. Because agents vary, the result is a rate, and the rate that matters to a product team is the chance that every run comes back clean, not that one does; [Part 5](what-keeps-an-agent-on-track.md#evals-versus-tests) works through the difference. A run only means something against a baseline, the same tasks with the system's context switched off.

[Part 9](measuring-agent-readiness.md#showing-readiness) covers what to measure, how to show it without a vanity score, and the evidence a team can put in front of a review.

Keep the word "ready" for a behavioural result. **Report readiness as a dated rate from repeated runs on tasks that name no component, with static measures beside it as inputs and never averaged in.** That only agent runs measure readiness is consensus among the vendors and the bench cited here.

---

## Cheat sheet

| When someone says | It means | Ask for |
|---|---|---|
| "Our system is agentic" | Either agents use it, or agents maintain it | Which of the two, and the evidence for that one |
| "We are AI-ready, we have an MCP server" | A delivery surface exists | A dated run on tasks that name no component |
| "The agent used our components" | The agent reported it did | The imports, read from the code |
| "Agents just need better docs" | Content is the gap | Which property or description was missing in the failed run |
| "We need a DESIGN.md" | A portable identity file | Whether the product has a coded library to import from |
| "Agents maintain our library" | Agents open changes on the system | What check closes each change, and who decides intent |
| "We are 80 percent ready" | A single score | The ratios behind it, and the behavioural rate |

| The four failures | Caught by |
|---|---|
| Invented component (`Modal` from a public library) | An import rule allowing only the system's packages for UI |
| Invented prop (`kind="danger"`) | A type check against the component's props |
| Hard-coded value (`#1F2937`) | A lint rule rejecting raw colours and sizes |
| Rebuild (`<div role="dialog">`) | A lint rule banning raw elements the system covers |

---

## The short version

Two claims share the label. Agent-ready means agents can build product screens with your system; agent-maintained means agents help run the system itself. This guide is about the first, and evidence for the second says nothing about it.

An agent picks components by matching words and fills every silence with public code. It doesn't remember corrections, works within a token budget, and reports more than it did. Against a design system it fails in four ways: an invented component, an invented prop, a hard-coded value, a rebuild. Each looks right on screen, so each needs a check rather than a reviewer's eye.

Your system is agent-ready to the degree that an agent, given an ordinary task that names no component, builds it from the real components, props and tokens, importing rather than rebuilding, at a cost your team accepts, in the setup product teams actually use. Readiness is not quality: a correct build of the wrong design is still the wrong design.

Readiness is carried by layers: content, record, delivery, checks, measurement. Fix the lowest layer that could have prevented a failure. Most of the content work is the old discipline, now non-optional because an agent can't ask; the new parts are delivery with a budget, names near public convention, and measurement by running agents.

Agents maintaining systems is real, and unmeasured in its effect. Start with one task, three runs and a reading of the imports, and call the system ready when repeated runs come back clean, saying when that was measured.

---

## What to re-check later

Researched 9 November 2026 against the primary sources below; rewritten into the house voice on 11 November 2026 (earlier text in `_archive/2026-11-11/ai-and-docs/`). Shortened on 17 November 2026 to the series' 20-minute limit: the bench's invented names now live in Part 2, the Atlassian test in Part 4, pass^k in Part 5, and what a team can show in Part 9. A Shopify coverage example was removed the same day; its figures could not be traced to a primary Shopify source (see [Measuring design system adoption](../figma-and-code/measuring-design-system-adoption.md#counts-and-shares) on coverage as a share).

- **Primer's agent pull-request counts** come from GitHub's search for `author:app/copilot-swe-agent` on 9 November 2026, and miss agent work done under a person's account, so the true share is higher by an unknown amount.
- **Di Capua's essay** was read from its script bundle; it is commentary.
- **zeroheight's survey** states no method on its public page; Frost's skills change often.
- **Material Design and GOV.UK** had no official agent surface found (no MCP server, skill or `llms.txt`). Re-check GOV.UK when its prototyping discovery (opened August 2026) reports.
- **User and maintenance outcomes.** No study compares, for end users, interfaces built by agents with and without a design system, and none compares defect rates of agent and human changes to one.
- **The evidence base** is vendor tests, one public benchmark and a handful of practitioners, almost all in the United States, Europe and Australia; Ant Design's account is the main exception.

---

## Sources

**Primary: design-system teams and their repositories**

- [Atlassian, *Building the context engine for the AI era*](https://www.atlassian.com/blog/ai-at-work/atlassian-design-system-building-the-context-engine-for-the-ai-era) (28 May 2026).
- [Atlassian, *What we learned testing portable design context in practice*](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice) (15 June 2026).
- [Primer React, agent skills folder](https://github.com/primer/react/tree/main/.agents/skills) and the [`deprecations` skill](https://github.com/primer/react/blob/main/.agents/skills/deprecations/SKILL.md).
- [Primer React, merged pull requests opened by the Copilot coding agent](https://github.com/primer/react/pulls?q=is%3Apr+author%3Aapp%2Fcopilot-swe-agent+is%3Amerged).
- [Carbon MCP overview](https://carbondesignsystem.com/getting-started/carbon-mcp/overview); [React Spectrum, working with AI](https://react-spectrum.adobe.com/ai.md).
- [Ant Design, MCP server](https://ant.design/docs/react/mcp) and its [`llms.txt`](https://ant.design/llms.txt); [Yanbing Gao, *How to use AI and skills to reduce maintenance costs*](https://ant.design/docs/blog/ai-open-source-contribution) (11 August 2026).
- [TDesign, `llms.txt`](https://tdesign.tencent.com/llms.txt).
- [GOV.UK Design System, issue 5591, *Prototyping Discovery*](https://github.com/alphagov/govuk-design-system/issues/5591).

**Primary: tool vendors and formats**

- [Figma, *Design systems and AI: why MCP servers are the unlock*](https://www.figma.com/blog/design-systems-ai-mcp/) (6 August 2025).
- [Figma, *Better code, fewer tokens: the benefits of Code Connect in MCP*](https://www.figma.com/blog/the-benefits-of-code-connect-in-mcp/) (5 August 2026).
- [Figma Resource Library, *LLM context design*](https://www.figma.com/resource-library/llm-context-design/).
- [google-labs-code/design.md, `PHILOSOPHY.md`](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md).
- [llmstxt.org](https://llmstxt.org/) (proposal of 3 September 2024).
- [Anthropic, *Introducing the Model Context Protocol*](https://www.anthropic.com/news/model-context-protocol) (25 November 2024).
- [Anthropic, *Effective context engineering for AI agents*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (29 September 2025).
- [Anthropic, *Demystifying evals for AI agents*](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (9 January 2026).

**Primary: studies, benchmarks and surveys**

- [Imteyaz and colleagues, *Design Theater*, arXiv:2607.22928](https://arxiv.org/abs/2607.22928) (24 July 2026).
- [open-design-system-bench, `rubric.config.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/rubric.config.ts) (release 1.4).
- [zeroheight, *State of AI in design systems*](https://zeroheight.com/resources/state-of-ai-in-design-systems/) (2026).

**Commentary**

- [Brad Frost, *Agentic design systems in 2026*](https://bradfrost.com/blog/post/agentic-design-systems-in-2026/) (16 December 2025).
- [Brad Frost, `ds-ai-rails` skill](https://github.com/bradfrost/skills/blob/main/skills/design-systems/ds-ai-rails/SKILL.md), in [bradfrost/skills](https://github.com/bradfrost/skills).
- [Robin Di Capua, *A design system harness*](https://brandstructure.design/articles/a-design-system-harness) (7 November 2026).

---

Part 1 of 9 in *The agent-ready design system*. Next: [Part 2, What a design system's library should carry for an agent](what-the-library-carries-for-an-agent.md).
