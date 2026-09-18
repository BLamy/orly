# From RLCD to Predictive Tab

A six-part product-vision series for Orly.

**Script:** written by Codex in the originating conversation. **Visualization assignment:** Claude Fable 5.1, using Orly’s D3 scene framework.

This is a proposed product architecture grounded in the Qwen-RLCD charter, with the current prototype and its limitations identified. All example pages, scores, and timing illustrations are synthetic; this script reports no measured speedup.

The numbered lines below are the exact spoken captions. Visual directions, source references, and chapter status labels are not narration.

6 books · 19 chapters · 150 captions · 3,669 spoken words. Revised September 18, 2026 at user request.

## Series order

| Part | Title | Focus |
| --- | --- | --- |
| 1 | The Next Useful Action | A product vision for a browser that keeps up |
| 2 | One Read, Many Decisions | Inside Qwen-RLCD generation |
| 3 | Decisions Become Actions | Turning a model choice into a checked browser move |
| 4 | Recordings Become Practice | How browser history becomes a training dataset |
| 5 | A Fast Path with a Thoughtful Fallback | How a small policy and GLM can work together |
| 6 | Tab Into the Future | A browser that meets you halfway |

## 1. The Next Useful Action

A product vision for a browser that keeps up

Begin with a familiar browser task, then reveal why predicting a bounded next action might feel faster than generating a whole instruction. Establish assistive focus and goal-directed automation as separate experiences.

### 1.1 — The pause between intention and action

**Status:** Product vision.

**Takeaway:** The opportunity is to shorten the distance from intention to a useful, verified action.

**Spoken script**

1. Think about changing your display name on a website you already know. The task is small, but your attention still has to travel.
2. Find the profile menu. Find the right field. Make the edit. Find save. Most of the effort lives between those little actions.
3. A browser assistant could help by understanding the task and choosing the next useful move. The interesting question is how quickly it can do that reliably.
4. Today, one possible approach asks a language model to describe an action, sends that answer to an executor, and waits for the page to respond.
5. Our product vision adds another route: recognize a familiar situation and select from the useful actions available on the page right now.
6. For a person, that might look like a subtle suggestion beside the next field. Pressing Tab would move focus there when the person accepts.
7. For an authorized agent, the same kind of decision could become a checked browser action, followed by a fresh look at the result.
8. These are proposed experiences. The project has to earn them by showing that people finish useful tasks faster, with mistakes kept within a declared budget.

**Visual direction**

A persistent fictional profile page and a ribbon of elapsed work. The pointer, focus ring, and task state are separate objects.

- Show the goal: change a display name to Brett.
- Trace a person finding Profile, then the name field, then Save.
- Stretch the pauses between useful actions.
- Let a suggested focus ring approach the next control.
- Pull back to distinguish suggesting from acting.

**Source anchors:** charter: Mission; charter: Browser-action invariants 2, 4, 10.

### 1.2 — A small decision inside a large world

**Status:** Mechanism and product hypothesis.

**Takeaway:** Constrain the decision space without confusing a valid answer with a correct answer.

**Spoken script**

1. A language model can write almost anything. A particular browser page usually offers a much smaller set of useful moves at a particular moment.
2. That difference creates an opportunity. We can turn the page into a menu of legal choices and ask a model to rank that menu.
3. One choice might be opening the profile menu. Another might be focusing the name field. A disabled save button should not masquerade as a ready action.
4. The model still needs context. The page, recent interactions, and an explicit task can change which choice makes sense, even when the buttons look identical.
5. A smaller answer space can reduce unnecessary output and make validation easier. Whether it makes the whole experience faster is something we must measure.
6. There is an important distinction here: an answer can be perfectly legal and completely wrong. A valid button is not automatically the right button.
7. The system therefore needs a way to say it is unsure, and a way to notice when the useful action is missing from its menu.
8. The product promise is a shorter path to a useful decision, with a clear escape route when that decision is beyond the fast path.

**Visual direction**

An open-ended token ribbon folds into a tray of legal action tiles while the live page remains the anchor.

- Grow an unconstrained ribbon of possible text.
- Extract visible, eligible controls from the page.
- Form joint target/action tiles.
- Highlight a valid but wrong tile, then the useful tile.
- Add an explicit unsure route.

