# Four Tokens Ahead

- **Paper:** [NCP-ArchPreview Technical Report: Moving towards Latent Space Language Models through Next Concept Prediction](https://arxiv.org/abs/2609.10715)
- **Authors:** The Intern-NCP Team; Jiaqi Cao; Chiyu Chen; Shuang Cheng; Xu Cheng; Beiya Dai; Yufan Feng; Kewen Ge; Ruijun Ge; Jiayi Huang; Yang Jiao; Dahua Lin; Zhouhan Lin; Yifan Liu; Yuliang Liu; Biqing Qi; Mowen Ruan; Junzhe Shen; Yunchong Song; Hao Sun; Zhongbo Tian; Yixuan Wang; Rubin Wei; Jiaxin Xiong; Kangyu Yang; Qian Yao; Qi Zhang; and Bowen Zhou
- **Stable identifier:** `arXiv:2609.10715` · DOI `10.48550/arXiv.2609.10715`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2609.10715) · selected at rank 1 with 191 visible upvotes, ahead of 153 and 78, from the exact [2026-09-11 ranking](https://huggingface.co/papers/date/2026-09-11)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2609.10715) · [PDF](https://arxiv.org/pdf/2609.10715)
- **Official implementation:** [LUMIA-Group/ncp_olmo_eval](https://github.com/LUMIA-Group/ncp_olmo_eval) at source commit [`e9e4ff4`](https://github.com/LUMIA-Group/ncp_olmo_eval/tree/e9e4ff4b443bb3c321030a9a437be216dc7d6722)

Next-token prediction asks a language model to move one symbol at a time. NCP-ArchPreview keeps that autoregressive surface intact, but adds a second clock: every four token states are pooled into a concept, quantized through a structured vocabulary, predicted at the concept level, and shifted back into token decoding without seeing the future. The paper's released evaluation repository makes the final lesson unusually concrete: architectural speedups count only after model identity, data, prompts, seeds, and exact decoding behavior have been pinned down.

## 1. The Concept Clock

### Sixteen token positions become four concept positions

The released 8.94-billion-parameter configuration uses a sixteen-layer token encoder with hidden size 4,096, followed by an eight-layer concept module and a sixteen-layer token decoder. A required mean-pooling step groups each contiguous run of four encoder states. Sixteen token positions therefore become four concept positions while the original token stream continues toward the decoder.

{% viz scene="books/ncp-archpreview/chapter-1" section="chapter-1-concept-clock" cue="0" from="0.000" to="72.911" title="Sixteen token positions become four concept positions." %}
{% endviz %}

This compression factor is a clock, not a replacement vocabulary. The token objective remains dense at every position; the concept objective gives those token states a second predictive target at a coarser semantic scale.

## 2. A Vocabulary of Products

### Thirty-two codebooks make the latent target discrete and compositional

A continuous latent target could drift anywhere in a 4,096-dimensional space. `ConceptLMProductCodebook` instead splits each concept into thirty-two segments of 128 dimensions. Each segment chooses among 128 learned entries, so thirty-two modest codebooks compose a vast joint vocabulary without requiring one impossible monolithic table.

{% viz scene="books/ncp-archpreview/chapter-2" section="chapter-2-product-vocabulary" cue="0" from="0.000" to="77.602" title="Thirty-two codebooks make the latent target discrete and compositional." %}
{% endviz %}

The prediction path mirrors that structure. A separate linear head produces a distribution for each codebook, and the implementation combines entries by their predicted weights. The result stays differentiable while remaining anchored to learned concept pieces.

## 3. One Chunk Behind

### Repeat, shift, and fuse preserve autoregressive causality

The concept module sees only completed chunks and predicts the next concept on the slower clock. To condition token decoding, that prediction is repeated four times, shifted by a full four-token chunk, and added to token hidden states. The first four shifted positions are zeros, preventing a concept from leaking information from the very tokens it is meant to help predict.

{% viz scene="books/ncp-archpreview/chapter-3" section="chapter-3-causal-shift" cue="0" from="0.000" to="81.549" title="Repeat, shift, and fuse preserve autoregressive causality." %}
{% endviz %}

The hierarchy also exposes learned residual routes across depth. Encoder states can feed the concept stack, and aligned encoder and concept states can reach the decoder. Next-token, next-concept, and vector-quantization losses train the system together, while every emitted token remains autoregressive.

## 4. Proof Before Speed

### The faster path is sealed behind reproducible evaluation

On the same 5.73-trillion-token Stage One data, the concept model reaches the baseline model's final loss after 51.3 percent of the tokens, a 1.95-times token-convergence speedup, and finishes 0.091 loss points lower. The report also gives a 2.45-point downstream macro-average gain and a 5.99-point gain on GSM8K. The official toolkit treats those figures as claims that require an immutable evaluation ledger, not as permission to relax the comparison.

{% viz scene="books/ncp-archpreview/chapter-4" section="chapter-4-proof-gate" cue="0" from="0.000" to="97.199" title="The faster path is sealed behind reproducible evaluation." %}
{% endviz %}

That discipline extends to speculative decoding. `_DFlashStateTransaction` snapshots encoder, concept, and decoder request state before a draft mutates it; accepted tokens commit, while a rejected suffix rolls back. The formal comparison requires at least eight prompts and 1,024 forced generated tokens. Behind that exact-verification gate, concept conditioning raises mean accepted length from 5.933 to 6.180, a reported 4.17 percent relative improvement.

---

Read the [canonical paper](https://arxiv.org/abs/2609.10715), its [PDF](https://arxiv.org/pdf/2609.10715), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2609.10715), and the [official evaluation repository](https://github.com/LUMIA-Group/ncp_olmo_eval).
