# The Oracle Rollout

- **Paper:** [Annotations as Rollouts: Efficient and Scalable Reinforcement Learning for Video MLLMs](https://arxiv.org/abs/2608.20492) by Yunheng Li, Guohong Mu, Hao Li, Shengsheng Qian, Dingwen Zhang, Qibin Hou, and Ming-Ming Cheng
- **Stable identifier:** `arXiv:2608.20492`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2608.20492) · selected at rank 1 with 98 upvotes from the [2026-08-26 ranking](https://huggingface.co/papers/date/2026-08-26)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2608.20492) · [PDF](https://arxiv.org/pdf/2608.20492)
- **Official code:** [HVision-NKU/OraRL](https://github.com/HVision-NKU/OraRL) at source commit [`a794756`](https://github.com/HVision-NKU/OraRL/tree/a794756eb9b42988add88c39bd5157c81a569868)

The paper starts with a useful change of role for training annotations. An annotation is not only a target used before reinforcement learning, nor only an answer used to score a sampled response. OraRL serializes it in the model's response format and inserts it into the same group as the policy's sampled rollouts. That creates a reliable positive trajectory, but it also creates a statistical problem: a privileged answer should guide the update without redefining what counts as above average for the policy itself.

## 1. The Annotation Joins the Group

### The label becomes a trajectory

The repository's trainer constructs an oracle row beside each group of sampled policy rows and marks that row explicitly with `is_oracle_row`. The annotation is passed through the task adapter's serializer, so its token sequence has the same response-side shape as a generated answer. This is why the paper calls the mechanism annotation-as-rollout: the extra row participates in reward and optimization rather than remaining an external label. The data contract in [`verl/trainer/ray_trainer.py`](https://github.com/HVision-NKU/OraRL/blob/a794756eb9b42988add88c39bd5157c81a569868/verl/trainer/ray_trainer.py) keeps that identity available to the later advantage, selection, and correction stages.

{% viz scene="books/the-oracle-rollout/chapter-1" section="chapter-1-annotation-rollout" cue="0" from="0.000" to="49.551" title="The label becomes a trajectory." %}
{% endviz %}

Appending the annotation is deliberately different from replacing a sampled answer. The policy still supplies its original group, while the oracle adds one known-positive row. That distinction preserves the evidence needed to estimate the policy's own baseline.

## 2. The Policy Keeps Its Baseline

### A privileged answer must not flip a policy sign

If the oracle reward participates in the ordinary group mean, it can move the baseline above a policy rollout that was previously better than its peers. The worked values in [`tests/test_algorithm_advantages.py`](https://github.com/HVision-NKU/OraRL/blob/a794756eb9b42988add88c39bd5157c81a569868/tests/test_algorithm_advantages.py) make the inversion concrete: policy rewards `0.0, 0.2, 0.4, 0.6` have mean `0.3`, but adding an oracle reward of `1.0` raises the five-row mean to `0.44`. The `0.4` rollout changes from positive to negative even though no policy outcome changed. [`orarl/algorithm/advantages.py`](https://github.com/HVision-NKU/OraRL/blob/a794756eb9b42988add88c39bd5157c81a569868/orarl/algorithm/advantages.py) avoids that by centering policy advantages on policy rows only, then using the policy-to-oracle gap as separate guidance.

{% viz scene="books/the-oracle-rollout/chapter-2" section="chapter-2-policy-baseline" cue="0" from="0.000" to="71.006" title="A privileged answer must not flip a policy sign." %}
{% endviz %}

The gap is not a second baseline. The implementation turns its positive part into a bounded directional gain for already-positive policy advantages, and computes a detached oracle anchor separately. In the repository's reference fixture, that anchor is `0.24`; detaching it prevents the privileged row from becoming a moving target inside the same update.

## 3. Prune Without Erasing the Gradient

### Keep the oracle and both policy signs

Video rollouts are expensive, so the method does not retain every row for the optimizer. [`orarl/algorithm/selection.py`](https://github.com/HVision-NKU/OraRL/blob/a794756eb9b42988add88c39bd5157c81a569868/orarl/algorithm/selection.py) implements strict sign-balanced selection: always keep the oracle, then retain strong positive and hard negative policy rows. With eight policy samples and a one-half keep ratio, the paper's recipe produces a four-row update group containing the oracle, one positive, and two negatives. The selection test fixture verifies the exact retained row IDs rather than relying on an approximate distribution.

{% viz scene="books/the-oracle-rollout/chapter-3" section="chapter-3-sign-balanced-selection" cue="0" from="0.000" to="63.763" title="Keep the oracle and both policy signs." %}
{% endviz %}

Pruning changes the selected subset's moments, so [`orarl/algorithm/correction.py`](https://github.com/HVision-NKU/OraRL/blob/a794756eb9b42988add88c39bd5157c81a569868/orarl/algorithm/correction.py) recenters the selected policy advantages, keeps the corrected oracle contribution nonnegative, and rescales with a clipped root-mean-square ratio. The correction preserves an optimization signal with both directions; it does not claim to reconstruct the discarded rows.

## 4. Reuse the Expensive Part

### Decode once, then fan out the responses

The efficiency result depends on data movement as well as the loss. [`verl/utils/multimodal_contract.py`](https://github.com/HVision-NKU/OraRL/blob/a794756eb9b42988add88c39bd5157c81a569868/verl/utils/multimodal_contract.py) defines the multimodal payload shared by the trainer and rollout worker: decoded frames, metadata, and source paths travel together under a checked contract. Multiple text responses can therefore refer to one decoded video payload instead of turning every rollout into another video-decoding job.

{% viz scene="books/the-oracle-rollout/chapter-4" section="chapter-4-decode-once" cue="0" from="0.000" to="63.577" title="Decode once, then fan out the responses." %}
{% endviz %}

In the paper's matched comparison, the full OraRL configuration reports `62.4` seconds per step, while group training with chain-of-thought supervision reports `135.6` seconds per step. That number is an end-to-end measured result for the paper's setup, not a universal decoder benchmark. The repository and the ablations make the mechanism inspectable: reuse the multimodal payload, prune the update group, and retain the advantage geometry that the oracle was added to improve.

---

Read the [canonical paper](https://arxiv.org/abs/2608.20492), its [PDF](https://arxiv.org/pdf/2608.20492), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2608.20492), the [project page](https://orarl.github.io/), and the [official OraRL repository](https://github.com/HVision-NKU/OraRL).