**Source anchors:** charter: Mission; charter: Browser-action invariants 1–3, 9.

### 1.3 — Two experiences, one foundation

**Status:** Product vision and current scope.

**Takeaway:** Predicting a person’s next target and executing a stated task share infrastructure but have different objectives.

**Spoken script**

1. We are describing two related products. One helps a person move through a page. The other helps an agent carry out a stated task.
2. Predictive focus asks where this person is likely to go next. It can be useful even when the system does not know the person's complete goal.
3. Task automation asks which action advances a particular instruction. The most common next click may be a poor answer to that different question.
4. Both experiences can share page observations, candidate construction, a small ranking model, and checks that a chosen target still exists.
5. They need different evidence of success. A helpful focus suggestion is judged by useful acceptance; an autonomous workflow is judged by what it actually accomplishes.
6. The current project starts lower in the stack, with Qwen and a constrained decision engine. The browser action and learning systems are the destination.
7. We will first make that foundation correct, then connect live actions, eligible recordings, training, and evaluation. Each step should produce something we can inspect.
8. To understand why this path might work, we need to open the decision engine and watch how it produces an answer.

**Visual direction**

One page splits into two synchronized lenses: an assistive focus lens and a task-progress lens, then reunites over shared observation.

- Keep the same profile page under both lenses.
- Human lens predicts a focus target from history.
- Agent lens conditions on a stated goal.
- Reconnect observation, candidates, and ranking.
- Show the foundation-to-product roadmap with proposed stages labeled.

**Source anchors:** charter: Who and what we are building for; charter: Milestones and success criteria.

## 2. One Read, Many Decisions

Inside Qwen-RLCD generation

Explain ordinary autoregressive output, shared-context prefill, independent batched field queries, permitted-token scoring, collision continuation, and direct typed assembly. Distinguish the intended corrected algorithm from the current native reference and browser prototype.

### 2.1 — Why writing an answer takes steps

**Status:** Established mechanism; illustrative animation.

**Takeaway:** Autoregressive generation repeatedly extends output; structured formatting alone does not remove those steps.

**Spoken script**

1. Imagine a short support note. We want to classify its topic and its urgency, using a fixed set of possible answers for each field.
2. A conventional language model first processes the input, then generates an answer a token at a time. Tokens are pieces of text, not necessarily whole words.
3. Each generated token becomes part of the context for what comes next. That creates a sequence of model steps along the output tape.
4. Some tokens express the actual decisions. Others spell field names, quotation marks, or the punctuation that makes the answer a valid data object.
5. A normal decoder already caches earlier computation. The comparison is not between remembering everything and rereading the entire prompt from scratch on every token.
6. Even with that cache, the next output token usually depends on the output that came before it. The sequence still has to advance.
7. A grammar can restrict the output to valid structure. That helps formatting, but it does not by itself turn the decoder into parallel field selection.
8. Our question is more specific: if we already know the fields and the permitted answers, which parts of this writing process can we replace with decisions?

**Visual direction**

A token tape grows through a model window. Existing context remains as a cache rather than being erased and reread.

- Read a short fictional support note.
- Generate a small JSON answer as a token tape.
- Illuminate output dependencies one position at a time.
- Keep the ordinary decoder cache visible.
- Mark the fields that actually carry decisions.

**Source anchors:** native-engine: run_naive_generation; charter: Qwen foundation invariants.

### 2.2 — Read the shared context once

**Status:** Intended RLCD contract, grounded in native reference.

**Takeaway:** A single logical prefill produces reusable context state; reuse has real compute and memory costs.

**Spoken script**

1. The first stage is called prefill. The model processes the shared input and builds internal state that later computations can reuse.
2. In a transformer, part of that state is a cache of keys and values. Think of it as reusable context, rather than a summary written in ordinary language.
3. For our support note, the text and the common instructions belong in that shared context. The model should not need a separate full reading for every field.
4. The constrained engine performs one logical shared prefill, then prepares a short question for each field we want to classify.
5. One branch asks for the topic. Another asks for urgency. Both start from the same common context, but each has its own question and continuation state.
6. This reuse does not make the input free. A long page can still be expensive to process, and the stored state can consume substantial memory.
7. It also does not guarantee that memory is shared without copies. The implementation must measure how it stores and supplies that state to each branch.
8. The gain we are investigating comes from organizing the work around the decisions we need, while accounting honestly for the work that remains.

