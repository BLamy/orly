# Jeva: Fresh Decisions

A list of candidates creates two separate questions: which candidate fits best, and whether the list contains a valid answer at all. [Jeva: System One Models from First Principles](https://arxiv.org/abs/2610.18773v1), by Qi Li and Xinchao Wang, gives those questions different computations. Its request state changes as it reads the candidate set, while the options remain reusable memory. This explainer follows the official implementation pinned below; its numerical illustrations are analytical examples, not outputs from the released checkpoint.

### Fixed options can still change each other’s ranking

Jeva’s shared language encoder reads the request and each typed option separately. An option’s input excludes the current request, question, other candidates, and candidate position. The resulting normalized option vector supplies keys and values to the decision stack. Only the request state evolves: it queries the complete memory, receives an attention-weighted message, and passes through residual updates before the final dot-product readout. Independent encoding therefore does not force independent judgment.

{% viz scene="books/jeva-fresh-decisions/chapter-1" section="chapter-1-set-aware-state" cue="0" from="0.000" to="85.124" title="Fixed options, changing judgments" %}
{% endviz %}

![Chapter 1: Fixed options, changing judgments](/generated/jeva-fresh-decisions/blog/chapter-1.png)

The geometry is the paper’s exact Proposition 1 construction. Two retained options initially tie. Reflecting a third option moves the refined request state slightly above or below its starting axis, reversing the original pair’s preference. The magnified state inset uses equal coordinate scales; this is a mathematical construction with illustrative parameters, not a checkpoint prediction. Reordering a fixed set merely reindexes the attention sum, so the state stays unchanged and candidate probabilities follow their identities. A unique winner is preserved in exact arithmetic. Exact candidate ties in this implementation use the first input position, and floating-point reductions can perturb near ties.

### Competition and coverage answer different questions

A softmax over candidate scores measures relative preference. Moving every final score down by the same amount preserves that distribution, even when none of the candidates is strongly supported. Jeva separately estimates coverage by applying a sigmoid to the maximum final score minus a learned threshold, scaled by a learned positive temperature. In an open-set request, it multiplies each conditional candidate probability by coverage and gives the remaining mass to null. The animation’s controlled score examples hold the arithmetic visible so these two effects cannot be mistaken for each other.

{% viz scene="books/jeva-fresh-decisions/chapter-2" section="chapter-2-coverage-and-competition" cue="0" from="0.000" to="93.343" title="Which answer, or no answer?" %}
{% endviz %}

![Chapter 2: Which answer, or no answer?](/generated/jeva-fresh-decisions/blog/chapter-2.png)

Adding a weaker score leaves coverage unchanged only when the final scores are held fixed. In a complete request, adding an option can alter state refinement and thus the scores themselves. Even fixed coverage does not guarantee an unchanged open-set winner: competition redistributes the covered mass. Closed Choice uses the conditional distribution; open Choice compares the joint candidate probabilities with null, which wins an exact tie. Noul is the Boolean interface and returns the positive candidate’s conditional probability—it is not null. Score returns the conditional-probability-weighted mean of supplied numeric rubric values.

### Reuse the memory, recompute the judgment

The reusable object contains more than an encoded option vector: it also stores that option’s projected keys and values for each decision layer. Jeva has a complete-tuple cache and, in hybrid mode, a per-option cache. The latter lets a newly assembled candidate set reuse computations even when its tuple has never appeared before. The illustrative trace starts with three cold options, repeats their ordered tuple for a new request, replaces one option, then assembles another entirely reusable combination. A complete-tuple hit bypasses the per-option lookup; the two cache counters describe different events.

{% viz scene="books/jeva-fresh-decisions/chapter-3" section="chapter-3-reusable-option-memory" cue="0" from="0.000" to="85.821" title="Reuse the options, decide again" %}
{% endviz %}

![Chapter 3: Reuse the options, decide again](/generated/jeva-fresh-decisions/blog/chapter-3.png)

State encoding and decision refinement still run for every request. Cache keys follow tokenized typed option text, and equivalence requires unchanged weights, tokenizer, templates, length policy, and numerical configuration. Both caches are bounded by entries and tensor bytes, with least recently used eviction. More candidates still cost more gathering, attention, scoring, and output work; bounded encoder batches do not remove individual-text limits or make cache limits a bound on all device memory.

The main sources are the [Jeva v1 paper](https://arxiv.org/html/2610.18773v1) and the [official implementation at f231c9ac](https://github.com/LiQiiiii/Jeva/tree/f231c9ac31ba72f2ca4ca8aac662b279f3438fdb), especially the [decision stack](https://github.com/LiQiiiii/Jeva/blob/f231c9ac31ba72f2ca4ca8aac662b279f3438fdb/src/jeva/_runtime/matrix_decision.py), [inference cache orchestration](https://github.com/LiQiiiii/Jeva/blob/f231c9ac31ba72f2ca4ca8aac662b279f3438fdb/src/jeva/inference.py), and [runtime limits](https://github.com/LiQiiiii/Jeva/blob/f231c9ac31ba72f2ca4ca8aac662b279f3438fdb/docs/runtime.md). The chapter source page ties each spoken claim to these sources. No benchmark has been independently reproduced for this explainer.




Paper identity: **arXiv:2610.18773** (v1); DOI 10.48550/arXiv.2610.18773. Selected from [Hugging Face Daily Papers for 2026-10-14](https://huggingface.co/papers/date/2026-10-14) at rank 1 with 272 observed upvotes. [Hugging Face paper](https://huggingface.co/papers/2610.18773). [Canonical paper](https://arxiv.org/abs/2610.18773). [Official code repository](https://github.com/LiQiiiii/Jeva).

[Watch all three narrated chapters](?bundle=jeva-fresh-decisions).
