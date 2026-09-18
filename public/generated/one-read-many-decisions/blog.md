# One Read, Many Decisions

Inside Qwen-RLCD generation. Book 2 of *From RLCD to Predictive Tab*.

This book explains shared context, batched decisions, token-path continuation, and explicit scoring. Token paths and score values are illustrative rather than measured results.

Source note: the mechanism explanation uses the September 16, 2026 Qwen-RLCD source snapshot. The final chapter ends with the distinction between ranking scores and calibrated confidence.

### An answer advances along a token tape

The support-note fixture asks for topic and urgency. In ordinary autoregressive generation, every new token extends the context for the next step. Some tokens carry decisions; others spell the structure around them.

{% viz scene="books/one-read-many-decisions/chapter-1" section="chapter-1-an-answer-advances-along-a-token-tape" cue="1" from="0.000" to="34.145" title="An answer advances along a token tape" %}
{% endviz %}

### Caching does not remove output dependencies

The ordinary decoder already reuses cached computation. A grammar can constrain valid output, but the decoder still advances through its output sequence. The proposed alternative targets that sequential decision work rather than pretending the baseline rereads the full input each time.

{% viz scene="books/one-read-many-decisions/chapter-1" section="chapter-1-caching-does-not-remove-output-dependencies" cue="5" from="34.145" to="69.938" title="Caching does not remove output dependencies" %}
{% endviz %}

### Prefill builds reusable context state

One logical shared prefill processes the note and common instructions. Transformer key/value state carries reusable context into subsequent computations; it is not a natural-language summary. Topic and urgency suffixes can then ask different questions of that shared context.

{% viz scene="books/one-read-many-decisions/chapter-2" section="chapter-2-prefill-builds-reusable-context-state" cue="1" from="0.000" to="31.695" title="Prefill builds reusable context state" %}
{% endviz %}

### Branches still have real costs

Each branch needs its own valid continuation state. Long inputs still consume computation and memory, and sharing the logical context does not establish zero-copy storage. The implementation must account for actual allocations, copies, and completed model work.

{% viz scene="books/one-read-many-decisions/chapter-2" section="chapter-2-branches-still-have-real-costs" cue="5" from="31.695" to="65.435" title="Branches still have real costs" %}
{% endviz %}

### Batch the independent field questions

A real model batch carries the field suffixes together. Unequal lengths require correct padding, attention masks, and token positions so each branch sees exactly its permitted context. Choice scores follow an explicit policy, with extra continuation when a choice is not resolved.

{% viz scene="books/one-read-many-decisions/chapter-3" section="chapter-3-batch-the-independent-field-questions" cue="1" from="0.000" to="32.996" title="Batch the independent field questions" %}
{% endviz %}

### Software constructs the typed result

Once values are selected, code supplies field names, punctuation, exact enum labels, and actual booleans. Independent classification fields can share this path; dependent decisions need an explicit dependency rather than a claim of independence.

{% viz scene="books/one-read-many-decisions/chapter-3" section="chapter-3-software-constructs-the-typed-result" cue="5" from="32.996" to="67.199" title="Software constructs the typed result" %}
{% endviz %}

### A shared token prefix is not a complete decision

The paths [17], [17,42], and [17,91] are schematic teaching fixtures, not Qwen tokenization. One path ends at the shared prefix while two continue. A faithful implementation must retain the completed choice and perform the remaining work for unresolved alternatives.

{% viz scene="books/one-read-many-decisions/chapter-4" section="chapter-4-a-shared-token-prefix-is-not-a-complete-decision" cue="1" from="0.000" to="36.770" title="A shared token prefix is not a complete decision" %}
{% endviz %}

### A ranking score is not calibrated confidence

Normalizing the allowed choices produces a ranking, not evidence that the selected answer will be correct that often. Measured reliability is a separate question.

{% viz scene="books/one-read-many-decisions/chapter-4" section="chapter-4-a-ranking-score-is-not-calibrated-confidence" cue="5" from="36.770" to="45.900" title="A ranking score is not calibrated confidence" %}
{% endviz %}

Source anchors and the revised narration contract are retained with this series's source files.

[Open the complete book](?bundle=one-read-many-decisions)