**Visual direction**

The support-note token tape becomes a layered cache matrix. A common trunk remains visible as query branches appear.

- Highlight the input and schema as shared context.
- Transform token positions into a cache matrix.
- Label prefill and key/value state on screen.
- Branch two field queries from the same context.
- Show real memory allocations without implying zero-copy sharing.

**Source anchors:** native-engine: run_parallel_generation; charter: Qwen foundation invariants 1–3; charter: Reference and architecture decisions.

### 2.3 — Ask together, assemble in code

**Status:** Intended RLCD contract.

**Takeaway:** Batch independent field suffixes, score permitted choices, and construct the result without generating JSON syntax.

**Spoken script**

1. The next stage places the field questions in a real model batch. Several rows travel through the model together, instead of becoming unrelated chat requests.
2. Those rows may have different lengths. Padding, attention masks, and token positions must preserve what each branch is actually allowed to see.
3. At a decision position, the model produces scores over possible next tokens. The engine examines the permitted choices under an explicit scoring rule.
4. For a simple unambiguous choice, that may be enough to select a value. Some choices require more work, which we will examine next.
5. Once the decisions are available, ordinary code builds the output object. It supplies the field names, punctuation, exact labels, and actual boolean values.
6. That is the central change: model computation selects values, while software constructs the structure around them. The model need not type that structure into existence.
7. Parallel fields only make sense when their decisions can use the same context without depending on each other's newly selected answer.
8. If choosing one field changes what another field is allowed to mean, we must represent that dependency instead of pretending the questions are independent.

**Visual direction**

A two-row query matrix enters a model window; permitted-choice bars emerge and selected values drop into a typed object frame.

- Use unequal field-query lengths with visible masked padding.
- Run the query rows as an actual batch.
- Expose candidate scores, dim disallowed vocabulary.
- Choose topic and urgency under a named policy.
- Assemble exact enum values and booleans in code.

**Source anchors:** native-engine: run_parallel_generation; schema: StructuredSchema.compile_parallel_metadata; charter: Qwen foundation invariants 2–6.

### 2.4 - The difficult cases reveal the contract

**Status:** Token continuation and scoring semantics.

**Takeaway:** Shared token prefixes require continuation and explicit scoring; normalized rankings are not calibrated confidence.

**Spoken script**

1. Suppose two allowed answers begin with the same token. Looking at that first token cannot tell us which complete answer the model should select.
2. We need to continue along the allowed token paths until the choice is resolved. An answer that ends at a shared prefix also needs an explicit ending rule.
3. The scoring contract matters here. Greedily following a permitted path is not automatically the same as comparing the full likelihood of every possible answer.
4. Every extra continuation is real model work. We count it, preserve the correct branch state, and refuse to hide an unresolved choice behind a convenient default.
5. The displayed score also needs an honest name. A normalized set of scores is not evidence that a choice will be correct that often in actual use.

**Visual direction**

Synthetic token paths form a prefix tree; only unresolved branches continue. A work ledger tracks prefill, batch, and continuation calls.

**Source anchors:** native-engine: run_parallel_generation collision branch; schema: StructuredSchema.compile_parallel_metadata; charter: Qwen foundation invariants 3–9.

## 3. Decisions Become Actions

Turning a model choice into a checked browser move

Follow Jev Ultrafast through an illustrative flight search: indexed observations, operation-specific target questions in one request, selective text generation, and guarded execution against retained DOM nodes.

### 3.1 - From the page to a numbered action space

**Status:** Public Jev Ultrafast implementation at 1231850a0bf1a0c0341fe408ef1668dbbfdfac46.

**Takeaway:** A fresh DOM snapshot becomes indexed elements and operation-compatible target sets tied to retained nodes.

**Spoken script**

