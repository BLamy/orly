# Four Tokens Ahead — visual plan

Paper: **NCP-ArchPreview Technical Report: Moving towards Latent Space Language Models through Next Concept Prediction**
Stable ID: **arXiv:2609.10715**
Official implementation/evaluation source: **LUMIA-Group/ncp_olmo_eval**, commit `e9e4ff4b443bb3c321030a9a437be216dc7d6722`

Throughline: a **concept clock** ticks once for every four token states. Each chapter keeps that four-token pulse visible while changing what the pulse does.

## Chapter 1 — The Concept Clock

Visual machine: a sixteen-token ribbon flows through a sixteen-layer encoder. Every adjacent group of four states folds into one larger concept bead, so the viewer watches sequence length shrink from sixteen token positions to four concept positions.

Grounding:

- Paper Sections 2.1–2.2 and 4.1: mean pooling, compression factor four, 16-layer Token Encoder, 4,096-dimensional states.
- `src/ncp_olmo_eval/vllm_plugin/model.py`: mean-pooling chunks are required by the native Stage3 backend.
- `src/ncp_olmo_eval/vllm_plugin/token_tower.py`: the native OLMo3 encoder and decoder towers.

Beats:

1. Standard next-token prediction lights one target at a time on a long token ribbon.
2. Sixteen encoder layers raise each token into a hidden state while the camera tracks the ribbon.
3. Braces gather adjacent groups of four hidden states.
4. Each group collapses into its mean, becoming one concept bead.
5. The four beads form a slower concept clock above the original token clock.
6. A quiet end card states the invariant: token input and token output stay autoregressive; concepts are an added prediction scale.

Reusable vocabulary: `Camera`, `Brace`, local token/concept ribbon components. The persistent object is the same sixteen-position ribbon, first token-level and then grouped.

## Chapter 2 — A Vocabulary of Products

Visual machine: one 4,096-dimensional concept bar splits into thirty-two 128-dimensional colored segments. Each segment dives into its own 128-entry codebook grid; highlighted nearest entries assemble into a quantized concept, then probability weights soften the hard selections into a differentiable prediction.

Grounding:

- Paper Sections 2.2–2.3 and configuration in Section 4.1: 32 codebooks, 128 entries per codebook, 128 dimensions per segment.
- `src/ncp_olmo_eval/vllm_plugin/hlm.py`: `ConceptLMProductCodebook`, one prediction head per codebook, stacked codebooks, and the weighted `einsum` that forms predicted concepts.
- `src/ncp_olmo_eval/vllm_plugin/contract.py`: positive codebook size and count, with hidden size divisible by the number of codebooks.

Beats:

1. A single continuous concept is too unconstrained to serve as a crisp vocabulary item.
2. The concept bar splits into thirty-two equal segments.
3. A matrix of codebook entries appears; each segment finds a nearby entry in its own row.
4. The selected entries concatenate into one product-quantized concept.
5. The capacity expression `128^{32}` expands without drawing an impossible monolithic vocabulary.
6. Hard picks become probability distributions; weighted entries blend into a differentiable predicted concept.
7. The end card shows the actual implementation identity: `ConceptLMProductCodebook` plus one linear prediction head per codebook.

Reusable vocabulary: `Camera`, `MatrixGrid`, `MathLabel`, local segmented-vector and codebook components. The persistent object is one concept bar splitting, selecting, and recombining.

## Chapter 3 — One Chunk Behind

Visual machine: four concept beads advance through an eight-layer concept module. The prediction for the next bead expands back into four token-aligned copies, but a mechanical delay gate shifts it one full chunk before it can enter the decoder. Residual threads then choose among encoder and concept depths.

Grounding:

- Paper Sections 2.3–2.5 and 3.1–3.5: autoregressive concept prediction, repeat by the compression factor, causal shift, residual addition, IRC, CRC, and the joint loss.
- `src/ncp_olmo_eval/vllm_plugin/hlm.py`: incremental request-scoped concept processing, product-codebook prediction, and encoder-read routes.
- `src/ncp_olmo_eval/vllm_plugin/routes.py`: Stage3 encoder, decoder, concept, and residual-flow routes.
- `src/ncp_olmo_eval/vllm_plugin/state.py`: request-scoped HLM key/value history and tensor buffers.

Beats:

1. The concept module reads only completed concept history and predicts the next bead.
2. Eight layers refine that prediction at the slower concept rate.
3. The predicted bead repeats across four token positions.
4. A one-chunk delay gate inserts a zero prefix and visibly blocks future leakage.
5. The shifted concept signal adds to token hidden states before the sixteen-layer decoder.
6. IRC threads reweight earlier depths within a module; CRC threads cross from encoder to concept and decoder, and from concept to decoder.
7. Three loss rails converge: next token, next concept, and vector quantization.
8. The end card preserves the core invariant: every output token is still predicted causally.

Reusable vocabulary: `Camera`, `MathLabel`, `Vec`, local delay-gate and residual-thread components. The persistent object is the predicted concept bead traveling through expand, shift, and fuse operations.

## Chapter 4 — Proof Before Speed

Visual machine: two training-loss curves race across the same 5.73-trillion-token track. The NCP curve reaches the baseline finish line at 51.3 percent of the tokens. The track then folds into the released evaluation ledger and a speculative-decoding checkpoint gate that accepts or rolls back draft chunks.

Grounding:

- Paper Figure 1, Table 1, Sections 4.2 and 5.3: 1.95-times token convergence, 2.45-point Stage-1 macro gain, 5.99-point GSM8K gain, and 4.17-percent mean accepted length improvement with concept-conditioned DFlash2.
- `README.md` and `src/ncp_olmo_eval/evaluation_cli.py`: immutable model identities, JSON task specifications, pinned seeds and protocols, artifact validation, and fail-closed materialization.
- `src/ncp_olmo_eval/vllm_plugin/model.py`: `_DFlashStateTransaction`, state snapshots, accepted segments, and rollback.
- `docs/SPECULATIVE_DECODING.md` and `src/ncp_olmo_eval/ncp_dflash_vllm_benchmark.py`: exact A/B verification, at least eight prompts and 1,024 forced generated tokens, and operating-point checks.

Beats:

1. Both models start on the same Stage-1 data track.
2. The NCP loss curve crosses the baseline final-loss line after 51.3 percent of the training tokens.
3. Result badges show the measured Stage-1 deltas, without implying results beyond the paper.
4. The official evaluation tool seals model identity, source revision, prompts, seeds, and prepared data into one ledger.
5. A speculative drafter proposes a block while target state is snapshotted.
6. Accepted tokens commit; rejected tokens visibly roll the state back.
7. The gate demands exact A/B evidence before the faster path is allowed.
8. The final recap retraces the concept clock: group, quantize, predict, shift, verify.

Reusable vocabulary: `Camera`, `Axes`, `FunctionPlot`, `MathLabel`, local ledger and transaction-gate components. The persistent object is the shared training track, which becomes the evidence ledger and verification gate.

## Publication metadata

- Hugging Face Daily Paper: https://huggingface.co/papers/2609.10715
- Exact ranking date: https://huggingface.co/papers/date/2026-09-11
- Canonical paper: https://arxiv.org/abs/2609.10715
- Canonical PDF: https://arxiv.org/pdf/2609.10715
- DOI: https://doi.org/10.48550/arXiv.2609.10715
- Official code: https://github.com/LUMIA-Group/ncp_olmo_eval
