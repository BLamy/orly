# The Procedural Anchor

This companion to **Demystifying Agent Skills: Why They Work-Until They Don't** follows one procedure card from a noisy trajectory through construction, comparison, retrieval, and audit. The paper is arXiv:2608.14036, selected as the #1 Hugging Face Daily Paper for August 19, 2026 with 152 visible upvotes.

Authors: Zhiyuan Jiang, Fangrui Huang, Hanwen Xing, Xander Wu, Yipeng Gao, Rui Cao, Mengdi Wang, Shilong Liu, and Yijiang Li.

Sources: [Hugging Face paper](https://huggingface.co/papers/2608.14036) · [canonical paper](https://arxiv.org/abs/2608.14036) · [PDF](https://arxiv.org/pdf/2608.14036) · [official research code](https://github.com/zhiyuanjiang04/demystify-agent-skills)

{% hint style="info" %}
The central result is narrower and more useful than “skills add knowledge.” In the paired trajectory analysis, procedural anchoring accounts for 65.7% of skill mechanisms, while explicit knowledge injection accounts for 4.5%. The skill usually helps by stabilizing execution.
{% endhint %}

## From Trace to Card

### Qualification turns a run into evidence

The clean experiment pipeline begins with Harbor trial directories, result metadata, and trajectories. `export_workflows.py` classifies each trial from verifier reward and exception state, then selects status-qualified success and failure evidence. That gate matters: a transcript that merely sounds confident is not interchangeable with a verifier-backed result.

{% viz scene="books/skills-procedural-anchor/chapter-1" section="chapter-1-qualification" cue="0" from="0.000" to="23.905" title="Qualification turns a run into evidence." %}
{% endviz %}

The workflow inducer walks actionable events in order. For each action it records intent, tool, operation, preconditions, and either the observed success signal or a verification hint. The product is not a loose summary; it is an ordered account of what the run attempted and how each step could be checked.

### One workflow feeds matched artifact arms

`generate_skills.py` normalizes the workflow steps before asking a skill creator to produce execution-ready artifacts. The normal and no-hint conditions share the workflow input; the no-hint arm changes whether success and failure status is exposed. Separate output roots keep those conditions from contaminating one another.

{% viz scene="books/skills-procedural-anchor/chapter-1" section="chapter-1-matched-arms" cue="4" from="23.905" to="49.319" title="One workflow feeds matched artifact arms." %}
{% endviz %}

The controlled comparison then holds benchmark, task set, candidate pool, seed, agent, model, provider, and trial count fixed. That is why a change in success can be attributed to the representation instead of an easier batch of tasks.

## The Representation Earns Six Points

### Same experience, different container

`WorkflowMemoryIndex` resolves a task key and renders matching prior attempts as context. The skill packager takes a more structured route: its success and failure channels require ordered steps, preconditions, verification, recovery, and source evidence. Both originate from the same experience, but one remains a long context strip while the other becomes a procedure the runtime can apply.

{% viz scene="books/skills-procedural-anchor/chapter-2" section="chapter-2-representation" cue="0" from="0.000" to="23.035" title="Same experience, different container." %}
{% endviz %}

This is a comparison of memory units, not a comparison of different underlying episodes.

### The gain is mostly stabilization

In the matched result reported by the paper, Workflow Memory reaches 55.9% success and Skill reaches 61.9%, a 6.06-point improvement. The paired trajectory labels explain the difference: 65.7% of skill cases are procedural anchoring, compared with 4.5% categorized as explicit knowledge injection.

{% viz scene="books/skills-procedural-anchor/chapter-2" section="chapter-2-mechanism" cue="4" from="23.035" to="47.091" title="The gain is mostly stabilization." %}
{% endviz %}

The card is therefore best understood as a guardrail for action order, tool choice, and verification. It can still contain useful facts, but the dominant observed mechanism is steadier execution.

## Retrieval Is Not Use

### A larger pool stresses identification

The repository implements three retrieval arms with a shared directory and result schema: embedding-based ranking, explicit agent selection, and real execution with activated-skill parsing. Candidate-pool mode, size, and seed are controlled so pool growth can be studied without changing the target task set.

{% viz scene="books/skills-procedural-anchor/chapter-3" section="chapter-3-identification" cue="0" from="0.000" to="22.964" title="A larger pool stresses identification." %}
{% endviz %}

As the pool grows from 5 to 100, embedding top-one precision declines from 88.3% to 76.9%. That is a real drop, but it is modest next to what happens at execution time.

### Actual use and success diverge

Parsed actual-use precision falls from 29.6% to 3.3%, while downstream success stays around 36–39%. The paper does not chain these numbers into a single funnel: the arms are independent diagnostics, and the output of one is not passed to the next.

{% viz scene="books/skills-procedural-anchor/chapter-3" section="chapter-3-use" cue="4" from="22.964" to="46.115" title="Actual use and success diverge." %}
{% endviz %}

This separation blocks an attractive but unsupported inference. Selecting the exact ground-truth card is neither sufficient nor necessary for solving the task; an agent can retrieve correctly and execute badly, or miss the labeled card and still succeed by another route.

## Audit the Anchor

### From 8,135 trials to twelve modes

The failure-taxonomy pipeline indexes 8,135 normalized trial records, samples 240 records for open coding, and retains 238 valid labels. `05_report.py` aggregates paired raw, workflow, and skill labels without another model call. The canonical map consolidates observations into twelve modes and three high-level categories.

{% viz scene="books/skills-procedural-anchor/chapter-4" section="chapter-4-taxonomy" cue="0" from="0.000" to="25.484" title="From 8,135 trials to twelve modes." %}
{% endviz %}

The paired records preserve concrete evidence spans and record what changed between arms. That makes “the skill helped” a claim that can be decomposed into fixed, unchanged, or introduced failure modes.

### A procedure creates a boundary of its own

The same structure that stabilizes a compatible task can break under brittle assumptions, incompatible context, or insufficient adaptation. Misapplied or ignored guidance is therefore a new failure boundary: the skill can steer execution reliably in the wrong direction.

{% viz scene="books/skills-procedural-anchor/chapter-4" section="chapter-4-boundary" cue="4" from="25.484" to="52.245" title="A procedure creates a boundary of its own." %}
{% endviz %}

The full journey is trace → qualified workflow → procedure card → retrieval test → paired audit. The paper's useful conclusion lives in that last comparison: skills work when a procedure fits the world, and fail when the world violates the procedure's assumptions.