1. Give Jev one goal: find a one-way flight from Zurich to London. To choose its next move, it first reads what the browser actually shows.
2. The browser runs one page script that collects visible controls, their labels, current values, and nearby text. Screenshots are optional, not the normal decision input.
3. The snapshot keeps references to the actual page elements. The model will receive numbered descriptions, while the executor retains the connection back to each real control.
4. Here, the origin is element one, the empty destination is element two, and ticket type is element three. These numbers describe this observation, not permanent identifiers.
5. The action-space builder groups actions by element. One text field can support both clicking and typing without becoming two separate elements in the table.
6. Each operation gets only compatible targets. Typing can choose editable fields; clicking can choose clickable controls; a native dropdown offers observed element-and-option pairs.
7. The request also includes the goal, visible page text, and recent actions. This lets the next choice depend on what already happened, including the current field values.
8. After an action changes the page, Jev observes again and rebuilds this menu. A new suggestion can become a target only after it actually appears.

**Visual direction**

Persistent illustrative flight form and numbered action table transformed through the actual implementation.

**Source anchors:** jev-ultrafast: snapshot.js; jev-ultrafast: model.py: action_space.

### 3.2 - One request, several questions, one action

**Status:** Public Jev Ultrafast implementation at 1231850a0bf1a0c0341fe408ef1668dbbfdfac46.

**Takeaway:** One request asks operation and conditional target questions; only the selected operation and matching target can execute.

**Spoken script**

1. A usual sequence would first ask what operation to perform, then ask which element to use. Jev puts both kinds of question into one request.
2. The shared state goes to the TypeSafe service with an operation question and separate target questions for clicking, typing, and selection when available.
3. Each target question is conditional: if we were going to type, which editable field would we choose? It can be answered before the operation result comes back.
4. Imagine the response chooses typing, with destination as the typing target. A click target may also be returned, but its answer is not an instruction to click.
5. The operation selects exactly one matching target answer. The other target answers are discarded for execution, so speculative questions do not become speculative browser actions.
6. The code checks that the selected answer belongs to the offered choices and that its probability data is valid. Invalid output stops before any browser input.
7. The selected index maps back to an action from the snapshot. The model does not invent a selector or coordinates, and its output is never executed as code.
8. This saves a sequential model round trip for choosing the operation and target. The repository calls a remote service; it does not expose that service's inference internals.

**Visual direction**

Persistent illustrative flight form and numbered action table transformed through the actual implementation.

**Source anchors:** jev-ultrafast: model.py: choose, validate_choice.

### 3.3 - Type, validate, act, observe again

**Status:** Public Jev Ultrafast implementation at 1231850a0bf1a0c0341fe408ef1668dbbfdfac46.

**Takeaway:** Typing uses a separate text helper; freshness and geometry checks precede input, then the next observation rebuilds the action space.

**Spoken script**

1. Choosing the destination field still leaves one question: what should we type? Only a typing action calls the separate text helper.
2. That helper receives the goal, selected field, page context, and recent actions. It returns a small object containing one text value, such as London.
3. The response must parse correctly and contain a nonempty bounded string. Clicking and selecting skip this generation step because their actions already came from the page.
4. Before input, the browser checks that the decision still applies. A changed document, form value, or target can invalidate the earlier observation.
5. If the page became stale while text was generated, Jev observes and chooses again. It reuses that text only when the complete helper input is unchanged.
6. For a click, the executor resolves the retained element's current geometry and checks that another element does not cover it. Old screen coordinates are not trusted.
7. After typing London, it records the action and briefly waits for useful suggestions before observing again. The London suggestion can now enter the next numbered menu.
8. The next cycle can choose that suggestion, then continue toward the goal. A done decision stops the loop, but a separate outcome check is needed to establish that the task succeeded.
9. The speed comes from structured observations, shared choice requests, and selective text generation. The complete loop remains observe, choose, validate, act, and observe again.

**Visual direction**

Persistent illustrative flight form and numbered action table transformed through the actual implementation.

**Source anchors:** jev-ultrafast: agent.py: Agent.command; jev-ultrafast: model.py: field_context, field_text; jev-ultrafast: browser.py: Browser.fresh, Browser.act, Browser.observe, browser_operation.

## 4. Recordings Become Practice

How browser history becomes a training dataset

Explain causal extraction from eligible Replay and rrweb recordings, local storage, provenance, held-out splits, behavior cloning, teacher labels, and local training/export. Historical recordings are observations, not counterfactual simulators.

