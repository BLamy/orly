# Recordings Become Practice

How browser history becomes a training dataset. Book 4 of *From RLCD to Predictive Tab*.

This series explains a proposed product grounded in the project charter. Page examples and work diagrams are illustrative; they are not measured performance results.

Source note: the narration is pinned to the September 16, 2026 source snapshot. References to the imported native implementation describe that snapshot; subsequent foundation work may have advanced.

### Stop the recording before the answer happens

A training input contains only the page state and history available immediately before the labeled action. rrweb and Replay require source-specific adapters; neither is automatically evidence of a successful task or a known intention.

{% viz scene="books/recordings-become-practice/chapter-1" section="chapter-1-stop-the-recording-before-the-answer-happens" cue="1" from="0.000" to="40.391" title="Stop the recording before the answer happens" %}
{% endviz %}

### Keep future effects out of the features

The click, its resulting focus, and any success message belong after the prediction boundary. Unknown goals remain unknown. Action labels, goal provenance, observed outcomes, and data-quality evidence remain separate fields.

{% viz scene="books/recordings-become-practice/chapter-1" section="chapter-1-keep-future-effects-out-of-the-features" cue="5" from="40.391" to="77.275" title="Keep future effects out of the features" %}
{% endviz %}

### Turn bounded raw events into traceable examples

The proposed local workflow stores eligible recordings separately from compact derived examples. Extraction versions and source lineage make it possible to correct inputs, delete data, and identify affected model artifacts.

{% viz scene="books/recordings-become-practice/chapter-2" section="chapter-2-turn-bounded-raw-events-into-traceable-examples" cue="1" from="0.000" to="39.765" title="Turn bounded raw events into traceable examples" %}
{% endviz %}

### Seal the evaluation boundary before learning

Related sessions and copied templates must not leak across dataset splits. Development and calibration support iteration; a final held-out partition tests the selected system. New sites and later sessions expose failures that memorized layouts can hide.

{% viz scene="books/recordings-become-practice/chapter-2" section="chapter-2-seal-the-evaluation-boundary-before-learning" cue="5" from="39.765" to="77.694" title="Seal the evaluation boundary before learning" %}
{% endviz %}

### Start with a small ranking problem

Counts and a linear ranker establish whether the dataset carries useful signal. A learned policy scores the legal candidate menu from causal page features, recent history, and a task when one is actually known.

{% viz scene="books/recordings-become-practice/chapter-3" section="chapter-3-start-with-a-small-ranking-problem" cue="1" from="0.000" to="36.188" title="Start with a small ranking problem" %}
{% endviz %}

### Learning changes weights; decoding changes how answers emerge

Teacher labels require auditing. The initial training process can run natively on a Mac, with a compact model exported and checked for browser inference parity. Training a foundation model inside Chrome is not a prerequisite.

{% viz scene="books/recordings-become-practice/chapter-3" section="chapter-3-learning-changes-weights-decoding-changes-how-answers-emerge" cue="5" from="36.188" to="71.657" title="Learning changes weights; decoding changes how answers emerge" %}
{% endviz %}

The project charter and its dated scope decision distinguish the native Qwen reference, the current browser prototype, and the planned product. Source anchors and the fixed narration contract are retained with this series’s source files.

[Open the complete book](?bundle=recordings-become-practice)

Primary reference: [rrweb recording and replay guide](https://github.com/rrweb-io/rrweb/blob/main/guide.md). Replay ingestion, local storage choices, and training/export are proposed in the pinned charter, not established by that guide.
