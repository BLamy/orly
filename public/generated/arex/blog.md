# The Answer Audits Itself

**Paper:** *AREX: Towards a Recursively Self-Improving Agent for Deep Research*<br>
**Authors (as listed by arXiv):** Shuqi Lu, Chaofan Li, Kun Luo, Zhang Zhang, Hui Wang, Hongwang Xiao, Zheng Liu, Lei Xiong, Jiahao Wang, Sen Wang, Xiyan Jiang, Wanli Li, Yuyang Hu, Hongjin Qian, Bingyu Yan, Ziyi Xia, Yingxia Shao, Kang Liu, Zhicheng Dou, Di He, Chaozhuo Li, Qiwei Ye, Zhongyuan Wang, Zheng Liu<br>
**Stable identifier:** arXiv:2607.21461<br>
**Hugging Face:** https://huggingface.co/papers/2607.21461<br>
**Canonical paper:** https://arxiv.org/abs/2607.21461<br>
**PDF:** https://arxiv.org/pdf/2607.21461<br>
**Project page:** https://vectorspacelab.github.io/arex-model/<br>
**Official code:** https://github.com/VectorSpaceLab/arex-model

Deep-research agents have an awkward imbalance. Finding one answer that
satisfies several constraints at once can require a wide and expensive search.
Once a candidate exists, however, checking its date, location, provenance, and
relationships can be much more direct. AREX builds a recursive control loop
around that discovery–verification asymmetry: research produces a provisional
answer, verification diagnoses it, and the diagnosis determines whether to
accept, refine, or restart.

The paper describes the full recursive system and its training recipe. The
public repository exposes a narrower but concrete quickstart: a ReAct-style
inner loop, XML tool-call parsing, web and scholarly search, page visits,
evidence extraction, and a growing message history. The outer
accept/refine/restart controller and the learned `update_context` mechanism are
paper mechanisms; they are not implemented by the released quickstart. This
explainer keeps that boundary visible throughout.

## 1. The Expensive Guess

A difficult research question often asks for a joint fit rather than an
isolated fact. Imagine that a candidate must satisfy a time constraint, a
place constraint, a source-quality requirement, and a specific relationship.
Each constraint admits many possibilities, but their intersection can be
small. The first chapter renders that situation as a large field of candidates
covered by four overlapping lenses.

<figure><img src="/generated/arex/blog/chapter-1-0.png" alt="A large search field begins to appear"><figcaption>Deep research starts in a broad space of possible answers.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-1-1.png" alt="Four constraint lenses cover the candidate field"><figcaption>Time, place, source, and relation constraints carve the field in different ways.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-1-2.png" alt="A search trace crosses the field"><figcaption>Discovery must navigate the joint constraint space to find a viable intersection.</figcaption></figure>

Longer search is not automatically better search. An early mistaken premise
can persist, a depleted direction can be revisited, and a long trajectory can
accumulate evidence without closing the actual gaps. AREX instead treats the
first answer as provisional. That changes the problem from “search everywhere”
to a set of answer-specific checks.

<figure><img src="/generated/arex/blog/chapter-1-3.png" alt="A provisional candidate appears inside the constraint overlap"><figcaption>A candidate turns an open-ended search into something that can be audited.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-1-4.png" alt="A constraint audit lists four direct checks"><figcaption>Each original requirement becomes a direct verification question.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-1-5.png" alt="Some audit checks become verified"><figcaption>The audit identifies which parts of the answer already have support.</figcaption></figure>

The unresolved checks are useful state, not merely failure labels. They specify
what the next round should investigate while the supported claims remain
available. This is the paper’s central asymmetry: discovery is costly, but
constraint-wise verification can turn partial correctness into a focused
research objective.

<figure><img src="/generated/arex/blog/chapter-1-6.png" alt="Unresolved checks narrow the next objective"><figcaption>Missing support becomes a smaller target for the next research round.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-1-7.png" alt="Verified evidence and unresolved constraints form a map"><figcaption>The audit separates what to preserve from what to pursue.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-1-8.png" alt="Closing panel says to search where the audit points"><figcaption>AREX redirects effort according to the answer’s diagnosed gaps.</figcaption></figure>

## 2. Evidence on a Tape

The released repository makes the inner research machine inspectable. In
`src/arex_client.py`, the run begins with a system research policy and the user
question. The model may answer with one or more tagged function calls.
`extract_fn_call_multi` in `src/arex_tool_schema.py` extracts the function name
and parameter payloads instead of treating the call as ordinary prose.

<figure><img src="/generated/arex/blog/chapter-2-0.png" alt="System and user messages begin an evidence tape"><figcaption>The public quickstart starts from a research policy and the question.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-2-1.png" alt="A tagged model tool call is parsed"><figcaption>The parser turns XML-style tool-call text into a named action and arguments.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-2-2.png" alt="Web search scholarly search and page visit tools appear"><figcaption>The released action set includes `search`, `google_scholar`, and `visit`.</figcaption></figure>