### 4.1 — A recording is evidence of what happened

**Status:** Recording concepts and proposed ingestion.

**Takeaway:** Construct examples from the state before an action, preserving unknown intent and observed outcome.

**Spoken script**

1. A browser recording contains evidence of what happened. It does not automatically explain what the person wanted or whether their task succeeded.
2. An rrweb recording can describe a page through snapshots, changes, and interaction events. Replay recordings require their own adapter to the actual available format.
3. We should inspect those real sources before claiming what either pipeline captures. The extension linked in our initial research was not available for inspection.
4. To make one training example, move to the instant just before an action. Reconstruct only the page state and history available at that moment.
5. Then attach the action that followed as the label. Its later focus changes, updated styles, or success message must not sneak backward into the input.
6. Otherwise the model can appear excellent by reading clues created by the very action it is supposed to predict. That is a misleading shortcut.
7. When we know the task, record where that knowledge came from. When we do not, keep the goal unknown instead of inventing an intention.
8. The result is a careful example of state, available choices, observed action, and evidence about the outcome. That is the material a learning system can use.

**Visual direction**

A recording timeline has a movable prediction cursor. Information to its right becomes inaccessible to feature extraction.

- Reconstruct a synthetic page from a snapshot and changes.
- Stop immediately before the user action.
- Separate available features from future click and resulting focus.
- Attach action, goal provenance, and observed outcome.
- Mark goal unknown when no reliable instruction exists.

**Source anchors:** charter: Browser-action invariants 5–8; charter: E8 milestone; recording-source-status.

### 4.2 — A local workshop for examples

**Status:** Proposed local data pipeline.

**Takeaway:** Separate bounded raw recordings from versioned derived examples and partition data before model selection.

**Spoken script**

1. For a first local experiment, we can keep recordings and examples on the user's machine. The extension and a native training process can exchange versioned files.
2. The extension might use a browser database, while a native workflow might use a local database with compressed recording chunks. The choice follows the working prototype.
3. Raw recordings and training examples serve different purposes. We can retain raw data for a bounded period and keep compact, reproducible examples separately.
4. Each example needs a trail back to its source and the extraction rules. Deleting or correcting a source should tell us which derived artifacts need rebuilding.
5. Only eligible data belongs in the workshop. Unnecessary private inputs should be masked, and sending examples to a remote teacher must be an explicit choice.
6. Before training, group related sessions and duplicates so that near-identical behavior cannot appear on both sides of the evaluation boundary.
7. Keep development and calibration data separate from a sealed final test set. Later sessions and unfamiliar sites help reveal whether the model learned more than memorized layouts.
8. The value of a large recording collection comes from usable, representative examples. A mountain of unfiltered events is still a mountain of work.

**Visual direction**

A recording tape compacts into example cards, then fans into distinct training, development/calibration, and sealed test bins.

- Place eligible synthetic raw events into local storage.
- Extract compact observation/action examples.
- Keep lineage links to recording and extractor versions.
- Group duplicate sessions before the split.
- Seal the final test partition before training choices.

**Source anchors:** charter: Scope and boundaries; charter: Browser-action invariants 6–8; charter: Milestones and success criteria.

### 4.3 — Teach a small model a small job

**Status:** Proposed training strategy.

**Takeaway:** Learn candidate ranking with simple baselines first; use audited teacher signals and export a verified local policy.

**Spoken script**

1. Start with the smallest model that can teach us something. Counts and a simple linear ranker give us baselines before a neural network enters the picture.
2. For each example, the model sees the page features, recent history, optional task, and candidate menu. It assigns a score to each available choice.
3. Training compares those scores with the training target and adjusts the model's weights. Repeated examples shape which patterns it learns to recognize.
4. Observed actions can teach habitual behavior. Reviewed demonstrations and task outcomes are needed to judge whether those habits also help accomplish a stated goal.
5. A larger model can propose labels or preferences, but its answers are fallible. We audit that signal rather than calling every teacher judgment correct.
6. This is where learning happens. Constrained decoding changes how a model answers; training changes the behavior represented in the model's weights.
7. We can run this training in a native process on the Mac, then export a small model for browser inference and verify that its decisions remain consistent.
8. Training Qwen inside Chrome is not a prerequisite. The first win may be a much smaller policy that learns one useful ranking task well.

