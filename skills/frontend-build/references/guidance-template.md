# <Topic> — <project>

**Builds on:** `knowledge/<area>/<page>.md` (the house guidance this page adds to or overrides), or `none` where the knowledge base has no page for the topic.

How this project designs <topic>: a pattern, a component, the shell, or the layout. One topic per page, saved as `guidance/<topic>.md` beside the context document. The breakpoints are named once, in `guidance/layout.md`; a component's page says only how it changes at them. It holds only what this project does differently or adds; what the knowledge page already says is not copied here. A person owns it: an agent proposes it when two or more §6 decisions share the topic, gathering them, and writes after the person's yes. Each line ends with the §6 date of the decision it states: a page holds no decision of its own, so a new one is logged in §6 first, and a decision struck there is struck here in the same edit. Where this page and §6 disagree, §6 wins. A project with no page for a topic follows its live §6 decisions, then the knowledge page.

## What we do here

- <what differs or is added, one line each> [§6 <date>]

## Behaviour

Optional; for a pattern, a component or the layout. Only what differs from the knowledge page and the component's own description; leave out a line with nothing to add.

- **Resize and overflow:** <how it grows, shrinks, wraps or truncates> [§6 <date>]
- **At each breakpoint:** <what changes, by the breakpoint names in `layout.md`> [§6 <date>]
- **Touch and pointer:** <what differs between them> [§6 <date>]
- **Keyboard:** <what differs from the house pattern> [§6 <date>]
- **States over time:** <loading, empty, error, success, as this project draws them> [§6 <date>]

## Examples

Optional. A story shows behaviour that runs; a Figma node shows it drawn, in any file: a component guidance file where the project keeps one, otherwise the library or a screen.

| Shows | Figma node | Story |
|---|---|---|
| <what the example shows> | <fileKey:nodeId> | <story id> |