`src/arex_http_tools.py` dispatches those actions to configured HTTP services.
Search and scholarly search issue queries; a visit action retrieves page
content. Returned material is formatted as a `<tool_response>` observation and
appended to the same message list. The next model call therefore sees the
question, prior reasoning, actions, and evidence as one growing tape.

<figure><img src="/generated/arex/blog/chapter-2-3.png" alt="A tool call travels to an external service"><figcaption>The runner executes the selected action outside the model.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-2-4.png" alt="A tool response is appended to the message tape"><figcaption>External evidence returns as a structured observation in the conversation.</figcaption></figure>

Page visits have an additional guard. The client bounds long page content and
can call a separate extractor so the observation retains material relevant to
the current goal. This is the quickstart’s page-summary path; it should not be
confused with the paper’s learned cross-round `update_context` tool.

<figure><img src="/generated/arex/blog/chapter-2-5.png" alt="A long visited page is reduced to relevant evidence"><figcaption>Visited content is bounded and distilled before it joins the working tape.</figcaption></figure>

The loop repeats after every observation. The default `AREX_MAX_ROUNDS` is
600, which is a ceiling rather than a promise that every question should use
600 actions. When the model response contains no tool call, the runner removes
hidden reasoning tags and returns the remaining plain-text answer.

<figure><img src="/generated/arex/blog/chapter-2-6.png" alt="New observations alter the next query in a loop"><figcaption>Each observation can change the action chosen in the next round.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-2-7.png" alt="A response without a tool call ends the loop"><figcaption>No parsed action means the inner runner has reached its final-answer path.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-2-8.png" alt="The full action observation append loop is shown"><figcaption>The public implementation is an evidence-producing inner loop: act, observe, append, repeat.</figcaption></figure>

## 3. The Confidence Gate

The paper adds an outer control loop beyond that public quickstart. A completed
research trajectory emits a structured finish containing a provisional answer,
supporting evidence, and a confidence score. The score is intended to reflect
whether the answer is complete, internally consistent, grounded in suitable
sources, and current enough for the question.

<figure><img src="/generated/arex/blog/chapter-3-0.png" alt="A completed inner research trajectory reaches an outer loop"><figcaption>Stopping the inner search does not automatically accept the answer.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-3-1.png" alt="Answer evidence and confidence emerge from structured finish"><figcaption>The structured finish exposes the artifacts the outer loop needs to judge progress.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-3-2.png" alt="A confidence gauge combines several quality dimensions"><figcaption>Confidence summarizes evidence quality rather than counting tool calls.</figcaption></figure>

If confidence clears the acceptance threshold, the outer loop returns the
answer. If it does not, the controller evaluates the trajectory’s
recoverability. A run with reliable findings and identifiable gaps is worth
refining; a noisy or misleading trajectory may be safer to restart from the
original problem.

<figure><img src="/generated/arex/blog/chapter-3-3.png" alt="The high confidence branch reaches accept"><figcaption>A sufficiently supported answer follows the accept branch.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-3-4.png" alt="A lower confidence answer reaches a recoverability test"><figcaption>Low confidence triggers diagnosis, not an automatic retry.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-3-5.png" alt="Recoverable evidence moves onto a refine branch"><figcaption>Refinement preserves trustworthy state and targets the remaining issues.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-3-6.png" alt="A noisy trajectory moves onto a restart branch"><figcaption>Restart discards an unhelpful path and returns to the original question.</figcaption></figure>

Recursive rounds are bounded. When no round clears the threshold, the paper’s
controller keeps the strongest completed candidate instead of recursing
forever. Verification is therefore a control signal with three meanings:
accept when the evidence is strong, refine when progress is recoverable, and
restart when the current state is more liability than help.

<figure><img src="/generated/arex/blog/chapter-3-7.png" alt="Several bounded rounds compete by confidence"><figcaption>The recursive controller retains the best completed answer across bounded rounds.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-3-8.png" alt="Accept refine and restart branches converge in a closing panel"><figcaption>The confidence gate converts verification into the next research decision.</figcaption></figure>

## 4. Keep the State, Lose the Clutter

A long trajectory carries both valuable state and accumulated debris. Verified
findings, source identifiers, open constraints, candidate rejections, and the
current plan can all matter later. Duplicate observations, superseded
conclusions, and obsolete plans usually do not. Keeping everything can bury
the next useful action; blindly truncating by age can erase the evidence that
made the trajectory recoverable.

<figure><img src="/generated/arex/blog/chapter-4-0.png" alt="A long ribbon mixes evidence plans and failed queries"><figcaption>Research history grows into a mixture of durable state and expired work.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-4-1.png" alt="The long ribbon becomes congested"><figcaption>Unlimited append-only context can make the next decision harder to locate.</figcaption></figure>