**Visual direction**

A candidate score surface changes over training steps, with held-out mistakes left visible. A checkpoint shrinks into a browser artifact.

- Start with frequency counts and a linear ranking baseline.
- Score all eligible candidates for one causal example.
- Compare ranking with an observed or reviewed target.
- Update weights across examples; keep validation separate.
- Export a model and compare browser/native predictions.

**Source anchors:** charter: E9 and E10 milestones; charter: Browser-action invariants 6, 9; charter: Scope and boundaries.

## 5. A Fast Path with a Thoughtful Fallback

How a small policy and GLM can work together

Describe the proposed GLM teacher/planner/fallback relationship, independently test constrained decoding feasibility at larger scale, and evaluate complete task success and latency with recovery included.

### 5.1 — Learn the familiar, escalate the unfamiliar

**Status:** Proposed hybrid architecture.

**Takeaway:** Use a small policy for supported decisions and an explicit large-model path for planning or fallback.

**Spoken script**

1. The proposed partnership gives the large and small models different jobs. A large model can help interpret a task, teach examples, or handle difficult situations.
2. A small local policy tries to recognize the familiar decisions cheaply. It receives the current context and selects from the supported action menu.
3. For a longer task, the larger model might propose a subgoal. The smaller policy can then choose the next checked move toward that subgoal.
4. When the fast path lacks enough support, it abstains. In an explicitly enabled hybrid mode, the system can ask the larger model for help.
5. That fallback has a cost: input processing, network travel, model computation, and possibly another round of observation. We include all of it in the measurements.
6. In local-only mode, uncertainty means stopping or asking the person to continue. It must not quietly become a remote inference request.
7. The user's proposed large model is G L M five point three Flash. We still need to pin the actual provider, served model, settings, and supported interfaces.
8. The aim is to concentrate expensive reasoning where it adds value, while testing whether routine decisions can move through a smaller, faster path.

**Visual direction**

The same candidate landscape is viewed first by a local ranker, then by a larger planning lens when the fast path abstains.

- Plan a bounded task with an optional GLM call.
- Pass subgoal and live candidates to a small policy.
- Execute one sufficiently supported checked choice.
- Make an uncertain state take an explicit fallback route.
- Show local-only mode abstaining without network traffic.

**Source anchors:** charter: Mission; charter: Who and what we are building for; charter: E9–E11 milestones.

### 5.2 — Can constrained decoding scale up?

**Status:** Conditional feasibility, not a performance claim.

**Takeaway:** A hosted structured-output endpoint is distinct from low-level RLCD access; a larger model still costs compute.

**Spoken script**

1. Could we apply the constrained decision idea to a larger model? Possibly, but the model's size is only one part of that question.
2. A hosted interface may accept a schema or a list of answers. That can provide a useful constrained baseline without exposing the internals needed by our engine.
3. True shared-prefill branching needs access to reusable model state, decision scores, positions, masks, and the ability to batch the relevant computations correctly.
4. Those controls depend on the actual runtime and deployment. Several simultaneous hosted requests are not proof that one shared context was reused internally.
5. Even with the necessary access, a large model still performs large-model computation. A shorter answer does not make all of that work disappear.
6. So we have two experiments: improve how we ask a powerful model to decide, and teach a smaller model to handle a narrower set of decisions.
7. The smaller model may capture useful behavior from examples without inheriting the teacher's full intelligence. We must test where that transfer works and where it fails.
8. If the large-model runtime cannot support faithful branching, that is a useful result. The hosted baseline and the small-policy path can still move forward.

**Visual direction**

A large model is shown behind two interface windows: a hosted output contract and low-level state/logit controls. Only evidenced capabilities connect.

- Separate shorter output from smaller neural compute.
- Show a hosted constrained-answer call.
- Reveal the state/logit/batching controls needed by RLCD.
- Leave capability gates unknown until inspected.
- Keep distillation and direct large-model decoding as separate paths.

**Source anchors:** charter: Reference and architecture decisions, E9-T05; charter: Mission; charter: Scope and boundaries.

### 5.3 — Measure the whole trip

**Status:** Evaluation plan; no measured results yet.

