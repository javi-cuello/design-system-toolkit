# Steppers: step indicators, task lists and progress

How a person keeps their bearings in a task that spans several screens or takes time to finish: whether to show steps at all, a step indicator for a short linear flow, a task list for a long or non-linear one, moving back and forward and leaving to come back, the check-answers page at the end, and progress for a long-running job. It serves the principles *show state and give feedback* (where am I, how much is left), *people in control, mistakes forgiven* (back without loss, leave and return) and *as little as possible, and no simpler* (an indicator earns its place by helping). No design-standard rule is admitted for steppers yet. When to split a task across screens is [ux: journeys and multi-step flows](../design/ux.md#journeys-and-multi-step-flows); the questions on each page, and saving a long form, are `forms.md`'s; spinners, skeletons and short waits are [feedback: loading](feedback.md#loading).

## Step indicators

**Use when / don't use**
- Use for a **linear** flow of **three to about six** steps that are the same for everyone: a setup, an import, a publish flow. Carbon's progress indicator is for linear processes of three or more steps ([Carbon progress indicator](https://carbondesignsystem.com/components/progress-indicator/usage/)); Atlassian's tracker needs at least three and sets six as the guideline, past which the task should be simplified or split ([Atlassian progress tracker](https://atlassian.design/components/progress-tracker/usage)).
- Don't use for fewer than three steps, for steps done in any order, or for steps that appear or vanish by earlier answers (Carbon): a total that changes is a promise broken. A task list does the non-linear case (next section).
- Don't add one by reflex. GOV.UK says to test the form without a progress indicator first, to fix the order, type or number of questions before adding one, and notes that indicators often go unnoticed and scale poorly on small screens ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)).

**How**
- **Labels** of one or two words naming the step by its purpose ("Your details", "Choose files"), so the label survives changes to the step's contents (Atlassian); Carbon suggests verb plus noun ("Define endpoints") and numbering the steps. Never vague labels ("Processing").
- **Three states drawn differently:** done, current, not yet; plus error where a step has a problem (Carbon). Done shows a mark as well as a colour.
- **Going back by the indicator.** Atlassian lets people select visited steps to return to them; Carbon's default indicator is display-only, with an interactive variant. The toolkit makes visited steps links and future steps plain text: going back is safe, jumping ahead past unanswered steps is not ([NN/g wizards](https://www.nngroup.com/articles/wizards/): enforce the order).
- **Orientation.** Vertical where there is room beside the form, since Carbon finds it easier to read; horizontal above the form otherwise. On small screens, collapse to "Step 2 of 5: Choose files", GOV.UK's simple form.
- **Total only if reliable.** GOV.UK: include the total only if you can do so reliably.
- The indicator never replaces the page heading; each step has its own `h1`.

**Cases**
- A two-step "Name it, then confirm" flow carries a stepper → remove it; a Continue button is enough (Atlassian: fewer than three steps, use a Next button).
- An import flow shows "Step 3 of 7", and a branch skips two steps, so the reader jumps from 3 to 6 → show the steps by name without a total, or make the steps fixed; Carbon says the count should not change with conditional logic.
- Nine steps in the indicator → split the task, per Atlassian's six; nine labels will not fit and nine screens is a long flow.
- Future steps are clickable and a reader lands on step 4 with steps 2 and 3 empty → make only visited steps links.

**Accessibility**
- 1.3.1 (the steps are an ordered list), 1.4.1 (done and current not by colour alone), 2.4.8 Location (the current step shown), 2.4.2 Page Titled (the step's name and number in the title), 1.4.10 Reflow (the collapsed form at 320px).
- Figma: figma-standard rule 31 (done, current, not yet, error and focus draw differently), figma-standard rule 32 (step text contrast in every mode).

**Build**
- *Elements:* an `ol` inside a `nav` labelled "Progress" (or a plain `ol` with a heading when it holds no links); each visited step an `a href` to its page; the current and future steps plain text. The step's state is in text too: a visually hidden "completed" after a done step's label.
- *ARIA and keyboard:* no WAI-ARIA APG pattern covers step indicators ([APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)); links and list semantics carry it, and Tab moves between the visited links. Don't build it as tabs.
- *States:* `aria-current="step"` on the current step; `data-state="done|current|todo|error"` for the stylesheet; error described by `aria-describedby` to its message.
- *Rules:* code-standard rule 64 (`aria-current` marks where the reader is; `step` is the value for a process), code-standard rule 20 (each step is its own page or a form post, and works without script), code-standard rule 1 (one `h1` per step), code-standard rule 2.
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history); [code: hidden content](../../code/accessibility.md#hidden-content) (the visually hidden state text).

**Check**
- *Script:* could check one `aria-current="step"` per indicator, that future steps are not links, that the step list is an `ol`, that the page title carries the step name, and that the indicator stays on one line or collapses at 320px.
- *Judgement:* Did the flow need an indicator at all, or would better questions have been enough (GOV.UK's test)?

**Sources:** Carbon, Atlassian, GOV.UK and NN/g as linked. GOV.UK is the most sceptical and advises against indicators that show all questions, allow navigation back and show the current one; Carbon and Atlassian both ship that shape. The toolkit uses the full indicator for short linear tool flows of three to six fixed steps, where people revisit steps, and GOV.UK's "Step 2 of 5" text for public forms and small screens.

## Task lists

**Use when / don't use**
- Use for a long task people cannot finish in one sitting, or whose parts they choose to do in their own order ([GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)): a component's release checklist, a project setup with several independent parts, an application.
- Don't use for a fixed-order flow (that is a step indicator or plain question pages), or to show answers back (a summary list does that; GOV.UK).

**How**
- **Tasks named with a verb where possible**, short and in sentence case ("Provide financial evidence"); many tasks grouped under headings by stage ([GOV.UK complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Statuses, as few as will do.** GOV.UK starts with Completed and Incomplete, adding Not yet started, In progress, Cannot start yet (a task that waits on another, not linked) and There is a problem only where research supports them. Completed is plain text so what needs action stands out; the others are tags.
- **The whole row is the link** to the task; a hint, if any, is one short sentence with no links inside (GOV.UK task list).
- **When a task counts as done.** Where people should decide, end the task with "Have you completed this section?" (yes, or I'll come back later); GOV.UK uses this for tasks with optional questions or long answers.
- **Submit** is reached only when every task is Completed; the page says how many are done ("3 of 5 sections completed").
- Order tasks so people can do them in any order where the service allows.

**Cases**
- A setup asks six things in a fixed order and has a task list → use question pages with Back and Continue; a task list implies a choice of order that does not exist.
- Every status is a coloured tag, Completed in green → make Completed plain text, as GOV.UK does, so the eye goes to the tasks left.
- A task that needs another finished first is a dead link → show "Cannot start yet" in grey, not linked.
- A reader returns after a week and cannot tell what is left → the counter at the top and the statuses answer it; check that both are computed from the stored answers, not the session.

**Accessibility**
- 1.3.1 (the list, its headings, and each status associated with its task), 2.4.4 Link Purpose (the row link names the task, and the status is in its description), 1.4.1 (statuses in words, never only colour), 2.4.6 Headings and Labels.
- Figma: figma-standard rule 31, figma-standard rule 32 (tag contrast).

**Build**
- *Elements:* a heading per group, a `ul` of tasks, each `li` holding an `a` whose text is the task name and the status as plain text or a tag beside it; a task that cannot start is text, not a link.
- *ARIA and keyboard:* no APG pattern; lists and links. The status is tied to the link with `aria-describedby` so it is read after the name.
- *States:* `data-status="completed|incomplete|in-progress|cannot-start|error"` for the stylesheet; the status word is always in the markup.
- *Rules:* code-standard rule 15 (the status is a description, not part of the link's name), code-standard rule 20 (each task is its own page and form), code-standard rule 12 (Submit renders only when it can be used, or is shown with the reason it cannot), code-standard rule 1.
- *Detail:* [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions); [code: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures).

**Check**
- *Script:* could check that each task row has exactly one link (none for a task that cannot start), that a status text exists for every task, and that the completed count at the top equals the rows marked Completed.
- *Judgement:* Do people really leave and return, or do the tasks have to be done in order?

**Sources:** GOV.UK as linked.

## Step navigation: Back, Continue, save and return

**Use when / don't use**
- Every multi-step flow: a Back link at the top of each step, a Continue button under the last field, and a way to leave and return when the flow is long.
- Don't use Back with breadcrumbs on the same page; GOV.UK never combines the two ([GOV.UK back link](https://design-system.service.gov.uk/components/back-link/)).

**How**
- **Back** sits at the top of the page, before the main content, so the skip link passes it (GOV.UK back link); Friedman also places the in-page Back above the form, well away from the primary button, so a hurried tap does not hit the wrong one, and styles it as a plain visible link ([Friedman, Designing A Better Back Button UX](https://www.smashingmagazine.com/2022/08/back-button-ux-design/)).
- **The browser's Back does the same thing as the page's.** Friedman finds people distrust the browser button because flows send them to the start or lose their answers; each step is its own address, so Back returns to the previous step with its answers in place ([back behaviour](navigation.md#back-behaviour)). Minor changes on one page (a disclosure, a filter) do not add history entries.
- **Continue** names what comes next where that helps; NN/g notes generic "Next" carries weak scent ([NN/g wizards](https://www.nngroup.com/articles/wizards/)). Continue saves the step.
- **Leave and return.** Long flows save as they go and let people exit midway (NN/g); how is [forms: long forms, saving and resuming](forms.md#long-forms-saving-and-resuming).
- **Before losing data,** ask. Where going back or leaving would discard answers that were not saved, Friedman suggests confirming first; the toolkit prefers saving so the question never arises.
- **Check answers at the end** before the final submit: [forms: check answers before submitting](forms.md#check-answers-before-submitting). Its Change links return to the step and then back to the check page.

**Cases**
- A single-page wizard keeps its steps in script state, and the browser's Back leaves the wizard → give each step an address; Back then returns one step.
- The Back link sits beside Continue at the bottom, and people hit it by mistake → move Back to the top, per GOV.UK and Friedman.
- Changing an answer from the check page sends the reader through every later step again → return to the check page after the change.
- A reader closes the tab on step 4 of 6 and starts over the next day → save each step as it is continued, and resume at the first unanswered step.

**Accessibility**
- 2.4.3 Focus Order (Back before the content, Continue after it), 2.4.4 Link Purpose, 3.3.4 Error Prevention (Legal, Financial, Data) (review before a final submit), 2.2.1 Timing Adjustable (answers saved before a session timeout).
- Figma: figma-standard rule 26.

**Build**
- *Elements:* Back as an `a href` to the previous step's address, before `main` (or first in it, per the layout); Continue as a `button type="submit"` in the step's `form` with `method="post"`.
- *ARIA and keyboard:* none needed; a link and a submit button.
- *States:* each step's answers live on the server or in stored state keyed to the step's address, never only in the page; a step reached before its prerequisites redirects to the first unanswered step.
- *Rules:* code-standard rule 20 (real forms, real links, no script needed), code-standard rule 21 (modified clicks on Back go to the browser), code-standard rule 2 (DOM order matches what people see).
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history); [code: forms and cross-site request forgery](../../code/security.md#forms-and-cross-site-request-forgery) (each step's post).

**Check**
- *Script:* could walk a flow, press the browser's Back from step 3, and assert step 2 shows with its answers; could assert Back is an `a[href]` above `main`'s first heading and no breadcrumb shares the page.
- *Judgement:* Can a person leave at any step and come back without retyping?

**Sources:** GOV.UK, Friedman and NN/g as linked.

## Progress for long-running tasks

**Use when / don't use**
- A job that runs for more than a few seconds after the person starts it: an import, an export, a publish, an audit run.
- Under about ten seconds a looped indicator with text is enough; past ten, show how much is done, and estimate the remaining time where it can be estimated ([NN/g progress indicators, Sherwin 2014](https://www.nngroup.com/articles/progress-indicators/)). The short waits are [feedback: loading](feedback.md#loading)'s.
- Don't show a percentage the system cannot measure; an indeterminate bar with a running count is honest.

**How**
- **Determinate** when the work is countable: a bar and the count in words ("Checking component 12 of 48"); NN/g notes a count of items helps even where a percentage is hard to compute.
- **Indeterminate** when it is not: a moving bar or spinner with a line saying what is happening.
- **Pace.** NN/g advises a bar that starts slower and speeds up, and an estimate that errs long; a finish early never disappoints.
- **Stop.** A long job can be cancelled, and the page says what cancelling keeps (NN/g: offer a way to stop a long wait).
- **Leave the page.** For jobs over a minute, the person can go elsewhere; the result arrives as a notification or on the job's own page, linked from where it started.
- **End state.** Success says what was made and links to it; failure says why (code-standard rule 61) and what to try.

**Cases**
- An audit run shows a spinner for four minutes with "Loading…" → show "Checked 120 of 412 components", a bar, and Cancel.
- A bar jumps to 90% at once and sits there for a minute → drive it from the real count, or use an indeterminate bar with the count.
- An export finishes while the person is on another page and nothing tells them → a notification linking to the file.
- The job fails at 80% with "Error" → name the cause the job reported and whether anything was saved.

**Accessibility**
- 4.1.3 Status Messages (milestones and the end announced, not every percent), 2.2.2 Pause, Stop, Hide (an animated indicator that runs more than five seconds sits beside information that conveys the same status, or can be stopped), 2.3.3 Animation from Interactions and reduced motion, 1.4.11 (the bar's fill meets 3:1).

**Build**
- *Elements:* native `progress` with `value` and `max` for countable work and without `value` when indeterminate ([MDN progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)), labelled by `label` or `aria-labelledby`; the text inside the element is only a fallback, not its name (MDN). The count in words sits beside it.
- *ARIA and keyboard:* no APG pattern; `progress` carries the role. A polite live region announces milestones ("Halfway: 206 of 412"), not every tick. `aria-busy="true"` on the region the job updates, removed when it ends (MDN).
- *States:* `value` and `max` on `progress`; `data-status="running|done|failed|cancelled"`; Cancel `disabled` once the job ends.
- *Rules:* code-standard rule 61 (a failure reports why), code-standard rule 14 (updates keep focus where it is), code-standard rule 15 (the count is a description of the bar), code-standard rule 20 (the job's page shows its state on reload without script).
- *Detail:* [code: polling and live data](../../code/javascript.md#polling-and-live-data); [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages); [code: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code).

**Check**
- *Script:* could check that a `progress` has an accessible name, that it has a `value` only when the work is countable, that the live region updates at milestones rather than every tick, and that a failed job's message is not a generic string.
- *Judgement:* Does the person know how long to wait, and can they do something else meanwhile?

**Sources:** NN/g and MDN as linked.