The paper introduces a learned `update_context` action. Rather than applying a
fixed sliding window, the agent invokes the tool when the research state has
meaningfully changed. The update folds history by semantic role. Verified
facts stay attached to their provenance, while unresolved requirements,
current candidates, concerns, rejections, and the next plan become an explicit
compact state.

<figure><img src="/generated/arex/blog/chapter-4-2.png" alt="A learned context update tool appears beside the history"><figcaption>The model chooses when the working state needs semantic compression.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-4-3.png" alt="Evidence and source identifiers fold together"><figcaption>Compression preserves the relationship between a claim and its source.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-4-4.png" alt="Six compact state fields survive the fold"><figcaption>Candidates, constraints, concerns, rejections, findings, and plans remain actionable.</figcaption></figure>

The discarded material is not selected merely because it is old. Repeated
observations, conclusions replaced by stronger evidence, and plans for already
resolved subproblems can disappear. New actions then append after the compact
state, allowing the next round to continue without reconstructing progress
from the entire transcript.

<figure><img src="/generated/arex/blog/chapter-4-5.png" alt="Duplicate and obsolete items fall away"><figcaption>Semantic compaction removes redundancy and state that no longer controls a decision.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-4-6.png" alt="A new action appends after the compact state"><figcaption>Fresh research resumes from a concise but evidence-bearing state.</figcaption></figure>

The paper describes updates after events such as resolving a subproblem,
rejecting a candidate, reconciling conflicting evidence, or changing the plan.
This full learned mechanism is not present in the official quickstart. The
released code has a separate page-extraction summary used to bound a visited
document before appending it to the inner loop.

<figure><img src="/generated/arex/blog/chapter-4-7.png" alt="Several meaningful state changes trigger repeated updates"><figcaption>Context updates align with changes in research state rather than a fixed token interval.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-4-8.png" alt="Paper mechanism and quickstart page summary are separated"><figcaption>The paper’s cross-round state update and the repository’s page extractor are distinct mechanisms.</figcaption></figure>

## 5. Reward the Turning Point

Training a long-horizon research agent requires more than rewarding the final
answer. The paper begins with teacher trajectories that include analysis,
tool calls, observations, and a structured finish. Its quality-control process
filters trajectories with invalid tool use, ignored observations,
evidence-inconsistent answers, or claims that cannot be reconstructed from the
record.

<figure><img src="/generated/arex/blog/chapter-5-0.png" alt="A long teacher trajectory begins to draw"><figcaption>Training data records the whole research path, not only the final prose.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-5-1.png" alt="A quality gate removes flawed teacher trajectories"><figcaption>Tool validity and evidence consistency determine which demonstrations survive.</figcaption></figure>

An outcome reward can tell the learner whether the completed trajectory
succeeded. It cannot identify which intermediate turn found decisive evidence,
repaired a bad hypothesis, or chose the productive next query. AREX marks a
small set of these key turning points and replays them during mid-training so
the learner sees the local decisions that made the successful path work.

<figure><img src="/generated/arex/blog/chapter-5-2.png" alt="One outcome reward appears at the end of a trajectory"><figcaption>A terminal reward evaluates the result but leaves intermediate credit ambiguous.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-5-3.png" alt="Several trajectory turns are highlighted as decisive"><figcaption>Key steps identify the moments that changed the course of research.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-5-4.png" alt="Highlighted turns are replayed during training"><figcaption>Key-step replay makes productive research decisions explicit training material.</figcaption></figure>

During reinforcement learning, successful trajectories receive a bounded
auxiliary bonus at those marked steps. The shaping signal is not allowed to
replace the outcome objective; it adds localized credit while remaining tied
to a trajectory that ultimately worked.

<figure><img src="/generated/arex/blog/chapter-5-5.png" alt="Bounded bonus markers appear over successful key steps"><figcaption>Auxiliary rewards point toward useful turns without ignoring final success.</figcaption></figure>

The paper aggregates first across steps and then across trajectories. That
hierarchical normalization prevents a long run from collecting more influence
merely because it contains more tokens or actions. The training recipe produces
a dense four-billion-parameter model and a sparse model with ten billion active
parameters, connecting the recursive inference design to concrete trained
agents.

<figure><img src="/generated/arex/blog/chapter-5-6.png" alt="Step rewards average into trajectory-level values"><figcaption>Hierarchical normalization makes credit comparable across different trajectory lengths.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-5-7.png" alt="Dense and sparse trained model cards appear"><figcaption>The paper reports both a dense four-billion model and a sparse model with ten billion active parameters.</figcaption></figure>

<figure><img src="/generated/arex/blog/chapter-5-8.png" alt="The full recursive research loop closes"><figcaption>Candidate discovery, evidence gathering, answer auditing, state preservation, and key-step credit form one trainable loop.</figcaption></figure>
