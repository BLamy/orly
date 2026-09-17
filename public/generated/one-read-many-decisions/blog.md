# One Read, Many Decisions

Inside Qwen-RLCD generation. Book 2 of *From RLCD to Predictive Tab*.

This series explains a proposed product grounded in the project charter. Page examples and work diagrams are illustrative; they are not measured performance results.

Source note: the narration is pinned to the September 16, 2026 source snapshot. References to the imported native implementation describe that snapshot; subsequent foundation work may have advanced.

### An answer advances along a token tape

The support-note fixture asks for topic and urgency. In ordinary autoregressive generation, every new token extends the context for the next step. Some tokens carry decisions; others spell the structure around them.

{% viz scene="books/one-read-many-decisions/chapter-1" section="chapter-1-an-answer-advances-along-a-token-tape" cue="1" from="0.000" to="45.200" title="An answer advances along a token tape" %}
{% endviz %}

### Caching does not remove output dependencies

The ordinary decoder already reuses cached computation. A grammar can constrain valid output, but the decoder still advances through its output sequence. The proposed alternative targets that sequential decision work rather than pretending the baseline rereads the full input each time.

{% viz scene="books/one-read-many-decisions/chapter-1" section="chapter-1-caching-does-not-remove-output-dependencies" cue="5" from="45.200" to="91.800" title="Caching does not remove output dependencies" %}
{% endviz %}

### Prefill builds reusable context state

One logical shared prefill processes the note and common instructions. Transformer key/value state carries reusable context into subsequent computations; it is not a natural-language summary. Topic and urgency suffixes can then ask different questions of that shared context.

{% viz scene="books/one-read-many-decisions/chapter-2" section="chapter-2-prefill-builds-reusable-context-state" cue="1" from="0.000" to="45.200" title="Prefill builds reusable context state" %}
{% endviz %}

### Branches still have real costs

Each branch needs its own valid continuation state. Long inputs still consume computation and memory, and sharing the logical context does not establish zero-copy storage. The implementation must account for actual allocations, copies, and completed model work.

{% viz scene="books/one-read-many-decisions/chapter-2" section="chapter-2-branches-still-have-real-costs" cue="5" from="45.200" to="92.200" title="Branches still have real costs" %}
{% endviz %}

### Batch the independent field questions

A real model batch carries the field suffixes together. Unequal lengths require correct padding, attention masks, and token positions so each branch sees exactly its permitted context. Choice scores follow an explicit policy, with extra continuation when a choice is not resolved.

{% viz scene="books/one-read-many-decisions/chapter-3" section="chapter-3-batch-the-independent-field-questions" cue="1" from="0.000" to="44.000" title="Batch the independent field questions" %}
{% endviz %}

### Software constructs the typed result

Once values are selected, code supplies field names, punctuation, exact enum labels, and actual booleans. Independent classification fields can share this path; dependent decisions need an explicit dependency rather than a claim of independence.

{% viz scene="books/one-read-many-decisions/chapter-3" section="chapter-3-software-constructs-the-typed-result" cue="5" from="44.000" to="88.600" title="Software constructs the typed result" %}
{% endviz %}

### A shared token prefix is not a complete decision

The paths [17], [17,42], and [17,91] are schematic teaching fixtures, not Qwen tokenization. One path ends at the shared prefix while two continue. A faithful implementation must retain the completed choice and perform the remaining work for unresolved alternatives.

{% viz scene="books/one-read-many-decisions/chapter-4" section="chapter-4-a-shared-token-prefix-is-not-a-complete-decision" cue="1" from="0.000" to="47.600" title="A shared token prefix is not a complete decision" %}
{% endviz %}

### Correctness and honest accounting define the port

Branch isolation, scoring semantics, and a complete forward-call ledger are part of the intended contract. Raw ranking scores are not calibrated confidence. The native 1.5B reference still has known correctness/reporting work, and the current browser grammar-constrained demo does not yet implement faithful RLCD.

{% viz scene="books/one-read-many-decisions/chapter-4" section="chapter-4-correctness-and-honest-accounting-define-the-port" cue="5" from="47.600" to="105.400" title="Correctness and honest accounting define the port" %}
{% endviz %}

The project charter and its dated scope decision distinguish the native Qwen reference, the current browser prototype, and the planned product. Source anchors and the fixed narration contract are retained with this series’s source files.

[Open the complete book](?bundle=one-read-many-decisions)
