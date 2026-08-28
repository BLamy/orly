# Memory Before Silence — visual plan

- Paper: **VoiceMem: Streaming Dual-Brain Memory for Real-Time Interaction**
- Authors: Zhifei Xie, Jiaqi Lang, Ze An, Yifan Zhao, Dongchao Yang, Kai Li, Ziyang Ma, Mingbao Lin, Chunyan Miao, Shuicheng Yan
- Stable ID: **arXiv:2608.26005**
- Hugging Face: https://huggingface.co/papers/2608.26005
- Canonical paper: https://arxiv.org/abs/2608.26005
- Official source: https://github.com/xzf-thu/VoiceMem at `e8384e087bd2f44eb05fc7ae1a3c525ea8244179`

Throughline: **one unfinished spoken question becoming five usable memories before the silence ends**.

## Chapter 1 — The Hundred-Millisecond Wager

Visual machine: a persistent waveform/transcript tape crosses a zero-to-three-hundred-millisecond silence ruler. At two hundred milliseconds a speculative retrieval runner leaves the tape, fills a memory tray, and either survives to the three-hundred-millisecond voice-activity confirmation or dissolves when speech resumes.

Grounding: paper §3.3 and Figure 3; `voicemem/stream.py::VoiceStream._kick`, `_speculate`, `_confirm`, and `feed`; `web/run.py` defaults for `spec_min_chars`, `gamble_ms`, and `confirm_ms`.

Beats:

1. Build a partial transcript while the user is still speaking.
2. Cross the six-character threshold and start local classification plus search.
3. Let the transcript change and replace the previous speculative task.
4. Enter silence and mark the two-hundred-millisecond wager.
5. Fill the retrieval tray during the remaining one-hundred-millisecond window.
6. Demonstrate barge-in canceling the wager when speech resumes.
7. Replay the clean path to three-hundred-millisecond confirmation.
8. Hand an already-filled `Turn` to the reply path.

## Chapter 2 — The Left-Brain Funnel

Visual machine: a sixty-cell memory field narrows in place. Schema bands light first, entity matches carve out a smaller lens, one-hop neighbors join at the edge, and vector similarity sweeps the surviving pool into five bright cells.

Grounding: paper §3.1; `voicemem/leftbrain/brain.py::SearchCogGraph`, `_search_data_impl`, `SearchData`, `_widen_for_time_question`, and `rank`; `voicemem/orchestrator.py::Search`.

Beats:

1. Reveal the full factual memory field.
2. Classify the query into real schema and entity channels.
3. Use `memory_ids_for_slots_v2` to light schema candidates.
4. Resolve fuzzy entity matches and intersect in strict mode.
5. Expand one hop through `neighbor_entity_ids`.
6. Sweep semantic ranking across only the surviving pool.
7. Keep the top five and dim everything else.
8. Close on high information density rather than a giant context dump.

## Chapter 3 — The Affect Constellation

Visual machine: emotion episodes rise as pulses on a valence-arousal field, then crystallize into two persistent node families. Independent persona nodes orbit the person; cross-entity nodes bridge to factual entities from the left brain. Repeated short-horizon evidence thickens a long-horizon trait.

Grounding: paper §3.2; `voicemem/rightbrain/brain.py::search`, `write`, `learn_from_reaction`, and `_write_trait`; `voicemem/utils/audio/emotion/graph_memory.py::add_attribution`; `voicemem/rightbrain/store.py`.

Beats:

1. Plot one acoustic emotion episode in valence-arousal space.
2. Separate transient emotion from a persistent persona claim.
3. Form an independent node for a person-level tendency.
4. Bring a left-brain entity across the bridge.
5. Form a cross-entity node for affect tied to that entity.
6. Accumulate repeated short-horizon evidence.
7. Consolidate it into a longer-horizon trait without erasing provenance.
8. Query both node families from the same partial transcript.

## Chapter 4 — Five Memories Before the Reply

Visual machine: the partial transcript opens two parallel rails. The left rail compresses facts; the right rail contributes persona and affect. A top-five gate admits a compact memory ribbon, while a replaceable backend cartridge slides beneath the upper routing layer. The final pullback retraces the wager, funnel, constellation, and reply.

Grounding: paper §3.3, §4.2, §5.4, and conclusion; `voicemem/orchestrator.py::Utils` and `Search`; `voicemem/utils/fusion/reply_memory.py`; `voicemem/utils/fusion/prompt_builder.py`; `voicemem/stream.py::Turn.memory_context`.

Beats:

1. Fork one partial transcript into left- and right-brain retrieval.
2. Run left ranking and right search in parallel after entity activation.
3. Merge concrete facts, persona evidence, and directives without conflating them.
4. Limit the memory ribbon to five retrieved items.
5. Ground the paper's operating point: 91.2 LoCoMo score, 430 memory tokens, 134 milliseconds.
6. Slide a different lower memory engine under unchanged upper routing.
7. Hand the compact context to the speech model before voice-activity confirmation expires.
8. Retrace the whole journey from unfinished speech to a memory-aware reply.
