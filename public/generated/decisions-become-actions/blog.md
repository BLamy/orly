# Decisions Become Actions

Turning a model choice into a checked browser move. Book 3 of *From RLCD to Predictive Tab*.

This series explains a proposed product grounded in the project charter. Page examples and work diagrams are illustrative; they are not measured performance results.

Source note: the narration is pinned to the September 16, 2026 source snapshot. References to the imported native implementation describe that snapshot; subsequent foundation work may have advanced.

### A menu tied to this moment

The proposed browser adapter observes the page and creates joint target/action candidates. Each candidate is tied to the current page, frame, and observation version. A model ranks supported moves in the context of the task and recent history.

{% viz scene="books/decisions-become-actions/chapter-1" section="chapter-1-a-menu-tied-to-this-moment" cue="1" from="0.000" to="36.293" title="A menu tied to this moment" %}
{% endviz %}

### The inventory can miss the useful move

A legal action is not necessarily a helpful one, and a ranker cannot select a target its inventory never found. Coverage and ranking accuracy need separate evaluation, with an explicit path for uncertainty or unsupported actions.

{% viz scene="books/decisions-become-actions/chapter-1" section="chapter-1-the-inventory-can-miss-the-useful-move" cue="5" from="36.293" to="69.985" title="The inventory can miss the useful move" %}
{% endviz %}

### Resolve the chosen target against the live page

The decision refers to an observed target; code supplies a locator recipe from live evidence. Names, roles, and stable identifiers can help, but uniqueness and actionability still require checks before dispatch.

{% viz scene="books/decisions-become-actions/chapter-2" section="chapter-2-resolve-the-chosen-target-against-the-live-page" cue="1" from="0.000" to="38.476" title="Resolve the chosen target against the live page" %}
{% endviz %}

### A stale decision sends us back to observation

A rerender or dialog can invalidate a previously useful target. The executor rejects stale or ambiguous choices, then observes the result after one checked action. A successful click alone does not establish that the task advanced.

{% viz scene="books/decisions-become-actions/chapter-2" section="chapter-2-a-stale-decision-sends-us-back-to-observation" cue="5" from="38.476" to="75.836" title="A stale decision sends us back to observation" %}
{% endviz %}

### Arguments carry their own provenance

Choosing a field does not supply the value to enter. In the recurring example, Brett comes directly from the explicit task. Bounded choices and genuinely generated text take separate validated paths.

{% viz scene="books/decisions-become-actions/chapter-3" section="chapter-3-arguments-carry-their-own-provenance" cue="1" from="0.000" to="33.553" title="Arguments carry their own provenance" %}
{% endviz %}

### Act within the current instruction and environment

The extension's focus integration and a native Playwright runner have different capabilities. Page text cannot grant new authority, and future page states are not known in advance. Each executed action must be followed by observation.

{% viz scene="books/decisions-become-actions/chapter-3" section="chapter-3-act-within-the-current-instruction-and-environment" cue="5" from="33.553" to="66.641" title="Act within the current instruction and environment" %}
{% endviz %}

The project charter and its dated scope decision distinguish the native Qwen reference, the current browser prototype, and the planned product. Source anchors and the fixed narration contract are retained with this series’s source files.

[Open the complete book](?bundle=decisions-become-actions)