**Takeaway:** Judge complete, useful tasks at frozen quality gates, counting all latency and fallback costs.

**Spoken script**

1. A fast model call is encouraging, but the person experiences the entire trip. Observation, input processing, inference, execution, and recovery all contribute to waiting.
2. We measure complete tasks as well as individual decisions. A system that clicks quickly and takes three wrong turns can easily lose to a slower, reliable one.
3. Compare methods on declared workflows, with consistent execution checks. Report task success, wrong actions, fallback frequency, and both typical and slower-end latency.
4. Use the same candidate inventory for controlled ranking comparisons. Also keep a broader generated-action baseline, so we can see when our restricted menu misses useful moves.
5. Historical recordings can tell us what actually happened. They cannot show the outcome of an alternative action that nobody took in that recording.
6. For that, we need live, resettable task environments. The system must act, observe the consequences, and finish the task under controlled conditions.
7. Freeze quality and speed gates before model selection. Choose the model on development data, calibrate it separately, and reserve an untouched test set for final evaluation.
8. Any charts in this explanation illustrate the method. The project earns a speed claim only when measured completed tasks meet those predeclared gates.

**Visual direction**

An end-to-end task ribbon expands into observation, inference, transport, execution, and recovery segments; a quality/latency plot retains failed tasks.

- Expand inference-only time to full task time.
- Keep cold and warm runs as separate groups.
- Mark wrong actions, abstentions, and fallback calls.
- Compare shared-candidate methods and a broader generated-action baseline.
- Seal quality/speed gates and show pass/fail only from future real evidence.

**Source anchors:** charter: Browser-action invariants 7, 10; charter: Reference and architecture decisions; charter: Milestones and success criteria.

## 6. Tab Into the Future

A browser that meets you halfway

Close with an opt-in predictive focus experience: learn supported personal patterns, suggest a target, accept via Tab without activation, preserve ordinary keyboard behavior, and collect non-self-reinforcing feedback. End with a concrete incremental pilot.

### 6.1 — Anticipation without taking over

**Status:** Proposed predictive Tab experience.

**Takeaway:** Predictive Tab is accepted focus assistance, with uncertainty and keyboard compatibility designed into the interaction.

**Spoken script**

1. Now bring the machinery back to the person at the keyboard. They open a familiar page, and the local model recognizes a pattern it has seen before.
2. It predicts that the name field is the next useful target. A subtle visual suggestion appears, distinct from the focus ring that shows the current keyboard position.
3. On a site where the person has enabled this behavior, pressing Tab can accept the suggestion and move focus to that field.
4. Focus is the full action in this assistive mode. It does not click save, submit the form, purchase anything, or silently complete an autonomous workflow.
5. If the model is unsure or the target has changed, ordinary navigation continues. A weak prediction should not create a fight between the person and the keyboard.
6. Escape dismisses the suggestion. Reverse navigation and editing shortcuts need to preserve their expected behavior, including in applications with their own use of Tab.
7. That is why the first version should be opt-in and limited to declared sites and contexts. Compatibility is part of whether the assistance is actually helpful.
8. The experience we want is simple: the browser offers the next useful place, and the person remains the one who chooses to go there.

**Visual direction**

A focus ring moves across the same profile page from earlier books. A suggestion halo is visibly different from actual focus and click activation.

- Observe supported page state and recent human actions.
- Display one subtle suggestion with a separate halo.
- Accept through opt-in Tab and move only focus.
- Escape dismisses; Shift-Tab and editor keys retain their behavior.
- Low support leaves ordinary keyboard navigation intact.

**Source anchors:** charter: Mission; charter: Who and what we are building for; charter: E11 integration milestone.

### 6.2 — Learn from the person, not the echo

**Status:** Proposed personalization and feedback.

**Takeaway:** Do not train on extension-created focus as if it independently confirmed the prediction.

**Spoken script**

