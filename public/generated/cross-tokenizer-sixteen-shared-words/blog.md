# Sixteen Shared Words

A student and teacher can read the same response while assigning it different token boundaries. This paper asks whether filling every comparison gap actually helps the student learn. The official implementation requires strict byte-span matches and compares shared vocabulary entries. A sixteen-entry variant retains most of the measured gain.

This book explains **Rethinking Cross-Tokenizer On-Policy Distillation: From Alignment Coverage to Supervision Reliability**, by Bingxi Hou, Guochao Jiang, Guofeng Quan, Weiqing Li, Wenfeng Feng, Guohua Liu, Yuewei Zhang. Stable identifier: **arXiv:2610.08448** (v1); DOI: **10.48550/arXiv.2610.08448**. Selected from the [October 7 Hugging Face Daily Papers ranking](https://huggingface.co/papers/date/2026-10-07) at 160 upvotes, ahead of the next paper at 87, observed October 8 at 06:02 EDT.

Sources: [Hugging Face paper](https://huggingface.co/papers/2610.08448), [canonical paper](https://arxiv.org/abs/2610.08448), [PDF](https://arxiv.org/pdf/2610.08448), and [official public implementation](https://anonymous.4open.science/r/Cross-Tokenizer-OPD). Implementation claims below refer to the published anonymous source snapshot; reported experimental results refer to the paper.

### One response, two rulers

The response is decoded once and tokenized for both models. The byte aligner first requires the reconstructed content to match exactly. It scans common boundaries and keeps only groups containing one token on each side. A split token is skipped, while later strict groups can still contribute. Samples are handled independently, and end markers are paired separately.

{% viz scene="books/cross-tokenizer-sixteen-shared-words/chapter-1" section="chapter-1-strict-spans" cue="0" from="0.000" to="71.146" title="One response, two rulers" %}
{% endviz %}

Static vocabulary overlap and dynamic response coverage have different denominators. In Qwen to Llama, Table 1 reports 64.32% vocabulary Jaccard overlap but 93.56% strict student-token coverage over steps 1–100. A dictionary mismatch can therefore leave most generated positions available for strict supervision. See the paper’s section 2.3 and Table 1, and the official token_alignment.py and byte_align_ctkd.py implementations.

![Illustrative byte partitions show a one-to-two mismatch between strict matching spans.](/generated/cross-tokenizer-sixteen-shared-words/blog/chapter-1-strict-spans.png)

*Illustrative token boundaries on one response. The mismatched group is skipped by strict loss; later strict groups still align.*

### Sixteen entries, one shared comparison

At each strict position, corresponding vocabulary entries are gathered into matching columns. The compact variant chooses the student’s highest-scoring shared entries, gathers the teacher’s logits at those same indices, and normalizes both distributions on that support. Reverse Kullback–Leibler divergence weights the log-probability differences by student probability. The example script selects sixteen entries; the configuration default is 128.

{% viz scene="books/cross-tokenizer-sixteen-shared-words/chapter-2" section="chapter-2-shared-support" cue="0" from="0.000" to="77.323" title="Sixteen entries, one shared comparison" %}
{% endviz %}

Table 5 measures original full-vocabulary mass before renormalization, on responses sampled before distillation. Top-16 retains at least 93.54% of teacher mass and 94.55% of student mass on average at scorable strict positions across the three tested pairs. Table 2 tests learning: top-16 preserves at least 96% of the full-average gain over the base student. For Qwen to Llama, base, full and top-16 scores are 26.96%, 32.86% and 32.64%. The paper does not measure a speedup. See sections 3.3–4, Tables 2 and 5, topk_byte_align_ctkd.py, reverse_kl_div.py, and the top-k example script.

![Sixteen student-selected columns are shared by both normalized probability distributions.](/generated/cross-tokenizer-sixteen-shared-words/blog/chapter-2-shared-support.png)

*Illustrative probability columns, with student-selected support reused by the teacher. These bars are a teaching example, not observed model logits.*

### Filling every gap can lower accuracy

The paper’s separate span experiment multiplies probabilities along each observed token path, then squares the difference between teacher and student log probabilities. Adding this loss with any positive weight gives each mismatch group structural supervision. This is not equivalent to distribution matching, and the released strict training examples do not expose a span-loss option.

{% viz scene="books/cross-tokenizer-sixteen-shared-words/chapter-3" section="chapter-3-span-sweep" cue="0" from="0.000" to="77.648" title="Filling every gap can lower accuracy" %}
{% endviz %}

All eighteen tested positive-weight settings lower the full-average score relative to strict supervision. For Qwen to Llama the sequence is not monotonic, but every positive-weight result is below 32.86%; a weight of 1.5 gives 31.84%. Full average equally weights the math and code domain averages. Diagnostics at strict-only checkpoints find weak or negative directional agreement and a growing relative span-gradient norm. These measurements suggest a possible explanation; they do not prove that every use of mismatch groups must hurt. See equations 7–9, section 5, and Tables 6 and 11–13.

![Measured Qwen-to-Llama span-loss sweep stays below the strict-only accuracy baseline.](/generated/cross-tokenizer-sixteen-shared-words/blog/chapter-3-span-sweep.png)

*Paper Table 11: measured full-average accuracy for Qwen to Llama at step 100. All six tested positive weights finish below the strict-only baseline.*

Read the [canonical paper](https://arxiv.org/abs/2610.08448) or inspect the [official code](https://anonymous.4open.science/r/Cross-Tokenizer-OPD). Return to the [narrated O'RLY? book](/?bundle=cross-tokenizer-sixteen-shared-words).
