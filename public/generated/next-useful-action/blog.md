# The Next Useful Action

A product vision for a browser that keeps up. Book 1 of *From RLCD to Predictive Tab*.

This series explains a proposed product grounded in the project charter. Page examples and work diagrams are illustrative; they are not measured performance results.

Source note: the narration is pinned to the September 16, 2026 source snapshot. References to the imported native implementation describe that snapshot; subsequent foundation work may have advanced.

### The work between useful actions

The fictional task is simple: change a display name to Brett. Finding Profile, locating the field, editing it, and finding Save still require attention. The work ribbon represents that sequence without asserting measured latency.

{% viz scene="books/next-useful-action/chapter-1" section="chapter-1-the-work-between-useful-actions" cue="1" from="0.000" to="33.727" title="The work between useful actions" %}
{% endviz %}

### A suggestion and an authorized action

The proposed fast path chooses among useful moves available in the current page state. Predictive focus offers a target that a person can accept; an authorized executor can perform a checked action and observe its result. Both must earn their place through completed-task evaluation.

{% viz scene="books/next-useful-action/chapter-1" section="chapter-1-a-suggestion-and-an-authorized-action" cue="5" from="33.727" to="68.266" title="A suggestion and an authorized action" %}
{% endviz %}

### A page bounds the choice

A live observation supplies a menu of eligible joint target/action candidates. A disabled Save control is not a ready action. Page context, interaction history, and an explicit task can change the useful choice even when the visible controls stay the same.

{% viz scene="books/next-useful-action/chapter-2" section="chapter-2-a-page-bounds-the-choice" cue="1" from="0.000" to="36.258" title="A page bounds the choice" %}
{% endviz %}

### Legal does not mean useful

Constraining the answer simplifies validation, but a perfectly legal target may still be wrong for the task. The proposed system needs abstention and a route for missing candidates. Reduced output is a mechanism to investigate, not evidence of an end-to-end speedup.

{% viz scene="books/next-useful-action/chapter-2" section="chapter-2-legal-does-not-mean-useful" cue="5" from="36.258" to="70.682" title="Legal does not mean useful" %}
{% endviz %}

### Different objectives share an observation

Predictive focus asks where a person is likely to go next. Task automation asks which action advances an explicit instruction. These experiences can reuse observations, candidate construction, ranking, and live-target checks while retaining different success criteria.

{% viz scene="books/next-useful-action/chapter-3" section="chapter-3-different-objectives-share-an-observation" cue="1" from="0.000" to="34.076" title="Different objectives share an observation" %}
{% endviz %}

### Build the foundation before claiming the product

The Qwen decision engine is the starting point. Browser actions, eligible recording ingestion, training, and evaluation are proposed milestones in the project charter. Each stage must produce inspectable evidence before the destination can be called a working product.

{% viz scene="books/next-useful-action/chapter-3" section="chapter-3-build-the-foundation-before-claiming-the-product" cue="5" from="34.076" to="70.172" title="Build the foundation before claiming the product" %}
{% endviz %}

The project charter and its dated scope decision distinguish the native Qwen reference, the current browser prototype, and the planned product. Source anchors and the fixed narration contract are retained with this series’s source files.

[Open the complete book](?bundle=next-useful-action)
