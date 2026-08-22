# Awakening Static Worlds

This O'RLY? explainer accompanies **“EnvHarness: Awakening Static Worlds for Agent Learning”** by Chengsong Huang, Zifeng Wang, Rujun Han, Jun Yan, Yanfei Chen, Zoey CuiZhu, Ke Jiang, Peng Xia, Han Yu, Yufan Zhuang, Yifei Ming, Jiaqi Pan, Bhavana Dalvi Mishra, Jiaxin Huang, Burak Gokturk, Tomas Pfister, and Chen-Yu Lee.

Paper identifier: **arXiv:2608.19880**. Sources: [Hugging Face Daily Paper](https://huggingface.co/papers/2608.19880), [canonical paper](https://arxiv.org/abs/2608.19880), [PDF](https://arxiv.org/pdf/2608.19880), [project page](https://envharness.com/), and the [official `google-research/envharness` repository](https://github.com/google-research/envharness).

The paper's premise is deliberately asymmetric: keep the benchmark and its verifier fixed, but wrap the environment in an interface that can present a lesson matched to the learner's current weakness. The released code makes that idea concrete through the `ActionableEnv` boundary, composable harness components, and an evidence-driven Environment Rigger.

## Chapter 1 · A membrane around the world

### The benchmark stays fixed while its interface changes

`ActionableEnv` is the shared boundary: `reset`, `step`, `observe`, `evaluate`, and environment-state access. `EnvHarness` decorates that boundary instead of rewriting the underlying task, so a policy still speaks the same action-and-observation language and the original evaluator retains authority over success.

{% viz scene="books/envharness-adaptive-worlds/chapter-1" section="chapter-1-interface-membrane" cue="0" from="0.000" to="55.170" title="The benchmark stays fixed while its interface changes." %}
{% endviz %}

![The ActionableEnv membrane around a static environment.](/generated/envharness-adaptive-worlds/blog/chapter-1-0.png)

The paper writes this as a customized environment derived from a static one. In the repository, the decorator shape is operational: harnesses can be stacked while calls continue through the same interface to the same underlying world.

## Chapter 2 · Pre-roll and three gates

### Setup moves the start; Rules rewrites the interaction

The paper's Stage component appears in the released code as `Setup`: after the inner environment resets, it replays a fixed list of in-environment actions, calls `notify_replay_complete`, and returns the resulting observation to the policy. The paper's Contract appears as `Rules`, whose hooks can filter an action, modify a transition, and filter the observation.

{% viz scene="books/envharness-adaptive-worlds/chapter-2" section="chapter-2-setup-rules" cue="0" from="0.000" to="53.963" title="Setup moves the start; Rules rewrites the interaction." %}
{% endviz %}

![Setup pre-roll and the Rules action, transition, and observation gates.](/generated/envharness-adaptive-worlds/blog/chapter-2-0.png)

A blocked action does not secretly advance the world: `Rules.step` can retain the current observation and explain the block. A real action proceeds inward, then the wrapper fetches the post-step state before applying transition and observation transforms. Reward and terminal evaluation remain outside those gates.

## Chapter 3 · Stitching a longer horizon

### Link turns two short tasks into one longer goal

`Link` composes two arbitrary `ActionableEnv` instances. It begins in environment A, records A's verdict when the handoff is reached, lazily resets environment B, and can prepend a bounded tail of A's final observation to announce the new task. The default carry limit in the released implementation is 1,500 characters.

{% viz scene="books/envharness-adaptive-worlds/chapter-3" section="chapter-3-link-handoff" cue="0" from="0.000" to="56.749" title="Link turns two short tasks into one longer goal." %}
{% endviz %}

![Link masks the first local ending and hands the policy into a second environment.](/generated/envharness-adaptive-worlds/blog/chapter-3-0.png)

The composite does not replace either verifier: final success requires both A and B to succeed. In the paper's combined-skill experiment, Stage, Contract, and Chain together reach a 54.30% success rate with 43.12 average steps.

## Chapter 4 · The diagnostic lathe

### Fresh trajectories decide which generated lesson survives

Environment Rigger begins with five baseline trajectories, diagnoses a behavior to target, and asks `HarnessAgent.propose()` for `rules_code` and, when useful, `in_env_actions`. The candidate is executable Python rather than a fixed menu of transformations; the loader compiles a generated `Rules` subclass and reports malformed code as `RulesCodeError`.

{% viz scene="books/envharness-adaptive-worlds/chapter-4" section="chapter-4-rigger-loop" cue="0" from="0.000" to="61.625" title="Fresh trajectories decide which generated lesson survives." %}
{% endviz %}

![The Environment Rigger diagnoses traces, writes a candidate, and evaluates fresh processes.](/generated/envharness-adaptive-worlds/blog/chapter-4-0.png)

The runner builds `Rules(Setup(base_env))` and isolates each fresh rollout in its own process. Five new trajectories are aggregated, then the candidate is accepted, refined with the new evidence, or rejected; the orchestration code gives the write-and-validate loop a revision budget of five.

## Chapter 5 · The lesson moves with the learner

### Improvements must transfer back to untouched evaluation

The method is judged on held-out tasks rather than on the reshaped training worlds alone. The paper reports ALFWorld average success rising from 62.4 to 68.3, WebArena from 38.5 to 41.6, SWE success from 49.88 to 52.58 while average steps fall from 55.01 to 49.61, OfficeQA exact match from 54.40 to 56.20, and spreadsheet Pass@1 from 45.88 to 49.15.

{% viz scene="books/envharness-adaptive-worlds/chapter-5" section="chapter-5-capability-frontier" cue="0" from="0.000" to="71.843" title="Improvements must transfer back to untouched evaluation." %}
{% endviz %}

![Held-out benchmark gains and the learner's moving capability boundary.](/generated/envharness-adaptive-worlds/blog/chapter-5-0.png)

The reshaped environments also provide an optimization signal: the paper reports ALFWorld in-distribution reinforcement-learning success moving from 81.4 to 87.9. At 300 environments, the co-evolution result reaches 54.79, above the reported original-environment 52.13 and generated-environment 50.37 baselines. Each accepted lesson therefore changes the boundary that the next diagnostic pass must probe.
