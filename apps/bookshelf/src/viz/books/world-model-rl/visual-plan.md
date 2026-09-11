# The Imagined Experiment — visual plan

Paper: **Scaling Automatic Research Agents via World Models** (arXiv:2608.12564)

Official implementation: `xiyuanyang45/WMRL` at `2dc8168713c8a3fdbd36b94e77dab737b25cb324`.

Throughline noun: **the experiment**. Each chapter follows one research-agent experiment from generated solution, through a cheap predicted grade, through a thin stream of real execution, into the policy update.

## Chapter 1 — The Execution Wall

Grounding: paper Sections 1 and 3.1; `ml_research/configs/wmrl_9b.yaml`; `ml_research/agent/loop.py`; `ml_research/agent/grader.py`.

Visual machine: a persistent 8-by-8 field of experiment particles. Generation compresses the 64 trajectories into a shared batched wave, while execution turns them into isolated hourglasses that stack against a fixed sandbox wall.

1. Draw one research question and fan it into eight groups of eight trajectories.
2. Sweep a shared generation wave across all 64 particles to show batching.
3. Move the same particles toward the execution boundary.
4. Turn each particle into an isolated sandbox timer; the queue length grows while the generation lane stays open.
5. Spotlight the repository settings: eight groups, eight trajectories, four turns, and isolated execution.
6. Pull back to compare the 9B real-execution budget, 1,174 GPU-hours, with the later WMRL budget, 349 GPU-hours.
7. Fade the machinery and land the problem: grading, not generation, sets the ceiling.

## Chapter 2 — A Grader That Imagines

Grounding: paper Sections 3.2 and 3.3; `ml_research/world_model/server.py`; `ml_research/world_model/prompts.py`; `ml_research/cluster/train_entry.py`; `wmrl/anchor.py`.

Visual machine: the same 8-by-8 experiment field flows through a world-model lens. Most rows become predicted-score ribbons in one batch; two selected rows split, visiting both the world model and the real sandbox to produce paired scores.

1. Reintroduce the experiment field and the expensive sandbox lane.
2. Morph the wall into the `POST /grade` interface shared by both graders.
3. Pass all experiments through the world-model lens in one continuous batch.
4. Reveal that the world model uses the same backbone as the agent and predicts rather than executes.
5. Select two anchor groups, matching `anchor_groups_per_step: 2` in the 9B config.
6. Split each anchor row into predicted and measured copies, then join them into paired dots.
7. Show the anchor scheduler floor and concurrency cap of 24 as a budget gauge.
8. Fade to the key limitation: predicted grades are fast, but their bias and noise remain visible as offset and jitter.

## Chapter 3 — Bend the Scores Back

Grounding: paper Equation 4 and Appendix D; `wmrl/debias.py`; `ml_research/cluster/train_entry.py`; `ml_research/configs/wmrl_9b.yaml`.

Visual machine: anchor score pairs accumulate on a square plot. Their raw cloud bends away from the identity line; ten bins condense it, pool-adjacent-violators merge descending steps, and a monotone piecewise map straightens every predicted score before GRPO sees it.

1. Draw predicted score against real score and seed a deterministic biased cloud.
2. Reveal the identity diagonal as the target.
3. Accumulate anchor pairs until the on-screen counter reaches 200, the implementation's minimum.
4. Collapse the cloud into ten equal-width bin means.
5. Animate adjacent descending blocks pooling into a monotone staircase.
6. Transform the staircase into the calibration map and slide raw predictions through it.
7. Show a before/after within-group ranking: order preserved, spacing corrected.
8. Advance the refit odometer by 64 new pairs and replace old points from the capped recent buffer.
9. Quiet the plot and land the claim: the map removes systematic error without inventing ground truth.

## Chapter 4 — Let Reliability Set the Weight

Grounding: paper Equation 5, Sections 3.3–3.4 and Table 1; `wmrl/denoise.py`; `wmrl/advantage.py`; `wmrl/loop.py`; `ml_research/cluster/verl_patches.py`.

Visual machine: two persistent gradient streams drive one policy arrow. The abundant world-model stream jitters; the scarce anchor stream is steady. A balance beam changes their contribution from the measured calibrated disagreement, then the final experiment retraces the whole loop.

1. Draw many small noisy world-model gradient arrows and a few aligned anchor arrows.
2. Measure normalized within-group disagreement on an anchor group.
3. Feed that residual into an exponentially weighted gauge with half-life 64 and warmup 32.
4. Raise the anchor multiplier from one toward the target of two as disagreement grows, capped at four.
5. Fuse the two streams; the resulting policy arrow steadies while neither stream disappears.
6. Show the code ordering from `wmrl.loop`: select anchors, score twice, refit, measure residual, calibrate the rest, then form advantages.
7. Compare 9B real execution and WMRL: 1,174 versus 349 GPU-hours; MLE-Dojo 18.8 versus 21.6; DSBench 31.2 versus 32.8.
8. Retrace the experiment: generate, imagine, anchor, calibrate, weight, update.
9. Fade all supporting marks below 0.15 and finish on one clean loop and the title.
