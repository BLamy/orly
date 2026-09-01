# The Runtime Controller

- **Paper:** [LoopArena: Benchmarking Models as Runtime Controllers for Loop Engineering](https://arxiv.org/abs/2608.28281) by Yi Wang, Haopeng Zhang, Chengxiang Huang, Rui Dai, Kaikui Liu, Piotr Koniusz, and Xiangxiang Chu
- **Stable identifier:** `arXiv:2608.28281` · DOI `10.48550/arXiv.2608.28281`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2608.28281) · selected at rank 1 with 95 visible upvotes from the [2026-08-31 ranking](https://huggingface.co/papers/date/2026-08-31)
- **Canonical paper:** [abstract](https://arxiv.org/abs/2608.28281) · [PDF](https://arxiv.org/pdf/2608.28281)
- **Official source:** [AMAP-ML/LoopArena](https://github.com/AMAP-ML/LoopArena) at source commit [`18b1af4`](https://github.com/AMAP-ML/LoopArena/tree/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc)

Long coding runs do not fail only because the coding model lacks ability. They also fail when the process chooses the wrong next move: continuing after the task is finished, stopping before the evidence is strong enough, or spending another large block of work when a focused check would settle the uncertainty. LoopArena isolates that outer-loop problem. It keeps the coding Worker fixed, gives a separate Controller only structured evidence, and asks whether that Controller can steer the run with measurable discipline.

## 1. The Loop Outside the Loop

### A fixed Worker makes the Controller the variable under test

LoopArena separates three roles. The Worker owns the persistent coding session and its tools. A temporary, read-only Reporter examines the accumulated history and produces a structured report. A tool-less Controller then chooses exactly one of `advance`, `verify`, or `stop`, and a Loop Contract turns that decision into the next bounded Worker assignment. The key experimental choice is to hold the Worker fixed while varying the Controller, so differences in outcome can be attributed to runtime control rather than a different coding model.

{% viz scene="books/looparena-runtime-controller/chapter-1" section="chapter-1-outer-loop" cue="0" from="0.000" to="56.470" title="A fixed Worker makes the Controller the variable under test." %}
{% endviz %}

The implementation makes that boundary concrete. [`CONTROL_DECISIONS`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/src/looparena/harness/protocol.py) contains only the three permitted actions, while [`continuous_session.py`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/src/looparena/harness/continuous_session.py) owns the persistent session, round transitions, budgets, and termination. A `stop` decision ends the overall task; it is not merely a pause between prompts.

## 2. Evidence Without a Second Author

### The packet preserves provenance instead of rewriting the work

The Reporter is not a second coding agent. It cannot change the workspace, and its report must cover task constraints, work history, verification evidence, and remaining uncertainty. The packet compiler combines that report with selected quotations from the actual Worker transcript, the previous control action, the remaining budget, the allowed actions, and the round index. That gives the Controller a compact view without erasing where each claim came from.

{% viz scene="books/looparena-runtime-controller/chapter-2" section="chapter-2-evidence-packet" cue="0" from="0.000" to="63.251" title="The packet preserves provenance instead of rewriting the work." %}
{% endviz %}

[`packet_compiler.py`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/src/looparena/harness/packet_compiler.py) records `previous_action`, `quoted_worker_evidence`, `budget`, `allowed_actions`, and `round_index` in the Evidence Packet. [`rendering.py`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/src/looparena/harness/rendering.py) then tells the Controller to ground every rationale in reports, quotations, and relevant decision history. The packet is therefore both compression and an audit trail.

## 3. Three Magnifications of Control

### One control policy is tested at a point, a slice, and a full task

The benchmark changes the scale of the loop while preserving its core decision. Type I freezes one real control point and asks the Controller to select the best next contract from four execution-validated candidates; it contains 90 questions and performs no new Worker run during evaluation. Type II uses 27 prepared task slices. Type III returns to the same 27 paired tasks in their full form. Those task sets contain 11 SCBench cases and 16 BeyondSWE cases, so the condensed and full-task scores can be compared case by case.

{% viz scene="books/looparena-runtime-controller/chapter-3" section="chapter-3-three-scales" cue="0" from="0.000" to="64.087" title="One control policy is tested at a point, a slice, and a full task." %}
{% endviz %}

The released [`README`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/README.md) documents all three protocols, and [`docs/protocol.md`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/docs/protocol.md) draws an important boundary: model access ends before terminal evaluation. The full-task harness evaluates the sealed result after the solve container stops, rather than letting the Controller see or optimize against the final verdict.

## 4. The Expensive Claim

### Success and cost must be read together

The released results make the tradeoff visible. GPT-5.5 leads the paper's Controller models with 87.78 percent Type I accuracy, 51.85 percent Type II strict success, and 24.69 percent Type III strict success. Across evaluated Controllers, Type II reduces estimated cost by 64.4 percent on average while preserving a model ordering close to Type III, with Spearman correlation 0.9747. That makes the condensed setting useful as a cheaper signal, but the best full-task strict success rate remains only 24.69 percent.

{% viz scene="books/looparena-runtime-controller/chapter-4" section="chapter-4-success-and-cost" cue="0" from="0.000" to="71.470" title="Success and cost must be read together." %}
{% endviz %}

These numbers come from the versioned [`results/0.1.0`](https://github.com/AMAP-ML/LoopArena/tree/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/results/0.1.0) artifacts, not a rerun performed for this explainer. [`results_summarize.py`](https://github.com/AMAP-ML/LoopArena/blob/18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc/src/looparena/commands/results_summarize.py) validates the registered outcome records and reconstructs the publication summary. The result is deliberately two-sided: runtime control can save substantial cost and sometimes raise strict success, but the remaining failure rate shows that controlling a long coding loop is still far from solved.

---

Read the [canonical paper](https://arxiv.org/abs/2608.28281), its [PDF](https://arxiv.org/pdf/2608.28281), the [Hugging Face Daily Paper page](https://huggingface.co/papers/2608.28281), and the [official LoopArena repository](https://github.com/AMAP-ML/LoopArena).
