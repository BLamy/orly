# The Missing Layer

- **Paper:** [Repo-To-Skill: Distilling GitHub Repositories Into AI4AI Skills](https://arxiv.org/abs/2609.02749) by Jianlyu Chen, Yuyang Hu, Hongjin Qian, Jiawei Liu, Wenqing Wei, Xiaolong Chen, Defu Lian, Zhicheng Dou, Chaozhuo Li, Qiwei Ye, and Zheng Liu
- **Stable identifier:** `arXiv:2609.02749` · DOI `10.48550/arXiv.2609.02749`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2609.02749) · selected at rank 1 with 510 visible upvotes, ahead of 232 and 209, from the [2026-09-03 ranking](https://huggingface.co/papers/date/2026-09-03)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2609.02749) · [PDF](https://arxiv.org/pdf/2609.02749)
- **Official source:** [VectorSpaceLab/AREX-Skill](https://github.com/VectorSpaceLab/AREX-Skill) at source commit [`ac3fe1a`](https://github.com/VectorSpaceLab/AREX-Skill/tree/ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6)

Autonomous research agents already combine a model with a harness for planning, tools, memory, and verification. Repo-To-Skill argues that this two-part picture leaves out a practical layer: the operational knowledge that says which method or package fits, how to use it, and which checks expose a plausible-looking failure. DisCo packages that knowledge as verified skill graphs, writes them in Creator mode, and opens only the relevant branch in Researcher mode.

## 1. The Missing Layer

### The same agent follows a different path when it carries operating context

The paper formalizes a research task as a problem, data and materials, an environment, and a target. A conventional agent combines a backbone with a harness, but neither component guarantees the task-specific know-how needed to choose interfaces, settings, validation steps, or recovery paths. The missing term is operational knowledge, written as `K`: capabilities coupled to policies for selecting and using them.

{% viz scene="books/repo-to-skill/chapter-1" section="chapter-1-missing-layer" cue="0" from="0.000" to="64.690" title="The same agent follows a different path when it carries operating context." %}
{% endviz %}

Skills make `K` portable without changing the backbone or harness. The paper defines each skill as three layers: `SKILL.md` is the knowledge interface read first, `references/` holds deeper evidence and detail, and `scripts/` provides executable helpers. The skill can therefore supply operating context before an expensive experiment while leaving the agent's control loop intact.

## 2. Four Gates, One Skill Graph

### Verification turns source material into an admitted graph

Every DisCo distillation run follows four stages: scope capabilities, ground them in admissible evidence, construct a candidate graph, then verify and refine it. Repository construction first fixes an evidence boundary across source roots, documentation, examples, tests, configuration, and repository-owned scripts. Generated outputs, vendored dependencies, caches, and unrelated internals are excluded unless the requested workflow truly needs them.

{% viz scene="books/repo-to-skill/chapter-2" section="chapter-2-four-gates" cue="0" from="0.000" to="77.136" title="Verification turns source material into an admitted graph." %}
{% endviz %}

The released [`create-repo-skill`](https://github.com/VectorSpaceLab/AREX-Skill/blob/ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6/cli/packages/coding-agent/src/disco/skills/create-repo-skill/SKILL.md) workflow keeps the root entry skill concise and routes distinct workflows into focused component skills. Its paired [`verify-repo-skill`](https://github.com/VectorSpaceLab/AREX-Skill/blob/ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6/cli/packages/coding-agent/src/disco/skills/verify-repo-skill/SKILL.md) workflow uses assertion-backed usability cases, safe native checks, and static gates. A `SKILL_GAP` sends a localized repair back to the owning skill, reference, script, or route; unresolved gaps remain visible in construction record `R`. That verification boundary is the paper's distinction between distillation and summarization.

## 3. Only One Branch Opens

### A two-level router keeps five thousand skills out of the prompt

The paper's repository collection contains more than 5,000 verified skills distilled from 1,000 repositories. A fixed taxonomy groups those repositories into 20 areas and 178 capability families. Researcher mode begins with a small, model-visible router, narrows a request to one or two likely areas, compares the relevant families, and then opens only the selected repository entry and component skills.

{% viz scene="books/repo-to-skill/chapter-3" section="chapter-3-one-branch" cue="0" from="0.000" to="75.696" title="A two-level router keeps five thousand skills out of the prompt." %}
{% endviz %}

The repository makes both the routing evidence and the update mechanics explicit. [`repo-skills-router`](https://github.com/VectorSpaceLab/AREX-Skill/blob/ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6/cli/packages/coding-agent/src/disco/skills/repo-skills-router/SKILL.md) rejects forced matches and name-only selection. [`update_repo_skills_router.mjs`](https://github.com/VectorSpaceLab/AREX-Skill/blob/ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6/cli/packages/coding-agent/src/disco/skills/verify-repo-skill/scripts/update_repo_skills_router.mjs) rebuilds generated area and family pages from taxonomy, repository, and assignment indexes. [`RepoSkillsLibraryManager`](https://github.com/VectorSpaceLab/AREX-Skill/blob/ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6/cli/packages/coding-agent/src/core/repo-skills-library-manager.ts) stages the skill tree and router, swaps them under a directory lock, and restores the prior live state when the transaction fails.

## 4. Hold Everything Else Still

### Matched benchmark runs isolate access to distilled skills

The paper compares the same GPT-5.5 backbone and Codex harness with and without distilled operating context, while holding downstream execution budgets fixed. On the full 75-task MLE-bench suite, Any Medal rises from 31.11% to 72.89%. PaperBench's average replication score rises from 29.45 to 39.59. FrontierCS Agent Track score rises from 70.63 to 77.14 across 188 tasks. PassNet AS Score rises from 1.343 to 1.5313, while failed samples fall from 14 to 5.

{% viz scene="books/repo-to-skill/chapter-4" section="chapter-4-matched-results" cue="0" from="0.000" to="92.926" title="Matched benchmark runs isolate access to distilled skills." %}
{% endviz %}

Those rows use different metrics and should be read within each benchmark, not compared as one shared scale. The results also retain a useful failure signal: two of the 20 PaperBench tasks score lower with skills, which the authors describe as a possible retrieval-precision failure. Under the matched setup, the changed variable is access to distilled operating context. The evidence supports that controlled comparison; it does not imply that every retrieved skill helps every task.

---

Read the [canonical paper](https://arxiv.org/abs/2609.02749), its [PDF](https://arxiv.org/pdf/2609.02749), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2609.02749), and the [official AREX-Skill repository](https://github.com/VectorSpaceLab/AREX-Skill).
