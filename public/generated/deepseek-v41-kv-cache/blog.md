# A Token to Remember

**Paper:** [DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression](https://arxiv.org/abs/2609.19969) by DeepSeek-AI

**Stable identifier:** arXiv:2609.19969 · DOI: 10.48550/arXiv.2609.19969

**Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2609.19969) · ranked first for September 18, 2026 with 81 visible upvotes

**Official implementation:** [deepseek-ai/DeepSeek-V4.1-Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash) at revision `dba1be0a40aa45a94ad051997016db3960a90277`

Long-context inference is a memory problem disguised as an attention problem. A conventional decoder saves keys and values from every layer for every prior token, so the cache grows with both depth and sequence length. DeepSeek-V4.1-Flash separates the short, exact memory needed nearby from a shared compressed memory that can reach far back. The result reported by the authors is 890 bytes of global KV state per token, while retaining a 2.8-million-token context window.

### One token, two memories

Every attention layer keeps its own sliding-window cache for recent tokens. In the public implementation, `Attention._window_kv` writes those local values into a ring buffer whose size is fixed by `window_size`. The distant path is different: only layers named in `kv_source_layers` run a `Compressor`, write a compressed cache, and publish it through shared attention state. Other layers with the same compression ratio read that same cache instead of materializing another copy.

{% viz scene="books/deepseek-v41-kv-cache/chapter-1" section="chapter-1-two-memories" cue="4" from="0.000" to="60.001" title="One token, two memories." %}
{% endviz %}

That ownership distinction is the key space-saving move. The recent ring remains layer-local because it carries fine-grained activations. The older memory becomes a shared latent rail: one source layer produces it, neighboring consumers reuse it, and a token is no longer duplicated into a full global cache at every layer.

### Squeeze the global memory

The compressor pools `compress_ratio` consecutive token projections with a learned softmax gate. It holds an incomplete group in `kv_state` and `score_state`, emitting a latent only when the group is complete. Before that latent is stored, the runtime applies rotary position encoding and then block-quantizes the compressed KV to FP4. The implementation uses E2M1 values with one E4M3 scale per 16 channels for this cache.

{% viz scene="books/deepseek-v41-kv-cache/chapter-2" section="chapter-2-compression" cue="4" from="0.000" to="76.348" title="Squeeze the global memory." %}
{% endviz %}

The 890-byte total is therefore not one trick. It is the product of sharing caches across layers, pooling several token positions into one latent where configured, and storing the resulting global values at four-bit precision. The local window stays higher fidelity; the distant rail accepts controlled compression because sparse attention will consult only a small subset of it.

### Search once, refine, reuse

The `Indexer` is a small side-attention mechanism that scores compressed positions. Its query and key activations are also quantized to FP4, and the highest-scoring positions become `topk_idxs` for the main sparse-attention kernel. A source layer publishes those indices through shared state; intervening layers can reuse the selection instead of repeating a full search over the long context.

{% viz scene="books/deepseek-v41-kv-cache/chapter-3" section="chapter-3-sparse-search" cue="4" from="0.000" to="74.165" title="Search once, refine, reuse." %}
{% endviz %}

The released model adds a hierarchical candidate stage for later indexers. A designated source first ranks blocks and pins the newest reachable block so it cannot be lost merely because it is only partially filled. Later indexers score positions inside that bounded candidate pool. The costly first search scales with context length; deeper refinements work over a controlled set.

### Replay only the recent tail

DeepSeek-V4.1-Flash organizes its 40-layer transformer as a 20-layer causal encoder followed by a 20-layer decoder. The global decoder cache is projected from the encoder's final states, while short-window attention still depends on recent decoder-layer activations. Persisting every one of those short-window states would erase much of the global-cache saving.

{% viz scene="books/deepseek-v41-kv-cache/chapter-4" section="chapter-4-bounded-replay" cue="4" from="0.000" to="82.338" title="Replay only the recent tail." %}
{% endviz %}

SWA Bounded Replay keeps the durable representation compact and reconstructs only the most recent window when it is needed again. The boundary is explicit: global memory is compressed, shared, and persistent; local memory is exact enough for nearby attention but bounded in length and recoverable by replay. That division is what lets the system extend context without asking storage to grow like a full per-layer KV history.
