# Jev Ultrafast revision

Requested September 18, 2026: end book 2 chapter 4 before the app-status
commentary, and make book 3 explain Jev Ultrafast concretely.

Public source: https://github.com/browser-use/jev-ultrafast/tree/1231850a0bf1a0c0341fe408ef1668dbbfdfac46

## Mechanisms shown

- `snapshot.js`: one observation collects visible controls and text, retaining
  real DOM node references in the page cache.
- `model.py:action_space`: groups actions by node; assigns observation-local
  element indices; creates compatible target sets for CLICK, TYPE_TEXT, and
  SELECT. Native select options have element-and-option indices.
- `model.py:choose`: sends the shared page, elements, and recent history with
  an operation question and conditional target questions in one TypeSafe
  request. Only the selected operation's target head is consumed.
- `model.py:validate_choice`: validates membership, finite bounded probability
  data, normalization tolerance, and that the chosen item is maximal.
- `model.py:field_context,field_text`: only typing invokes the separate helper;
  its response must contain exactly one nonempty text string, at most 2,000
  characters. No field strings are hardcoded by the executor.
- `agent.py:Agent.command`: consumes a decision once before mutation; retries
  stale decisions with fresh observations; reuses generated text only when the
  entire helper input matches; logs execution before post-action observation.
- `browser.py:Browser.fresh,browser_operation`: rechecks freshness, retained
  node eligibility, current geometry, and occlusion before dispatching input.
  Click/select use page and target guards; other freshness checks use a marker.
- `browser.py:Browser.observe`: post-input settling occurs after execution was
  logged. Combobox typing waits for useful suggestions, capped at 200 ms;
  other interactions wait at most two frames or 50 ms.

The flight form and numbered values are teaching fixtures, not a captured
benchmark. The public repository calls the TypeSafe service; it does not
establish the service's internal inference algorithm. DONE terminates the
agent loop and is not independent evidence of task success.

## Book 2 cutoff

The removed sixth caption begins at 45.965 seconds in the existing ElevenLabs
recording. The requested endpoint is 45.900 seconds, retaining the first five
captions and ending after the ranking-versus-calibration explanation.