1. A personal model should improve as it sees useful examples. But a predictive interface can accidentally manufacture evidence that its own guesses were right.
2. Suppose it suggests the name field and moves focus there. If that focus event becomes a positive training label, the system is learning from its own echo.
3. We must distinguish a suggestion, an accepted focus move, and what the person meaningfully does afterward. Those are different kinds of evidence.
4. Typing into the field or intentionally activating a control can provide a stronger signal. A dismissal or immediate move elsewhere tells a different story.
5. Even acceptance deserves careful interpretation. People sometimes follow a suggestion because it is convenient, not because it matches what they originally intended.
6. Start by collecting this feedback in a controlled way, then train and evaluate a new checkpoint. Continuous background weight updates are not required for the first product.
7. Keep recording, training, and using a model as separate controls. The person should be able to inspect the mode, stop collection, and roll back a bad model.
8. Personalization becomes useful when it follows the person's behavior faithfully, instead of making the person's behavior follow a mistake the model keeps reinforcing.

**Visual direction**

Two event streams separate human behavior from extension-produced focus. Only qualified feedback enters a versioned training buffer.

- Record a suggestion as an exposure, not a positive label.
- Tag extension-originated focus separately.
- Wait for meaningful typing or activation evidence.
- Log dismissals and ordinary user navigation.
- Train a candidate checkpoint and permit rollback after evaluation.

**Source anchors:** charter: Browser-action invariants 5, 6, 8, 9; charter: E10 and E11 milestones.

### 6.3 — The first useful version

**Status:** Proposed incremental pilot and end goal.

**Takeaway:** Start with a narrow local ranking task, prove helpful focus, and expand toward faster completed browser tasks.

**Spoken script**

1. The first useful version should be small enough to understand. Choose a limited site, a few supported workflows, and a simple local ranking baseline.
2. Run it in shadow mode first. Let it predict without moving anything, and compare its choices with what people actually do in the supported context.
3. Then show suggestions. Only after the evidence supports it should we add opt-in keyboard acceptance and measure whether it helps people move through their work.
4. Alongside that, prove the constrained Qwen engine and build the recording, training, and evaluation tools. Each piece should remain independently inspectable.
5. Autonomous tasks come through the checked runner, with explicit instructions, observed outcomes, and a clearly configured large-model fallback when that mode is enabled.
6. The final goal is bigger than predicting the next click. It is completing useful browser tasks faster at a level of reliability we chose before seeing the final results.
7. That path joins three ideas: organize inference around bounded decisions, learn useful patterns from eligible recordings, and keep the live browser in the loop.
8. At the end, the visible experience can be just a quiet suggestion and a press of Tab. The work underneath is what makes that small moment worth trusting.

**Visual direction**

The original task ribbon becomes a staged pilot path, with real evidence gates separating each stage. End on the live page and a waiting focus suggestion.

- Begin on one site with a small number of supported workflows.
- Shadow-rank without moving focus.
- Advance to visible suggestions, then opt-in acceptance.
- Add a native runner and explicit hybrid mode for task automation.
- End with unfilled success gates and the product promise.

**Source anchors:** charter: Mission; charter: Milestones and success criteria; charter: Release evidence and completion.

## Source notes

- **charter:** /Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on/PROJECT_CHARTER.md. Authoritative intended scope and correctness/evaluation gates; not implementation proof.
- **native-engine:** /Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on/qwen-rlcd/core/engine_mlx.py. Imported native MLX reference with known defects and overstated telemetry; verify against the charter.
- **schema:** /Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on/qwen-rlcd/core/schema.py. Schema/token compilation reference; comments about calibrated confidence and microseconds are not evidence.
- **prompt-builder:** /Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on/qwen-rlcd/core/prompt_builder.py. Current shared and ordinary-generation prompt construction.
- **browser-app:** /Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on/qwen-rlcd/browser/app.js. Current ordinary WebLLM structured-output prototype; not faithful browser RLCD.
- **scope-decision:** /Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on/docs/decisions/2026-09-16-browser-action-goal.md. Scope expansion requested by user on 2026-09-16.
- **recording-source-status:** https://github.com/replayio/builder-assets/tree/main/recordingExtension. User-supplied source was inaccessible during prior research. No implementation-specific claims; inspect only if access becomes available.
- **rrweb-primary:** https://github.com/rrweb-io/rrweb/blob/main/guide.md. Primary guide inspected for general snapshot/event concepts. Verify relevant details if expanded.

Local source hashes are recorded in series-script.json so the visual implementation can detect later changes. Do not place local absolute paths in spoken narration or public links.
