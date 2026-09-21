# Confidence Before Words

An animated explanation of [Confidence-Aware Routing for Large Language Model Reliability Enhancement](https://arxiv.org/abs/2510.01237v1), by Nandakishor M. This article follows the supplied version-one paper. It explains the proposal and its reported results without claiming an independent reproduction.

### Three clues, one query

The proposal assesses a query before generating its answer. It still runs the query through the model to obtain hidden states. Semantic alignment compares a learned projection of the final hidden state with a reference embedding; convergence compares early and late layer variation; a learned head predicts confidence from the final hidden state. These are signals for choosing a route, not independent proof of factual correctness.

{% viz scene="books/confidence-before-words/chapter-1" section="chapter-1-1" cue="1" from="0.000" to="57.528" title="Three clues, one query" %}
{% endviz %}

### Putting signals on a common scale

Equation 4 combines the three signals with learned weights. Yet cosine similarity can be negative, and the variance ratio can exceed one. The paper does not fully specify how these raw signals become its bounded overall confidence score. The animation keeps this gap visible instead of inventing a normalization procedure.

{% viz scene="books/confidence-before-words/chapter-1" section="chapter-1-2" cue="8" from="57.528" to="74.490" title="Putting signals on a common scale" %}
{% endviz %}

### A threshold selects the response pathway

The reported policy sends scores at or above 0.75 to local generation; scores from 0.55 to below 0.75 to retrieval-augmented generation; scores from 0.35 to below 0.55 to a larger model; and scores below 0.35 to human review. Example scores in the animation illustrate this deterministic policy and are not measured model outputs.

{% viz scene="books/confidence-before-words/chapter-2" section="chapter-2-1" cue="1" from="0.000" to="37.930" title="A threshold selects the response pathway" %}
{% endviz %}

### A boundary is a deployment choice

Each lower boundary is included: exactly 0.55 selects retrieval. These thresholds are fixed after validation in the reported setup. They allocate effort across response mechanisms, but neither a high score nor escalation guarantees correctness. Human review requires an operational review process, and a new domain may require recalibration.

{% viz scene="books/confidence-before-words/chapter-2" section="chapter-2-2" cue="6" from="37.930" to="66.548" title="A boundary is a deployment choice" %}
{% endviz %}

### Read the results with their baselines

Table I reports F1 of 0.82 for the proposed method versus 0.61 for the baseline, alongside a false-positive rate of 0.09. Table II reports F1 of 0.76 for semantic alignment alone, 0.69 for convergence alone, and 0.72 for learned confidence alone. These are the author's reported results; this explainer does not independently reproduce them. Relative cost is 1.6 times the basic baseline, compared with 2.8 for always-on retrieval and 4.2 for SelfCheckGPT. That makes 1.6 about 43% lower than 2.8, while still 60% higher than the basic baseline.

{% viz scene="books/confidence-before-words/chapter-3" section="chapter-3-1" cue="1" from="0.000" to="39.265" title="Read the results with their baselines" %}
{% endviz %}

### The evaluation leaves open questions

The primary model is SmolLM2-360M-Instruct, with all-MiniLM-L6-v2 reference embeddings. The stated confidence-training set has 72 examples: 33 high-confidence, 27 low-confidence, and 12 medium-confidence. This is a training count, not a reported evaluation sample size. The paper names Natural Questions, TriviaQA, and HotpotQA but does not supply evaluation sizes, per-benchmark results, or uncertainty intervals. Its acknowledged limitations include reference-model dependence, fixed thresholds, domain calibration, and transfer to larger models.

{% viz scene="books/confidence-before-words/chapter-3" section="chapter-3-2" cue="6" from="39.265" to="72.818" title="The evaluation leaves open questions" %}
{% endviz %}

Source locations: methodology equations 1–5 and model configuration on page 2; training procedure, Tables I–II, and cost discussion on page 3; limitations on page 4.
