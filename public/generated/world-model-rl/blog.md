# The Imagined Experiment

- **Paper:** [Scaling Automatic Research Agents via World Models](https://arxiv.org/abs/2608.12564) by Xiyuan Yang, Sheikh Sarwar, Jingru Cheng, Zhan Shi, Duanshun Li, Huiyuan Chen, Haiyang Zhang, Xing Fan, Chenlei Guo, Jingrui He, and Zhenyu Liao
- **Stable identifier:** `arXiv:2608.12564` · DOI `10.48550/arXiv.2608.12564`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2608.12564) · selected at rank 1 with 432 visible upvotes, ahead of 134 and 89, from the [2026-09-10 ranking](https://huggingface.co/papers/date/2026-09-10)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2608.12564) · [version 3 PDF](https://arxiv.org/pdf/2608.12564v3)
- **Official source:** [xiyuanyang45/WMRL](https://github.com/xiyuanyang45/WMRL) at source commit [`2dc8168`](https://github.com/xiyuanyang45/WMRL/tree/2dc8168713c8a3fdbd36b94e77dab737b25cb324)

Automatic research agents can generate candidate programs in parallel, but the real environments that judge those programs do not share the same economics. Each final trajectory may need its own sandbox, dependencies, accelerator slot, and wall-clock execution. World Model Reinforcement Learning, or WMRL, attacks that bottleneck by asking a frozen copy of the agent backbone to predict most execution rewards, then spending a thin stream of real runs on the corrections that keep policy learning tied to measured outcomes.

## 1. The Execution Wall

### Parallel proposals become isolated clocks at grading time

The released nine-billion-parameter configuration samples eight groups of eight trajectories per step, and each trajectory can use as many as four turns. Generation can batch that work, but a real grader cannot combine sixty-four independent programs into one forward pass. The baseline therefore spends most of its scaling budget after the agent has finished proposing solutions: every candidate enters an isolated execution path and waits behind fixed hardware capacity.

{% viz scene="books/world-model-rl/chapter-1" section="chapter-1-execution-wall" cue="0" from="0.000" to="69.939" title="Parallel proposals become isolated clocks at grading time." %}
{% endviz %}

That asymmetry is visible in the paper's nine-billion-parameter comparison. Training with real execution consumed 1,174 graphics processor hours. WMRL does not make execution cheaper; it changes which trajectories must pay for it.

## 2. A Grader That Imagines

### A same-backbone world model predicts outcomes while anchors run for real

The world-model service preserves the real grader's request contract, but replaces sandbox execution with structured prediction from the task and candidate solution. Its inference engine batches many grading requests, and the released setup uses the same base model as the agent rather than a stronger teacher. That makes the cheap path scalable, but not trustworthy on its own.

{% viz scene="books/world-model-rl/chapter-2" section="chapter-2-anchor-stream" cue="0" from="0.000" to="74.164" title="A same-backbone world model predicts outcomes while anchors run for real." %}
{% endviz %}

Two groups per training step are selected as anchors in the nine-billion-parameter recipe. Those trajectories receive both a predicted grade and a real execution grade, producing paired observations of the world model's current error. A concurrency cap of twenty-four keeps this trusted stream from recreating the original execution bottleneck.

## 3. Bend the Scores Back

### Monotone calibration corrects bias without scrambling useful rank

After two hundred anchor pairs accumulate, WMRL bins predicted rewards, averages their matched real rewards, and applies pool-adjacent-violators to fit a monotone isotonic map. The map can move an overconfident or underconfident score toward the value real execution tends to produce while preserving the ordering the world model already got right.

{% viz scene="books/world-model-rl/chapter-3" section="chapter-3-online-debiasing" cue="0" from="0.000" to="65.713" title="Monotone calibration corrects bias without scrambling useful rank." %}
{% endviz %}

The implementation refits after every sixty-four new pairs and retains a bounded recent buffer. Every non-anchor score passes through the current map before group-relative advantages are computed, so debiasing sits inside the training loop instead of being a one-time evaluation adjustment.

## 4. Let Reliability Set the Weight

### Measured disagreement decides how strongly anchors steer the update

Calibration removes systematic bias, but prediction noise remains. On anchor groups, WMRL compares centered calibrated predictions with centered real rewards and feeds the residual disagreement into an exponential running estimate. After a thirty-two-observation warmup, that estimate raises the weight of trusted anchor advantages from one toward a target of two, with a hard cap at four.

{% viz scene="books/world-model-rl/chapter-4" section="chapter-4-reliability-weighting" cue="0" from="0.000" to="88.515" title="Measured disagreement decides how strongly anchors steer the update." %}
{% endviz %}

Ordering is part of the algorithm: select anchors, score them both ways, update calibration, measure calibrated disagreement, calibrate the remaining trajectories, and only then form weighted advantages. In the reported nine-billion-parameter run, that loop reduced training compute from 1,174 to 349 graphics processor hours, a 3.4-times reduction, while the held-out averages rose from 18.8 to 21.6 on MLE-Dojo and from 31.2 to 32.8 on DSBench.

---

Read the [canonical paper](https://arxiv.org/abs/2608.12564), its [version 3 PDF](https://arxiv.org/pdf/2608.12564v3), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2608.12564), and the [official WMRL repository](https://github.com/xiyuanyang45/WMRL).
