# A Fast Path with a Thoughtful Fallback

How a small policy and GLM can work together. Book 5 of *From RLCD to Predictive Tab*.

This series explains a proposed product grounded in the project charter. Page examples and work diagrams are illustrative; they are not measured performance results.

Source note: the narration is pinned to the September 16, 2026 source snapshot. References to the imported native implementation describe that snapshot; subsequent foundation work may have advanced.

### Use the larger model where reasoning earns its cost

The proposed hybrid system lets a larger model plan a subgoal or help label training examples. A small local policy handles supported decisions and abstains when it lacks enough evidence.

{% viz scene="books/fast-path-thoughtful-fallback/chapter-1" section="chapter-1-use-the-larger-model-where-reasoning-earns-its-cost" cue="1" from="0.000" to="36.745" title="Use the larger model where reasoning earns its cost" %}
{% endviz %}

### Make the fallback and its cost explicit

Hybrid mode can route uncertainty to a configured provider; local-only mode cannot silently make that request. The intended GLM identity and interface must be pinned. Network travel, reasoning, and recovery remain part of task latency.

{% viz scene="books/fast-path-thoughtful-fallback/chapter-1" section="chapter-1-make-the-fallback-and-its-cost-explicit" cue="5" from="36.745" to="74.767" title="Make the fallback and its cost explicit" %}
{% endviz %}

### A constrained API is not proof of shared-cache branching

A hosted endpoint may accept a schema while withholding the state, logits, masks, and batching controls needed for faithful RLCD. Actual runtime capabilities decide whether the larger-model experiment is feasible.

{% viz scene="books/fast-path-thoughtful-fallback/chapter-2" section="chapter-2-a-constrained-api-is-not-proof-of-shared-cache-branching" cue="1" from="0.000" to="38.812" title="A constrained API is not proof of shared-cache branching" %}
{% endviz %}

### Two experiments with different tradeoffs

Reducing output work in a powerful model and teaching a small policy are separate approaches. Neither eliminates neural computation nor guarantees preservation of general capabilities. A documented feasibility no-go still leaves useful baseline and student experiments.

{% viz scene="books/fast-path-thoughtful-fallback/chapter-2" section="chapter-2-two-experiments-with-different-tradeoffs" cue="5" from="38.812" to="77.833" title="Two experiments with different tradeoffs" %}
{% endviz %}

### Count the entire path to a completed task

Observation, inference, transport, execution, fallback, and recovery all contribute to what the user waits for. Controlled candidate comparisons need a broader generated-action baseline to expose missing coverage.

{% viz scene="books/fast-path-thoughtful-fallback/chapter-3" section="chapter-3-count-the-entire-path-to-a-completed-task" cue="1" from="0.000" to="44.907" title="Count the entire path to a completed task" %}
{% endviz %}

### Recorded history cannot answer an unobserved counterfactual

Closed-loop quality needs live resettable environments. Freeze gates before selection, choose on development data, calibrate separately, and reserve the final test for evaluation. These visuals illustrate the protocol and report no measured speedup.

{% viz scene="books/fast-path-thoughtful-fallback/chapter-3" section="chapter-3-recorded-history-cannot-answer-an-unobserved-counterfactual" cue="5" from="44.907" to="83.639" title="Recorded history cannot answer an unobserved counterfactual" %}
{% endviz %}

The project charter and its dated scope decision distinguish the native Qwen reference, the current browser prototype, and the planned product. Source anchors and the fixed narration contract are retained with this series’s source files.

[Open the complete book](?bundle=fast-path-thoughtful-fallback)

Related implemented decision pattern: [TypeSafe speculative fan-out](https://docs.typesafe.ai/patterns/fan-out), used by the Jev client in book 3. It does not establish the internal algorithm of a hosted GLM service or low-level branching access.
