# Decisions Become Actions

Turning a model choice into a checked browser move. Book 3 of *From RLCD to Predictive Tab*.

This book follows the public Jev Ultrafast implementation through an illustrative flight-search example. The page values demonstrate the mechanism; they are not a recorded benchmark.

Source: [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast/tree/1231850a0bf1a0c0341fe408ef1668dbbfdfac46), inspected September 18, 2026. The source implements the browser loop and TypeSafe client, not the remote model service internals.

### Visible controls become numbered choices

Jev reads visible controls and page text in one DOM snapshot. The model sees numbered descriptions, while the browser retains references to the actual nodes. The flight form shown here is an illustrative teaching example.

{% viz scene="books/decisions-become-actions/chapter-1" section="chapter-1-visible-controls-become-numbered-choices" cue="1" from="0.000" to="41.540" title="Visible controls become numbered choices" %}
{% endviz %}

### Each operation gets compatible targets

The action-space builder groups actions by observed element, then creates separate target sets for clicking, typing, and native selection. A new observation rebuilds the menu when suggestions or other controls appear.

{% viz scene="books/decisions-become-actions/chapter-1" section="chapter-1-each-operation-gets-compatible-targets" cue="5" from="41.540" to="82.106" title="Each operation gets compatible targets" %}
{% endviz %}

### Ask conditional questions together

One TypeSafe request carries the shared page state, an operation question, and target questions for the operations available on this page. A typing target can be selected conditionally before the operation answer is known.

{% viz scene="books/decisions-become-actions/chapter-2" section="chapter-2-ask-conditional-questions-together" cue="1" from="0.000" to="40.554" title="Ask conditional questions together" %}
{% endviz %}

### Only the matching answer can execute

If the operation is TYPE_TEXT, only the type_text_target answer selects an action. Unused target answers do not trigger browser input. The client validates the selected choice and maps its index back to an observed action; the remote service's inference implementation is outside this repository.

{% viz scene="books/decisions-become-actions/chapter-2" section="chapter-2-only-the-matching-answer-can-execute" cue="5" from="40.554" to="81.503" title="Only the matching answer can execute" %}
{% endviz %}

### Generate a value only when typing

A separate text helper receives the goal, field, page context, and recent actions. Its result must be a valid object with one nonempty bounded text value. Click and select actions already contain their observed targets and do not call this helper.

{% viz scene="books/decisions-become-actions/chapter-3" section="chapter-3-generate-a-value-only-when-typing" cue="1" from="0.000" to="27.899" title="Generate a value only when typing" %}
{% endviz %}

### Recheck the page before input

The executor rejects stale decisions and resolves the retained node's current geometry and occlusion. A stale retry can reuse generated text only when the entire helper input is unchanged.

{% viz scene="books/decisions-become-actions/chapter-3" section="chapter-3-recheck-the-page-before-input" cue="4" from="27.899" to="55.971" title="Recheck the page before input" %}
{% endviz %}

### Observe what the action actually changed

Execution is logged before the post-action observation. The browser briefly waits for useful state, such as autocomplete suggestions, then builds the next menu. DONE stops the agent loop; independent outcome verification establishes whether the task succeeded.

{% viz scene="books/decisions-become-actions/chapter-3" section="chapter-3-observe-what-the-action-actually-changed" cue="7" from="55.971" to="85.682" title="Observe what the action actually changed" %}
{% endviz %}

Implementation references: [action-space and model requests](https://github.com/browser-use/jev-ultrafast/blob/1231850a0bf1a0c0341fe408ef1668dbbfdfac46/jev_ultrafast/model.py), [agent loop](https://github.com/browser-use/jev-ultrafast/blob/1231850a0bf1a0c0341fe408ef1668dbbfdfac46/jev_ultrafast/agent.py), and [browser execution](https://github.com/browser-use/jev-ultrafast/blob/1231850a0bf1a0c0341fe408ef1668dbbfdfac46/jev_ultrafast/browser.py).

[Open the complete book](?bundle=decisions-become-actions)
