# Memory Before Silence

- **Paper:** [VoiceMem: Streaming Dual-Brain Memory for Real-Time Interaction](https://arxiv.org/abs/2608.26005) by Zhifei Xie, Jiaqi Lang, Ze An, Yifan Zhao, Dongchao Yang, Kai Li, Ziyang Ma, Mingbao Lin, Chunyan Miao, and Shuicheng Yan
- **Stable identifier:** `arXiv:2608.26005` · DOI `10.48550/arXiv.2608.26005`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2608.26005) · selected at rank 1 with 160 upvotes from the [2026-08-27 ranking](https://huggingface.co/papers/date/2026-08-27)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2608.26005) · [PDF](https://arxiv.org/pdf/2608.26005)
- **Official sources:** [project page](https://xzf-thu.github.io/VoiceMem/) · [xzf-thu/VoiceMem](https://github.com/xzf-thu/VoiceMem) at source commit [`e8384e0`](https://github.com/xzf-thu/VoiceMem/tree/e8384e087bd2f44eb05fc7ae1a3c525ea8244179)

A remembered answer can still feel broken if retrieval begins only after a speaker stops. VoiceMem attacks that latency boundary directly: it speculates on the unfinished transcript, separates factual memory from affective and persona memory, then hands a small context to the response path when the turn is confirmed. The interesting mechanism is not simply a faster vector search. It is the way several bounded decisions fit inside silence that the conversation already contains.

## 1. The Hundred-Millisecond Wager

### Retrieval starts while the turn is still provisional

[`voicemem/stream.py`](https://github.com/xzf-thu/VoiceMem/blob/e8384e087bd2f44eb05fc7ae1a3c525ea8244179/voicemem/stream.py) starts speculative classification and search once the partial transcript crosses `spec_min_chars`, whose default is six. Each new word can cancel the stale asynchronous task and launch a fresher one. After `gamble_s`, defaulting to 0.2 seconds of silence, the stream treats the turn as provisionally complete; `confirm_s` defaults to 0.3 seconds. That leaves a one-hundred-millisecond interval in which retrieval can finish before confirmation.

{% viz scene="books/memory-before-silence/chapter-1" section="chapter-1-hundred-millisecond-wager" cue="0" from="0.000" to="51.316" title="Retrieval starts while the turn is still provisional." %}
{% endviz %}

The wager is recoverable. If speech resumes, the barge-in path cancels the speculative work and clears the provisional result. If silence survives to confirmation, the completed memory is attached to the turn instead of starting from zero at the boundary.

## 2. The Left-Brain Funnel

### Narrow the factual store before semantic ranking

The left brain does not send the whole memory store into one global rank. [`SearchCogGraph`](https://github.com/xzf-thu/VoiceMem/blob/e8384e087bd2f44eb05fc7ae1a3c525ea8244179/voicemem/leftbrain/brain.py) first uses the query classification to form schema pools, intersects those pools with fuzzy entity matches when both are present, and can widen the edge with one-hop entity neighbors. Semantic ranking is then applied to that candidate set. The code deliberately permits fewer than `top_k` results when a constrained candidate set is exhausted instead of silently filling the answer with unrelated memories.

{% viz scene="books/memory-before-silence/chapter-2" section="chapter-2-left-brain-funnel" cue="0" from="0.000" to="50.339" title="Narrow the factual store before semantic ranking." %}
{% endviz %}

This ordering turns schemas and entities into routing information rather than decorative metadata. The vector scorer spends its budget on a small evidence pool, and the selected facts retain their graph relationships through the neighbor expansion.

## 3. The Affect Constellation

### Keep evidence attached to the person and entity it describes

The right brain has a different job. [`voicemem/rightbrain/brain.py`](https://github.com/xzf-thu/VoiceMem/blob/e8384e087bd2f44eb05fc7ae1a3c525ea8244179/voicemem/rightbrain/brain.py) searches persona and affective memory, while [`voicemem/utils/audio/emotion/graph_memory.py`](https://github.com/xzf-thu/VoiceMem/blob/e8384e087bd2f44eb05fc7ae1a3c525ea8244179/voicemem/utils/audio/emotion/graph_memory.py) stores emotion episodes with their turn-level evidence. VoiceMem distinguishes independent person-level tendencies from cross-entity nodes that attach an emotion or preference to an entity activated by the factual graph. That keeps “this person is usually guarded” separate from “this person feels uneasy about this café.”

{% viz scene="books/memory-before-silence/chapter-3" section="chapter-3-affect-constellation" cue="0" from="0.000" to="60.837" title="Keep evidence attached to the person and entity it describes." %}
{% endviz %}

The attribution path can accumulate short-horizon evidence and later consolidate longer-horizon traits while preserving links back to supporting memories. The graph therefore carries provenance for affective context instead of collapsing one expressive turn into a permanent personality claim.

## 4. Five Memories Before the Reply

### Two retrieval rails become one compact prompt

[`voicemem/orchestrator.py`](https://github.com/xzf-thu/VoiceMem/blob/e8384e087bd2f44eb05fc7ae1a3c525ea8244179/voicemem/orchestrator.py) activates left-brain entities, runs left ranking and right-brain search, and limits the returned evidence with `top_k`. The fusion layer's [`ReplyContextPrompt`](https://github.com/xzf-thu/VoiceMem/blob/e8384e087bd2f44eb05fc7ae1a3c525ea8244179/voicemem/utils/fusion/types.py) preserves separate factual, emotional, and response-directive fields instead of flattening everything into an unlabeled paragraph. The implementation also exposes `memory_engine` as an overridable capability, keeping orchestration separate from the lower storage backend.

{% viz scene="books/memory-before-silence/chapter-4" section="chapter-4-five-memories" cue="0" from="0.000" to="66.270" title="Two retrieval rails become one compact prompt." %}
{% endviz %}

At the paper's reported operating point, VoiceMem reaches 91.2 on LoCoMo while using 430 memory tokens and 134 milliseconds of retrieval time. Those are results for the authors' evaluation setup, not universal latency guarantees. The mechanism behind them is inspectable in the repository: start before the turn ends, narrow facts before ranking, preserve affective attribution, and deliver a small structured context to the reply path.

---

Read the [canonical paper](https://arxiv.org/abs/2608.26005), its [PDF](https://arxiv.org/pdf/2608.26005), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2608.26005), the [VoiceMem project page](https://xzf-thu.github.io/VoiceMem/), and the [official repository](https://github.com/xzf-thu/VoiceMem).
