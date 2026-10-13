# When Memory Matters

An animated explanation of [RealCompanion: Benchmarking Human Understanding from Reasoning over Longitudinal Real-World Conversations](https://arxiv.org/abs/2610.01780), by Arman Behnam, Sunglyoung Kim, and Liangwei Yang. Stable paper identifier: **arXiv:2610.01780**. The paper was the [#1 Hugging Face Daily Paper for 2026-10-05](https://huggingface.co/papers/2610.01780) when this explainer was researched. Its [official public code and manifest snapshot](https://anonymous.4open.science/r/realcompanion-54CC/) grounds the structural claims below.

### A conversation becomes a test

RealCompanion begins with ten longitudinal relationships containing 27,218 messages across histories that extend up to 120 days. The released conversation words are rewritten for privacy, but ordering, identifiers, and evidence links remain inspectable. A chat probe is copied from that released conversation, and only messages before the probe may support its answer. The animation follows the released U10 probe `day8-151`, keeping its recent turn `day8-150` separate from the earlier evidence at `day7-50`.

{% viz scene="books/when-memory-matters/chapter-1" section="chapter-1-record" cue="0" from="0.000" to="55.913" title="A conversation becomes a test" %}
{% endviz %}

The key distinction is between a real longitudinal history and the privacy-preserving text released to researchers. This explainer uses the public identifiers and relationships without inventing private dialogue.

### Rare does not mean nearby

The proportional stratum contains 1,227 released probes, of which 1,169 are scoreable. Forty have verified references beyond the recent thread, a recorded rate of 3.4%. Removing 25 probes whose referent is already visible in the recent conversation leaves 15, or 1.3%, under the stricter reading. The enriched stratum contributes 364 additional scoreable memory cases for comparison, but it cannot be added to the natural-rate denominator; 434 cold-opening abstention controls are separate again.

{% viz scene="books/when-memory-matters/chapter-2" section="chapter-2-denominator" cue="0" from="0.000" to="56.099" title="Rare does not mean nearby" %}
{% endviz %}

Among recorded memory-bearing probes, the paper reports a median furthest-evidence distance of 2,157 messages. A small rate can therefore coexist with a long retrieval horizon.

### The probe earns its label

A memory label is not accepted at face value. The public pipeline records a referent and expected locus, retrieves candidate evidence, verifies what survives, then derives the tier from the verified context. In the released U10 example, five retrieved candidates become one verified earlier turn. A fixed rule classifies the surviving context as `hard / event_recall`; if verification removes every distant reference, the same rule can reduce an item to a thread-only case. The reference reply and its grounding remain attached to the trace.

{% viz scene="books/when-memory-matters/chapter-3" section="chapter-3-trace" cue="0" from="0.000" to="54.660" title="The probe earns its label" %}
{% endviz %}

This traceability does not make every label automatically correct. It makes a disagreement local: a reader can challenge the referent, evidence, category, grounding, or final verification step instead of disputing an opaque aggregate.

### What the public audit can prove

The public package omits the rewritten conversation text, yet its manifest still exposes useful structural invariants. The audit checks that cited turns exist, precede the probe, sit outside the declared recent window when labeled distant, remain inside the allowed grounding envelope, and agree with the derived locus. It also preserves evidence of a real repair: 51 rows once retained a distant locus after their distant references had disappeared—48 were reset to thread and 3 to none.

{% viz scene="books/when-memory-matters/chapter-4" section="chapter-4-audit" cue="0" from="0.000" to="58.607" title="What the public audit can prove" %}
{% endviz %}

Twenty-two of the 26 gates run completely on the public manifest; four need the withheld text to finish. The reproduced audit passed and matched the committed expected outputs. That establishes internal consistency, not whether every rewritten sentence semantically supports its label.

### Score the decision, not just the average

The public scorer keeps several questions separate. Retrieval recall asks how many required turns appear in a submitted ranked list; reciprocal rank rewards the position of the first correct turn; controls test abstention; reply correctness requires the actual text and a judge. The paper's 95.9% overall Recency Hit@5 and 2.2% Hit@5 on the 404 memory-bearing probes are pooled hit rates, not the public scorer's recall calculation. They show how a strong aggregate can conceal failure on the distant cases.

{% viz scene="books/when-memory-matters/chapter-5" section="chapter-5-score" cue="0" from="0.000" to="66.270" title="Score the decision, not just the average" %}
{% endviz %}

The paper also reports an approximately 0.108 context gain in the proportional recorded comparison: 0.004 from memory-bearing probes and 0.104 from probes labeled as not requiring distant memory. Because that comparison also changes the heading supplied to the model, it is a reported context contrast—not an isolated causal estimate of memory.

Evidence note: `realcompanion-manifest verify` reproduced 10 subjects, 27,218 messages, 2,034 chat rows, 3,312 QA items, and 3,580 profile claims. `realcompanion-audit all` matched all committed expected outputs. The upstream test run produced 112 passes and one packaging-related failure because seven deployed prompt files referenced by the hash test are absent from the public snapshot. Model-performance results in this article are paper-reported; the withheld conversation text was not independently audited.
