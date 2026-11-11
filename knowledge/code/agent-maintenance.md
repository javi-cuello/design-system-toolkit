# Agents that maintain the design system

Which upkeep of the system itself (dependency bumps, fixes, deprecations, docs) a coding agent takes, how it is told the procedure, and where a person stays in the loop. It serves the design-standard principle *honest*: an agent's change is reviewed as one, and its decisions are not passed off as the team's. An agent building product screens *from* the system is [agent-prototyping](agent-prototyping.md)'s; gates in general are [testing](testing.md)'s.

**Implements:** no ui pattern; it is how the system's own repository is kept.

## Work that ends in a check

**What good looks like**
- [weak] An agent takes a maintenance task when the task ends in something a person or a script can check: a failing test made to pass, a lint result, a changeset a reviewer reads.
- [weak] Decisions about intent stay with people: what a public API should mean, what to retire, what the system is for.

**How**
- [weak] Each repeated procedure is a skill in the repository, so the agent follows the team's steps, not its own guess. Primer React keeps 17 in `.agents/skills`; its `deprecations` skill lists the steps to retire a component: a JSDoc `@deprecated` tag on the export, `"status": "deprecated"` in the docs metadata, a changeset, and a pointer to the replacement ([skill](https://github.com/primer/react/blob/main/.agents/skills/deprecations/SKILL.md)).
- [weak] That `@deprecated` tag is what a product agent reads when it meets the old component, so maintenance written as a procedure produces the signals that agents using the system depend on.
- [weak] A person confirms the direction before the agent edits when the fix changes what the API does. Ant Design's maintainer describes this checkpoint: the agent narrows the search, but what the API should do cannot be decided from the implementation alone ([Gao, Ant Design blog, 11 Aug 2026](https://ant.design/docs/blog/ai-open-source-contribution)).

**Cases**
- Primer React: 336 pull requests opened by the Copilot coding agent, 164 merged; 98 of the repository's 740 merged in 2026, about 13 percent (counted 9 Nov 2026, [merged list](https://github.com/primer/react/pulls?q=is%3Apr+author%3Aapp%2Fcopilot-swe-agent+is%3Amerged)). The titles run from version bumps to a new size variant.
- Ant Design: an Alert whose close button did not show when only a close callback was set. The agent traced it, made a one-line fix and turned a test into a regression case; it was merged (Gao, as above). The maintainer opened the pull request, so author counts like Primer's miss this kind of work.
- Docs written by an agent for every export of Reshaped, in Storybook's experiment, came out inaccurate: speed did not make them correct ([experiment](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1)). Docs an agent writes are reviewed like code.

**Accessibility**
- [weak] An agent's fix runs the same accessibility tests as a person's; a regression case it adds is read for what it asserts, not only for passing.

**Check**
- *Script:* the repository's CI on the agent's pull request, and its skills folder exists for each repeated procedure.
- *Judgement:* Did a person confirm the API's intended behaviour before a change to it? Is "agent-maintained" being offered as evidence that the system is agent-ready (it is not)?

**Sources:** Primer's skills and pull-request list, Ant Design's post and Storybook's experiment are the teams' own records. No published comparison of defect rates, review time or docs accuracy between agent and human changes was found (searched 9 Nov 2026), so the advice is judgment from these accounts. The research behind it is the maintainer's unpublished series *The agent-ready design system*, part 1, section 7, kept outside the toolkit.
