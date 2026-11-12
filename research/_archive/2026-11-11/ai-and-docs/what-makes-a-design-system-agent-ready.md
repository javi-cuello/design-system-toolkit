# What makes a design system agent-ready?

The agent-ready design system, part 1 of 9: what the word means, how agents fail against a system, which layers carry readiness, and how a team would know it got there.

Part 1 of 9 in *The agent-ready design system*. Next: [Part 2, What a design system's library should carry for an agent](what-the-library-carries-for-an-agent.md)

A design-system team is told its system should be "AI-ready", or "agentic", and is shown a list of files to add. This piece sets out what that claim means as a result a team can test, separates it from a second claim that shares the label, and maps the work onto the eight parts that follow.

---

## What this answers

- What do "agentic" and "AI-ready" mean, and are they the same claim?
- What does an agent do with a design system that a person does not?
- How does an agent go wrong against a system, and why does it get past review?
- What is "ready", stated as an outcome rather than a list of files?
- Which layers of a system carry readiness, and which later part covers each?
- Is this a new kind of design system, or the old discipline with the slack taken out?
- What do agents that maintain a system add, and how much is known about it?
- What is the smallest useful start?
- How would a team know it got there?

Section 10 is the cheat sheet and section 11 the short version. Section 5 lists the series and what each part covers.

---

## 1. What do "agentic" and "AI-ready" mean?

Two different claims travel under one label. One is that agents can use the system well when they build product screens. The other is that agents help run the system itself: writing its fixes, its tests, its docs and its migrations. This series calls the first **agent-ready** and is about it; the second is called **agent-maintained** here, and section 7 covers it.

The two get blurred because the same word is used for both. Brad Frost's post *Agentic design systems in 2026* (16 December 2025) is about the first. It describes a design system combined with AI where the AI is deliberately limited to the system's own materials, so that a non-technical colleague can describe a feature in a workshop and see it built from production components. Nothing in it is about agents changing the system.

Figma's *Design systems and AI: why MCP servers are the unlock* (Ana Boyer, 6 August 2025) covers both. Its first half is about Figma's MCP server feeding components, variables and annotations to a coding agent. Its second half lists agents doing maintenance: generating component code, suggesting where tokens should apply, flagging layer names that do not match code components, and writing a rules file from a codebase. Atlassian's *Building the context engine for the AI era* (28 May 2026) also does both: the design system is the context agents build from, and AI is put to work on migration tooling, testing and content updates.

Robin Di Capua's essay *A design system harness* (7 November 2026, commentary) draws a third line that the rest of this series keeps. A system that is well built is *machine-ready*, in his term: discoverable, machine-readable and internally consistent. Getting an agent to apply it, by choosing the right component and recognising when a rule applies, is the job of the harness around the agent. In his words, "readiness is not judgment."

The distinction matters because the two claims fail differently and are proved differently. When an agent-ready system fails, a product team ships a screen that is off the system. When an agent-maintained system fails, the library itself changes in a way nobody meant. A team that has an agent opening pull requests on its library has learnt nothing yet about whether product agents use that library correctly.

| | Agent-ready | Agent-maintained |
|---|---|---|
| Whom the agent works for | A product team building screens | The design-system team |
| What it touches | Product code that imports the system | The system's own repository and docs |
| What failure looks like | Invented components, invented props, raw values, rebuilds | A wrong fix, a test that proves nothing, a doc that drifts |
| State of the evidence | Vendor tests and a few studies (sections 3, 9) | Activity counts and maintainers' accounts (section 7) |

**What to do.** Before any discussion of tooling, ask which claim is meant. **Use "agent-ready" only for claims about agents building with the system, describe agents that work on the system as maintenance tooling, and judge each on its own evidence.** The split between consuming and maintaining is how the sources themselves divide the work; the two names are this series' choice.

---

## 2. What does an agent do with a design system that a person does not?

An agent picks a component by matching the words of its task against the words the system offers, and wherever the system says nothing, it fills the gap with what it has seen most often, which is public code. A person in the same position asks a colleague, copies a neighbouring screen, remembers last week's correction and looks at the result. An agent, left to itself, does none of those.

Take one task, which the rest of this piece keeps returning to. A job board's product team asks an agent to add a step before a saved search is deleted: ask the person to confirm, and say that deletion cannot be undone. The job board's library has a `Dialog`, a `Button` whose destructive style is set with `tone="critical"`, and a `Text` component for headings and body copy.

A new designer on the team would open the docs, find `Dialog`, and probably ask someone which button style a destructive action takes. The agent reads the task, sees the words "confirm" and "delete", and looks for something with a matching name. If its context holds a component called `Dialog` with a description that mentions confirmation, it finds it. If it does not, it reaches for the names that dominate public code: `Modal`, `ConfirmDialog`, `Heading`.

How strong that pull is has been counted. A public benchmark for design systems, the open-design-system-bench, mined 898 graded generations across six model configurations for the names models invented when a system had no such name. The most frequent invented components were `Heading` and `Typography` (29 times each), `Box` (26), `Card` (25) and `TextField` (21). Those are the vocabularies of Material UI, Chakra and shadcn/ui, the libraries most represented in public code. Part 2 covers what this means for naming.

Three more habits separate an agent from a person, and each shapes what a system has to provide.

- **It does not remember.** A correction given in one session is gone in the next unless it is written somewhere the agent reads. Figma's resource page on LLM context design makes this point: a model that guessed an off-brand blue will guess it again tomorrow.
- **It works within a budget.** Everything an agent reads takes space in a finite context, and Anthropic's engineering guidance on context describes accuracy falling as that context fills ("context rot"). It cannot read a whole docs site before every task, so it needs a way to fetch the one page it needs.
- **It reports more than it did.** A study of five generative UI tools (Imteyaz and colleagues, July 2026, in a benchmark of 24 tasks and 120 interfaces) found that over 25 percent of the design reasons the tools gave for their output were not implemented in the interface they produced, rising to 34 percent for functional requirements. An agent saying it used the system is not evidence that it did.

Storybook's documentation for its MCP server shows how ordinary the guessing is. The instructions it suggests teams paste into their agent file tell the agent, in capitals, never to hallucinate component properties, and to look a property up before using it. A vendor writes that rule because the behaviour is common.

**What to do.** Design every page of the system for a reader that matches text, forgets between sessions, has a budget and over-reports. **Every gap a system leaves is filled from public code, so the useful question about any missing page is what an agent would guess in its place.** That agents fill gaps from training is consensus across the vendor docs cited here; the four habits as a list are this guide's framing.

---

## 3. How does an agent fail against a system?

In four ways: it invents a component, invents a prop, hard-codes a value, or rebuilds a component it should have imported. Each of the four produces a screen that renders and looks close to right, which is why each gets past a quick review. Only a reviewer who knows the system catches them by eye.

Here is the confirm-before-delete step written the way an agent with no system context tends to write it. The code is illustrative, written against the job board's library as described in section 2.

```jsx
// What the agent wrote
import { Button } from "@jobboard/ui";
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
import { Dialog, Button, Text } from "@jobboard/ui";

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

Each failure in the first version has its own mechanism and its own cost.

**An invented component.** The agent needed a modal, did not find one under a name it expected, and imported Material UI's, which happened to be installed. The screen works. The cost arrives later: when the system's `Dialog` changes its padding, its motion or its close behaviour, this screen does not change with it.

**An invented prop.** `kind="danger"` is plausible and wrong; the job board's `Button` takes `tone`. In plain JavaScript, React passes the unknown prop through, the button renders in its default style, and nothing complains. In a TypeScript codebase the type checker rejects it, which is one reason typed props are part of readiness: they turn this failure into an error message.

**A hard-coded value.** `#1F2937` and `20` were copied from a screenshot or guessed. They match the light theme today. In dark mode the heading is dark grey on a dark surface, and a rebrand that edits the colour token never reaches it.

**A rebuild.** The `<div role="dialog">` inside the modal is a panel the agent built itself. It looks like the system's dialog, but its heading is not wired to it as its accessible name, so a screen reader announces a dialog with no title. It also carries none of the decisions the system's `Dialog` holds, such as which button takes focus first in a destructive confirmation. Keyboard and screen-reader users pay for that, not the reviewer.

Every source that has measured agents against a system describes the same four. Figma's test of its Code Connect feature (August 2026) says agents without a mapping to real components invent components, pick the wrong ones or spend extra calls searching; in one example the agent hand-built tabs and buttons with custom CSS and the result did not work. Storybook's Reshaped experiment reports the same: agents without its MCP server generated their own components ([Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once)). The open-design-system-bench writes the four into its grading rules: an invented component fails a run outright, two or more imports from a foreign UI library fail it, and an invented prop or more than three token violations send it to review.

| Failure | What a reviewer sees | What catches it mechanically | Who pays later |
|---|---|---|---|
| Invented component | A working modal | An import rule: only the system's packages for UI | The next design change, which misses this screen |
| Invented prop | A button in the wrong style, or no visible difference | A type check against the component's props | The person who clicks Delete without the warning colour |
| Hard-coded value | Correct colours in light mode | A lint rule that rejects raw colours and sizes | Dark mode, every theme, the next rebrand |
| Rebuild | A dialog that looks right | A lint rule that bans raw elements where the system has a component | Keyboard and screen-reader users |

**What to do.** Use the four names in reviews and in checks. **Count the four in every change an agent writes, because each is invisible at a glance and each has a mechanical check that is cheaper than a reviewer's attention.** That these four are the common failures is consensus among the sources that measured; the checks that catch them, and how to make them run every time, are Parts 5 and 6.

---

## 4. What is "ready", stated as an outcome?

A design system is agent-ready to the degree that an agent given an ordinary product task, one that never names a component, builds it from the system's real components, with their real props, styled with the system's tokens, importing rather than rebuilding, at a cost in tokens and time the team accepts. A server, an `llms.txt` file or an `AGENTS.md` file is a means to that, never the thing itself.

This is the definition the whole series keeps; Parts 2, 4 and 9 build on it. Each clause is there for a reason.

**"Never names a component."** A task that says "use the Dialog" tests whether the agent obeys, not whether the system can be found. The job board's real tasks arrive as "ask before deleting", so the test has to as well.

**Real components, props, tokens, imports.** These are the four failures of section 3, turned round. The outcome is the absence of all four, not an improvement on one.

**At a cost the team accepts.** In Atlassian's test a portable `DESIGN.md` file got agents to more of the guidance than no context and still cost more tokens, because it loads in full on every turn, so a definition that counted only correct output would call that file an improvement ([Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once)).

Two boundaries keep the definition honest.

The first is that readiness belongs to the system, the agent and its harness together. Anthropic's engineering post on evals says that evaluating "an agent" means evaluating the model and its harness as one. The job board's system can be ready for one coding agent with its MCP server connected and not ready for a hosted prototyping tool that cannot reach that server. A readiness claim names the setup it was measured in.

The second is that readiness is not quality. Brad Frost's `ds-ai-rails` skill keeps four questions apart: what the system knows, what the organisation wants agents to do, what is enforced, and whether the result works for its users. It notes that correct imports prove neither good design nor working behaviour. A confirm dialog built perfectly from the system can still be the wrong design for a deletion that should have been undoable.

The definition has a serious rival. Google's `DESIGN.md` format, open-sourced by Google Labs in April 2026 from its Stitch tool, aims at a different outcome: that every screen an agent generates shares one visual identity. Its philosophy document says the quality of a generated design depends more on how clearly intent is described than on precise values, and treats tokens as context rather than instructions. That is the right outcome for a new product with no component library, where there is nothing to import. For a product with a library, the series' definition holds, and Atlassian's finding that a full visual description led agents to rebuild components rather than import them is the reason.

The gap between files and outcome shows up in survey data too: far more teams run an MCP server than rate their documentation very AI-ready (Part 9, [which static measures earn a place](measuring-agent-readiness.md#which-static-measures-earn-a-place)).

| A claim that counts files | What it does not say |
|---|---|
| "We have an MCP server" | Whether what it serves describes `tone`, or only lists it |
| "We publish an `llms.txt`" | Whether an agent finds `Dialog` when asked to confirm a deletion |
| "We have an `AGENTS.md`" | Whether anything stops the agent when it writes `#1F2937` |
| "Every component is documented" | Whether the documentation is the text an agent's search matches against |

**What to do.** Write the outcome sentence down for the team's own product, with a real task and a cost ceiling. **A list of files is a plan; readiness is what an agent does with them on a task that names no component.** The outcome framing is shared by the vendors who measured (Atlassian, Figma, Storybook); the choice of the brownfield outcome over `DESIGN.md`'s green-field one is this series' judgment, and it depends on the team having a coded library to import.

---

## 5. Which layers carry readiness?

Five layers carry it, each the subject of a later part: content, record, delivery, checks and measurement. Screens and prototypes are where they meet a real task. A weakness in a lower layer cannot be fixed in a higher one: a server can only serve what the content says.

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

**Content** is what the library itself says. `Dialog` has to exist, be described in words that match "confirm", and be mapped from its Figma component to its code. `Button` needs `tone` typed as a closed set and described ("`critical` for actions that destroy data"). The heading colour has to be a semantic token, bound in Figma and used in code. Figma's own guidance for its MCP server puts these first: components for anything repeated, then Code Connect, then variables. [Part 2, What a design system's library should carry for an agent](what-the-library-carries-for-an-agent.md) covers them.

**Record** is where those facts live once. If the docs site says `tone` takes `critical` and the lint rule's list says `danger`, the agent gets two answers. Part 3, [One record, many outputs](design-system-docs-as-one-record.md), argues for one committed extraction that every output reads.

**Delivery** is how the record reaches the agent: a short rules file that is always loaded, reference that is fetched when needed (an MCP server, a CLI, skills), and a portable snapshot such as `DESIGN.md` for tools that can reach nothing else. [Part 4, How a design system reaches the agent](how-the-system-reaches-the-agent.md) compares them.

**Checks** catch the four failures whether or not the agent read anything, and gates make the checks run. Part 5, [What keeps an agent on track](what-keeps-an-agent-on-track.md), names the parts of the harness and what each does. Part 6, [Why agent rules need the harness](agent-workflow-enforcement.md), argues that a rule written in a context file is advisory until a hook or a CI step refuses.

**The work** is where all of this meets a task. A screen needs conventions above the component: where the confirm dialog's actions sit, what a destructive flow looks like across the product. Part 7, [Building screens with an agent](building-screens-with-an-agent.md), covers that layer, and Part 8, [Prototyping from real components](prototyping-from-real-components.md), covers the case where the task is a prototype rather than production code.

**Measurement** says whether the rest worked. [Part 9, Measuring and showing agent readiness](measuring-agent-readiness.md) separates static counts from agent runs.

The order is the point of the stack. Atlassian found that squeezing its guidance into one portable file removed most of its components' usage guidance: the delivery choice deleted content ([Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once)). In the other direction, a server that faithfully serves an undescribed `tone` prop delivers a list of four words, and the agent still guesses which one means destructive.

**What to do.** When an agent fails, trace the failure down the stack. **Fix the lowest layer that could have prevented the failure, because a fix higher up has to be repeated on every run.** An invented `kind` prop is a content gap (no typed, described `tone`) before it is a delivery gap, and a check for it is the safety net, not the cure. The layer model is this series' framing; that delivery cannot carry what content lacks is shown by Atlassian's test.

---

## 6. Is it a new kind of system, or the old discipline made non-optional?

Mostly the old discipline, made non-optional. The content an agent needs (components for everything repeated, typed props, semantic tokens, a mapping from design to code, written intent) is what design-system teams were already told to produce for people. Three things are new: delivering it to a reader with a budget, keeping names near public conventions, and measuring by running agents.

The overlap is plain in the vendors' own lists. Figma's recommendations for its MCP server (components, Code Connect, variables, clear names) are the handoff advice the company gave before agents. Di Capua's essay makes the same observation from practice: designers have spent years learning to name colours by meaning rather than value, and that is the habit agents need. Shopify's account of Polaris before agents (components in 70 percent of the admin, tokens in 44 percent of admin components) is a readiness problem described in pre-agent terms; Part 2 tells that story.

What changed is who absorbs the gaps. When the job board's docs never said which button tone a destructive action takes, a designer asked in a channel, got an answer, and the gap cost one conversation. An agent does not ask. It writes `kind="danger"`, and it writes it again in every session, for every team, at the speed agents work. The same gap that cost a conversation now costs a defect per run. That is why a team can no longer leave a property undescribed on the grounds that people know what it means.

Three things have no pre-agent equivalent.

**Delivery with a budget.** A person can browse a docs site; an agent pays in tokens for everything it reads. How the system is cut into pieces and served on demand is a new design problem, and Part 4 covers it.

**Distance from public conventions.** Before agents, a library's names had to be consistent with themselves. Now they also pay a price for being far from the names models expect: a library that calls its switch `Toggle` loses every time an agent works without the API in context and writes `Switch`. The bench's lexicon in section 2 is the first attempt to measure that distance.

**Measurement by behaviour.** A docs page is either there or not; an agent's output differs between runs. Knowing whether a change helped means running the agent several times and reading rates, which design-system teams have not had to do before. Part 9 covers it.

One finding cuts against "more of the old discipline is always better." Atlassian found that a fuller visual description of each component made agents rebuild components instead of importing them, because a complete description of how something looks is also a recipe for drawing it. Documentation written for agents has to point at the component, not describe it into being.

The convergence across systems also needs reading with care. Atlassian, Primer, Carbon, Spectrum, Ant Design and TDesign all now ship some mix of an MCP server, skills and an `llms.txt` file. They are not six independent discoveries that these work. They are six teams adopting the same three formats, all published by others within about two years: `llms.txt` proposed by Jeremy Howard in September 2024, MCP announced by Anthropic in November 2024, and the agent-skills folder format after it. The convergence shows what tooling exists, not what it achieves.

**What to do.** Treat agent-readiness as the reason to finish work the system already owed, then add the three new parts. **A team that buys the new parts first ends up with a fast delivery surface carrying the same gaps.** That the content work is mostly old is consensus among the practitioners and vendors cited; the three named additions are this guide's judgment.

---

## 7. What does "agentic" add: agents that maintain the system?

Agents already do maintenance work on public design systems, mostly well-bounded changes that end in a test or a review, with people keeping the decisions. Whether that makes the systems better is not measured anywhere found for this piece: the evidence is activity counts and maintainers' own accounts.

Primer, GitHub's design system, is the clearest public record. Its React repository has 336 pull requests opened by GitHub's Copilot coding agent, 164 of them merged; in 2026 so far, 98 of the repository's 740 merged pull requests came from it, about 13 percent (counted 9 November 2026). The titles run from chores ("Upgrade `@primer/live-region-element` to 0.8.1") to features ("Implementing small size variant for ActionList.Item"). The repository also keeps 17 agent skills, one of which, `deprecations`, tells an agent exactly how to retire a component: a JSDoc `@deprecated` tag on the export, `"status": "deprecated"` in its docs metadata, a changeset, and a pointer to the replacement.

That skill connects the two kinds of agent. The `@deprecated` tag the maintaining agent writes is the flag a product agent reads when it meets the old component. Maintenance done to a written procedure produces the signals consumption depends on.

Ant Design, maintained largely from China by Ant Group and its community, shows a different pattern. A maintainer's post (Yanbing Gao, 11 August 2026) describes working with Codex and six skills kept in the repository's `.agents/skills` folder, among them `test-review`, `commit-msg` and `create-pr`. For one bug, an Alert whose close button did not appear when only a close callback was set, the agent traced the cause, made a one-line fix and changed a test into a regression case; the pull request was merged. The maintainer is explicit about where the person stays in the loop: the agent can narrow the search, but what the public API should do cannot be decided from the implementation alone, so a person confirms the direction before any edit. Because the maintainer opens those pull requests, Copilot-style author counts would miss this work entirely.

Elsewhere the evidence is lighter. Atlassian names migration tooling, testing and content updates as work it hands to AI. Frost's public skills are mostly audit, plan and migrate tools: `ds-inspection`, `ds-adoption-plan`, `ds-token-architecture`, and `vibe-killer`, which rebuilds a page from the system's real components. In zeroheight's survey, documentation writing is the AI use practitioners are most satisfied with (63 percent).

There is a counter-example on that last point: in Storybook's Reshaped experiment, docs Claude wrote for every export came out inaccurate, and speed did not make them correct ([Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once)).

The pattern across these accounts is that agents take maintenance work where a check closes the loop (a failing test, a lint rule, a changeset a reviewer reads), and people keep the calls about intent: what an API should mean, what to retire, what the system is for.

**What to do.** Treat maintaining agents as tooling for the system team, worth adopting where the work ends in something a person can check. **Give agents the maintenance tasks that end in a test, a lint result or a changeset, keep API intent and retirement decisions with people, and never cite agent-maintained as evidence of agent-ready.** The evidence is thin: no published comparison of defect rates, review time or documentation accuracy between agent and human changes was found. The advice is judgment from the accounts above.

---

## 8. What is the smallest start?

One real task, one agent setup, three runs. Write a task the way the product team would, with no component named; run it; read the imports; count the four failures; fix the lowest layer behind the most frequent one; run it again.

The sources agree on starting small, from different directions. Figma's page on LLM context design suggests documenting one widely used component, then checking one AI-generated variant against it. Frost's `ds-ai-rails` skill starts from one system, one consuming project or sandbox and one AI environment, with a small task that has a meaningful interaction and one requirement the system does not cover. Anthropic's evals guidance says 20 to 50 tasks drawn from real failures are a good start for a test suite, which is where this ends up, not where it begins.

For the job board, the first afternoon looks like this.

1. Write the task in product language: "Before a saved search is deleted, ask the person to confirm. Say that it cannot be undone. Offer an undo for ten seconds after deleting." The undo is the deliberate gap: the library has no toast component, and what the agent does at a gap is worth seeing.
2. Run it three times in the setup the product team actually uses. One run says little about a tool whose output changes between runs.
3. Read each result's imports first. Anything imported from outside `@jobboard/ui` for UI is a candidate invented component.
4. Search the result for raw colours and sizes (`#`, `px`, `rem` in style attributes) and for raw elements the library covers (`<button`, `<dialog`, `role="dialog"`).
5. Check every prop on every system component against its definition.
6. Tally the four failures per run, and note what happened at the gap: did the agent build a toast, import one, or say the system had none?

The tally points at a layer. If two runs out of three wrote `Modal`, the `Dialog` description does not match the words "confirm" or "delete": a content fix. If all three wrote `kind`, the `tone` prop is undescribed or out of the agent's reach: content first, then delivery. If the hex value appears, add a lint rule that rejects raw colours, so it never needs a reviewer again. Then run the same three again and compare.

**What to do.** Start with a task, not a file. **Spend the first afternoon running an agent and reading its imports, and spend the first fix on whatever caused the most frequent failure.** Adding an `llms.txt` or a server before that afternoon means choosing a fix before knowing the fault. Starting small is consensus among the sources; this particular procedure is this guide's.

---

## 9. How would a team know it got there?

When repeated runs of tasks that name no component come back without the four failures, at a cost the team accepts, in the setup product teams really use. Static counts (components described, tokens bound, files published) are leading indicators of that, not the answer.

The test is behavioural because the thing being tested is behaviour. Anthropic's evals guidance calls each attempt a trial and grades the outcome, what the agent produced, rather than the steps it took. Because agents vary, the result is a rate. Its guidance also separates two rates that sound alike. pass@k is the chance that at least one of k attempts succeeds; pass^k is the chance that all k do. An agent that gets the confirm dialog right 75 percent of the time has a pass^3 of about 42 percent (0.75 cubed). For a product team that wants every build on the system, the second number is the one that matters.

A run is only meaningful against a baseline: the same tasks with the system's context switched off. The difference is what the system contributes. Figma's Code Connect test is the vendor version of this: across 27 design-to-code cases, adding the mapping raised the median quality score from 2 to 3 on a four-point scale judged by a model, cut median tokens by 29.5 percent and task time by 19.6 percent, on two React systems. Those are Figma's numbers for its own feature, and the post itself notes that coverage of the mapping drove most of the effect.

Static measures still earn a place, as inputs. A count of components whose props are described, or of colours bound to tokens, can only be moved by fixing the system, and it says where to look. What it cannot say is whether agents now succeed: the bench that computes both kinds of score has not shown that they move together. Part 9 covers how to show both without fooling anyone.

Two habits from Frost's `ds-ai-rails` skill keep a readiness claim honest. Each piece of evidence is labelled verified, reported or unknown, so "the agent said it used the Dialog" is never mistaken for a reading of the imports. Each control is labelled advisory, detecting or blocking, so a rule in a context file is not counted as enforcement. The same skill warns against a single readiness percentage, because one number hides the gap that matters.

A team that has got there can show the following.

- A fixed set of tasks in product language, none naming a component, kept in the repository.
- A recent run of each, repeated, with and without the system's context, dated and tied to the system's version.
- The four failures counted per run, with zero as the target and the remaining cases named.
- Token use and time per task, against the ceiling the team set in section 4.
- A check in CI that would catch each of the four if the next run regressed.
- A separate, human judgment of whether the result was the right design, since none of the above measures that.

**What to do.** Keep the word "ready" for a behavioural result. **Report readiness as a dated rate from repeated runs on tasks that name no component, with static measures beside it as inputs and never averaged in.** That only agent runs measure readiness is consensus among the vendors and the bench cited here; the list of what to show is this guide's.

---

## 10. Cheat sheet

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

## 11. The short version

Two claims share the label. Agent-ready means agents can build product screens with the system; agent-maintained means agents help run the system itself. This series is about the first, and evidence for the second says nothing about it.

An agent picks components by matching words and fills every silence with public code. It does not remember corrections, works within a token budget, and reports more than it did. Against a design system it fails in four ways: an invented component, an invented prop, a hard-coded value, a rebuild. Each looks right on screen, so each needs a check rather than a reviewer's eye.

A system is agent-ready to the degree that an agent, given an ordinary task that names no component, builds it from the real components, real props and tokens, importing rather than rebuilding, at a cost the team accepts, in the setup product teams actually use. Readiness is not quality: a correct build of the wrong design is still the wrong design.

Readiness is carried by layers: content, record, delivery, checks, measurement, with screens and prototypes where they meet a task. Fix the lowest layer that could have prevented a failure. Most of the content work is the old design-system discipline, now non-optional because an agent cannot ask; the new parts are delivery with a budget, names near public convention, and measurement by running agents.

Agents maintaining systems is real at Primer and Ant Design and unmeasured in its effect; give them work that ends in a check and keep decisions with people. Start with one task, three runs and a reading of the imports. Call the system ready when repeated runs on tasks that name no component come back clean, and say when that was measured.

---

## 12. What to re-check later

Researched November 2026, against the primary sources listed below, each opened that month.

- **When this was researched.** 9 November 2026. Every vendor page, repository and paper cited was opened that day or re-opened from an earlier guide in the series.
- **Primer's agent pull-request counts** (336 opened, 164 merged, 98 of 740 merged in 2026) come from GitHub's search for `author:app/copilot-swe-agent` on 9 November 2026. They count only pull requests the Copilot coding agent opened; work done with other agents under a person's account, as at Ant Design, is invisible to that search, so the true share is higher by an unknown amount.
- **Lulla and colleagues' `AGENTS.md` study** now reads, in its second arXiv version, that runs with the file kept "comparable task completion behavior"; the earlier guides in the series describe correctness as left for future work. Re-read the paper before leaning on either reading. Gloaguen and colleagues are at version 3 (29 September 2026).
- **Vendor numbers.** Figma's Code Connect figures (August 2026) are medians from 27 cases on two React systems, graded by a model. Atlassian's portable-context test (June 2026) labels its percentage column "design system context available", which is access to guidance, not correctness of output, and publishes no run counts. Atlassian's context-engine figures (52 percent accuracy improvement and others) come without a method.
- **zeroheight's survey** states no method on its public page; the full report is behind a sign-up and was not read.
- **Di Capua's essay** renders in the browser from a script bundle; its text was read from that bundle, not from a rendered page. It is commentary from a practitioner at one company.
- **Frost's post** is short and is about using a system with AI; the `ds-ai-rails` skill (repository last updated 8 November 2026) carries the substance cited here, and skills change often.
- **Material Design.** No official Material MCP server, skill or `llms.txt` was found (`m3.material.io/llms.txt` returned 404). Google's agent-facing work on design runs through Stitch and `DESIGN.md` (0.4.0, 27 July 2026, no theming). Re-check both.
- **GOV.UK.** No official agent surface and no stated position on agents using the design system was found. An issue asking for an agent skill (June 2026) had no reply; a community skill, not affiliated with GDS, was announced in a discussion in September 2026; a discovery cycle on prototyping (opened August 2026) includes how AI is changing it. `llms.txt` returns 404. Re-check when that discovery reports.
- **Non-Western systems.** Ant Design ships an official MCP server through its CLI (8 tools, 2 prompts, from `@ant-design/cli` 6.3.5; 6.7.0 current), an `llms.txt` in English and Chinese, and a `DESIGN.md`. TDesign publishes an `llms.txt` in Chinese and a `tdesign-mcp-server` package (0.2.4) whose repository is under Tencent's TDesign organisation. The Singapore Government Design System ships agent skills, Code Connect and a Figma Make kit, and no server of its own.
- **User outcomes.** No study was found that compares, for end users, interfaces built by agents with and without a design system. The nearest is the *Design Theater* benchmark (July 2026), which measures whether generative UI tools implement what they claim, not what users experience. An ACM paper on WCAG violations in AI design tools was found but returned 403 and is not cited.
- **The evidence base** for the four failures and the outcome definition is vendor tests, one public benchmark and a handful of practitioners, almost all in the United States, Europe and Australia. Ant Design's maintenance account is the main exception.

---

## Sources

**Primary: design-system teams and their repositories**

- [Atlassian, *Building the context engine for the AI era*](https://www.atlassian.com/blog/ai-at-work/atlassian-design-system-building-the-context-engine-for-the-ai-era) (28 May 2026).
- [Atlassian, *What we learned testing portable design context in practice*](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice) (15 June 2026).
- [Primer, MCP server](https://primer.style/product/getting-started/foundations/mcp).
- [Primer React, agent skills folder](https://github.com/primer/react/tree/main/.agents/skills) and the [`deprecations` skill](https://github.com/primer/react/blob/main/.agents/skills/deprecations/SKILL.md).
- [Primer React, merged pull requests opened by the Copilot coding agent](https://github.com/primer/react/pulls?q=is%3Apr+author%3Aapp%2Fcopilot-swe-agent+is%3Amerged).
- [Carbon MCP overview](https://carbondesignsystem.com/getting-started/carbon-mcp/overview).
- [React Spectrum, working with AI](https://react-spectrum.adobe.com/ai.md).
- [Polaris, using the Shopify dev MCP server](https://shopify.dev/docs/api/polaris/using-mcp.md).
- [Ant Design, MCP server](https://ant.design/docs/react/mcp), its [`llms.txt`](https://ant.design/llms.txt) and its [`DESIGN.md`](https://ant.design/design.md).
- [Yanbing Gao, *How to use AI and skills to reduce maintenance costs*](https://ant.design/docs/blog/ai-open-source-contribution) (Ant Design blog, 11 August 2026).
- [Ant Design, repository skills](https://github.com/ant-design/ant-design/tree/master/.agents/skills).
- [TDesign, `llms.txt`](https://tdesign.tencent.com/llms.txt) and [`tdesign-mcp-server` in the npm registry](https://registry.npmjs.org/tdesign-mcp-server).
- [Singapore Government Design System, Figma and code workflows](https://designsystem.tech.gov.sg/ai/figma-and-code-workflows).
- [GOV.UK Design System, issue 5392, *GDS Design System AI Skill*](https://github.com/alphagov/govuk-design-system/issues/5392).
- [GOV.UK Design System, issue 5591, *Prototyping Discovery*](https://github.com/alphagov/govuk-design-system/issues/5591).
- [GOV.UK Design System, discussion 5726, a community agent skill](https://github.com/alphagov/govuk-design-system/discussions/5726).

**Primary: tool vendors and formats**

- [Figma, *Design systems and AI: why MCP servers are the unlock*](https://www.figma.com/blog/design-systems-ai-mcp/) (6 August 2025).
- [Figma, *Better code, fewer tokens: the benefits of Code Connect in MCP*](https://www.figma.com/blog/the-benefits-of-code-connect-in-mcp/) (5 August 2026).
- [Figma, *Structure your Figma file*](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file).
- [Figma Resource Library, *LLM context design*](https://www.figma.com/resource-library/llm-context-design/).
- [Storybook, MCP overview](https://storybook.js.org/docs/ai/mcp/overview) (10.6, preview).
- [Storybook, Reshaped experiment RFC](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1) (9 September 2025).
- [Google, *Stitch app's DESIGN.md format is now open-source for designers*](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/) (21 April 2026).
- [google-labs-code/design.md, `PHILOSOPHY.md`](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md) and [releases](https://github.com/google-labs-code/design.md/releases).
- [agents.md](https://agents.md/).
- [llmstxt.org](https://llmstxt.org/) (proposal of 3 September 2024, version 2).
- [Anthropic, *Introducing the Model Context Protocol*](https://www.anthropic.com/news/model-context-protocol) (25 November 2024).
- [Anthropic, *Effective context engineering for AI agents*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (29 September 2025).
- [Anthropic, *Demystifying evals for AI agents*](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (9 January 2026).

**Primary: studies, benchmarks and surveys**

- [Gloaguen, Mündler, Müller, Raychev and Vechev, *Evaluating AGENTS.md*, arXiv:2602.11988](https://arxiv.org/abs/2602.11988) (version 3).
- [Lulla and colleagues, *On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents*, arXiv:2601.20404](https://arxiv.org/abs/2601.20404) (version 2).
- [Imteyaz and colleagues, *Design Theater*, arXiv:2607.22928](https://arxiv.org/abs/2607.22928) (24 July 2026).
- [open-design-system-bench, `convention-lexicon.json`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/convention-lexicon.json) and [`rubric.config.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/rubric.config.ts) (release 1.4).
- [zeroheight, *State of AI in design systems*](https://zeroheight.com/resources/state-of-ai-in-design-systems/) (2026).

**Commentary, labelled as such in the text**

- [Brad Frost, *Agentic design systems in 2026*](https://bradfrost.com/blog/post/agentic-design-systems-in-2026/) (16 December 2025).
- [Brad Frost, `ds-ai-rails` skill](https://github.com/bradfrost/skills/blob/main/skills/design-systems/ds-ai-rails/SKILL.md) and its [policy reference](https://github.com/bradfrost/skills/blob/main/skills/design-systems/ds-ai-rails/references/policy.md), in [bradfrost/skills](https://github.com/bradfrost/skills).
- [Robin Di Capua, *A design system harness*](https://brandstructure.design/articles/a-design-system-harness) (7 November 2026).

**The rest of the series**

- Part 2: [What a design system's library should carry for an agent](what-the-library-carries-for-an-agent.md).
- Part 3: [One record, many outputs](design-system-docs-as-one-record.md).
- Part 4: [How a design system reaches the agent](how-the-system-reaches-the-agent.md).
- Part 5: [What keeps an agent on track](what-keeps-an-agent-on-track.md).
- Part 6: [Why agent rules need the harness](agent-workflow-enforcement.md).
- Part 7: [Building screens with an agent](building-screens-with-an-agent.md).
- Part 8: [Prototyping from real components](prototyping-from-real-components.md).
- Part 9: [Measuring and showing agent readiness](measuring-agent-readiness.md).

**Cited but not resolved**

- *Generated Inaccessible: Measuring WCAG Violations in AI UI Design Tools* (ACM, 2026): the DOI page returned 403, so nothing from it is asserted.
