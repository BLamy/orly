# The Routing Harness

- **Paper:** [NeoHorse-1: Towards Recursive Self-Improvement via Agentic Post-Training with Routing Harness](https://arxiv.org/abs/2609.08183) by the NeoHorse Team and 36 named coauthors
- **Stable identifier:** `arXiv:2609.08183` · DOI `10.48550/arXiv.2609.08183`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2609.08183) · selected at rank 1 with 384 visible upvotes, ahead of 186 and 124, from the [2026-09-09 ranking](https://huggingface.co/papers/date/2026-09-09)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2609.08183) · [PDF](https://arxiv.org/pdf/2609.08183)
- **Official source:** [TokenRhythm/NeoHorse](https://github.com/TokenRhythm/NeoHorse) at source commit [`f8a36a8`](https://github.com/TokenRhythm/NeoHorse/tree/f8a36a87e9afc39fdef90c9e2c92330ea6618129)

Recursive self-improvement needs more than a model that can solve tasks. It needs a record of what capability each task appeared to demand, what service tier actually handled it, how the tool-mediated interaction unfolded, and whether the result succeeded. NeoHorse-1 turns those linked observations into an agentic post-training loop: route work, preserve trajectories, admit reliable examples, train in capability order, and use measured deficiencies to choose the next mixture.

## 1. The Harness Leaves a Trace

### Prediction, policy, and execution remain distinct facts

The routing harness begins before a model writes its answer. It estimates the capability demand of a user turn, lets policy adjust the service tier when necessary, and records the tier that actually serves the request. The ensuing trajectory keeps interleaved reasoning, tool calls, environment responses, and the final outcome attached to those routing facts. That distinction matters: a prediction is evidence about demand, while the served tier is evidence about the system's decision.

{% viz scene="books/neohorse-routing-harness/chapter-1" section="chapter-1-routing-trace" cue="0" from="0.000" to="77.228" title="Prediction, policy, and execution remain distinct facts." %}
{% endviz %}

Because the record retains both routing metadata and the actual agent exchange, later training can recover not only whether an answer passed, but what context and tools produced it. The paper's feedback loop starts with this instrumentation boundary rather than with an unobserved model call.

## 2. Quality Has Layers

### Admission separates valid structure from useful behavior

A recorded trajectory is not automatically training data. NeoHorse first applies structural validation, then scores semantic quality along six dimensions: task compliance, reasoning quality, tool-use quality, final-answer quality, communication quality, and trajectory efficiency. Subscene labels localize strengths and failures inside a long interaction instead of reducing the whole trace to one coarse verdict.

{% viz scene="books/neohorse-routing-harness/chapter-2" section="chapter-2-layered-quality" cue="0" from="0.000" to="77.323" title="Admission separates valid structure from useful behavior." %}
{% endviz %}

The capability tier is a different axis from quality. A difficult trace can fail, while an easy trace can succeed cleanly. Keeping those axes separate allows the pipeline to filter unreliable examples without erasing evidence about which tasks stress which capabilities.

## 3. Curriculum Keeps the Easy Cases

### Routing signals order the lesson without discarding diversity

The supervised fine-tuning curriculum progresses through three stages. It first emphasizes complete, high-quality trajectories at lower routing tiers, then broadens across higher tiers and more varied interactions, and finally mixes the admitted pool. Each sample combines a hard success indicator with a soft process score, so a useful partial trajectory is not treated as identical to a structurally broken one.

{% viz scene="books/neohorse-routing-harness/chapter-3" section="chapter-3-routing-curriculum" cue="0" from="0.000" to="69.985" title="Routing signals order the lesson without discarding diversity." %}
{% endviz %}

This curriculum uses the harness's estimate of capability demand as an ordering signal rather than as a replacement for quality evaluation. The stages gradually widen the learning distribution while preserving complete examples and informative variation.

## 4. The Student Closes the Loop

### Deficiencies become the routing signal for the next mixture

Routing-guided on-policy distillation starts teacher and student continuations from the same recorded prefixes. The teacher supplies a target distribution while the student generates on-policy responses, and reverse Kullback-Leibler divergence pulls the student toward that target under the same staged routing progression. Evaluation then produces a deficiency profile rather than a single undifferentiated score.

{% viz scene="books/neohorse-routing-harness/chapter-4" section="chapter-4-deficiency-loop" cue="0" from="0.000" to="88.701" title="Deficiencies become the routing signal for the next mixture." %}
{% endviz %}

Capability-guided allocation converts that profile into the next task mixture, closing an evaluation-selection-update loop. Across eleven benchmarks, the paper reports a macro-average increase from 58.94 to 64.87 for the 4B model and from 65.60 to 69.04 for the 9B model. The authors describe this as an initial prototype; successive self-improvement iterations remain future work rather than an established autonomous cycle.

---

Read the [canonical paper](https://arxiv.org/abs/2609.08183), its [PDF](https://arxiv.org/pdf/2609.08183), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2609.08183), and the [official NeoHorse repository](https://github.com/TokenRhythm/NeoHorse).
