# The Geometry of Coexistence

*An O'RLY? visual explainer of **“SFT Conflicts, RL Coexists: A Theoretical and Empirical Analysis of Multi-Task Learning for LLMs”** by Kejian Zhu, Zhuoran Jin, Shangqing Tu, Hongbang Yuan, Yushi Bai, Kang Liu, Juanzi Li, and Jun Zhao. Stable paper ID: [arXiv:2608.03573](https://arxiv.org/abs/2608.03573) · [Hugging Face Daily Paper](https://huggingface.co/papers/2608.03573) · [paper PDF](https://arxiv.org/pdf/2608.03573) · [official Parallel-RL repository](https://github.com/GaryStack/Parallel-RL) at commit [`7c7ad31`](https://github.com/GaryStack/Parallel-RL/commit/7c7ad319fb1e1fe383602d1404501ea4578e6b44). It was the #1 Hugging Face Paper of the Day for August 10, 2026, with 42 visible upvotes when selected.*

Multi-task training asks one checkpoint to preserve several abilities while each task changes the same weights. This paper reports a sharp split: sequential supervised fine-tuning erases earlier abilities, while the same task sequence trained with reinforcement learning improves all four measured capabilities. Its explanation is geometric. Supervised updates are large, dense, and often aligned or opposed; reinforcement-learning updates are much smaller, sparser, and nearly orthogonal. The official repository turns that observation into analysis utilities and an explicit fork-train-merge-evaluate workflow.

## Chapter 1 · One Model, Four Moving Capabilities

The paper begins with DeepSeek-R1-Distill-Qwen-1.5B and four evaluated capabilities: math, science, logic, and code. Table 1 supplies the baseline and final scores used in this chapter.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-0.png" alt="One base checkpoint with four capability rails for math, science, logic, and code"><figcaption>One set of weights has to carry four independently measured abilities.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-1.png" alt="Four sequential supervised stages moving through math, science, logic, and code"><figcaption>Multi-stage SFT passes the same checkpoint through the tasks one after another.</figcaption></figure>

After supervised fine-tuning, the final scores are 78.2, 31.1, 9.0, and 14.3, compared with baselines of 83.1, 34.9, 31.0, and 15.0. Logic shows the starkest collapse, falling from 31.0 to 9.0.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-2.png" alt="Capability rails falling after sequential supervised fine-tuning"><figcaption>The final SFT profile finishes below baseline on every capability in Table 1.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-3.png" alt="The logic score falling from 31.0 to 9.0 while other capability rails also decline"><figcaption>Training the current task can overwrite behavior learned for an earlier one.</figcaption></figure>

Resetting to the same base and applying the paper's multi-stage reinforcement-learning setup produces 86.6, 49.3, 43.0, and 17.3. Those four values all exceed their corresponding baseline.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-4.png" alt="The checkpoint resetting before a four-stage reinforcement-learning sequence"><figcaption>The comparison changes the learning rule while retaining the same four-task story.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-5.png" alt="All four capability rails rising under multi-stage reinforcement learning"><figcaption>In the reported run, the RL stages accumulate without the same collapse.</figcaption></figure>

The paper summarizes the aggregate contrast as a 23.1% average loss for multi-stage SFT and a 24.9% average gain for multi-stage RL. These are results for the evaluated models and tasks, not a claim that arbitrary task mixtures are conflict-free.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-6.png" alt="Aggregate multi-stage SFT loss contrasted with aggregate multi-stage RL gain"><figcaption>The behavioral divergence motivates looking inside the update vectors.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-7.png" alt="Question mark between supervised and reinforcement-learning weight updates"><figcaption>The next step is to measure what each task actually changed in the weights.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-1-8.png" alt="A transition from colliding task updates toward a parallel merge"><figcaption>The rest of the explainer follows the update from conflict to coexistence.</figcaption></figure>

## Chapter 2 · Measure the Update Geometry

The repository's `src/parallel_rl/analyze_full.py` compares full-weight checkpoints by subtracting a common base. For a task-specific result \(W_i\), the update is \(\Delta W_i = W_i - W_{base}\).

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-0.png" alt="A base checkpoint and the equation delta W i equals W i minus W base"><figcaption>Every task update is measured from the same origin.</figcaption></figure>

For LoRA checkpoints, `src/parallel_rl/analyze_lora.py` reconstructs the effective update from the adapter matrices and scaling factor. The corresponding merge path in `merge_lora.py` operates on those recovered deltas.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-1.png" alt="A low-rank update reconstructed as the scaled product of LoRA B and A matrices"><figcaption>The analysis compares effective weight changes rather than raw adapter files.</figcaption></figure>

The paper reports SFT update norms of roughly 6.5, 7.5, 8.9, and 6.6 across its four tasks. Pairwise cosines sit near plus or minus one, meaning large parts of the task updates occupy the same directions.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-2.png" alt="Four large supervised update vectors sharing similar directions"><figcaption>Large, dense SFT updates crowd the same parameter space.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-3.png" alt="A pairwise cosine matrix highlighting a negative 0.97 cosine between math and code"><figcaption>Math and code are almost opposite in the reported SFT geometry.</figcaption></figure>

The RL update norms are about 0.02, 0.011, 0.087, and 0.011—more than two orders of magnitude smaller than the SFT values in the comparison.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-4.png" alt="The same four task vectors contracting to tiny reinforcement-learning updates"><figcaption>Changing the learning rule dramatically shrinks the measured update scale.</figcaption></figure>

Using the paper's threshold, about 20% of RL parameters have an absolute update above \(10^{-5}\), compared with 93% under SFT.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-5.png" alt="Parameter sparsity comparison showing 93 percent for SFT and 20 percent for RL"><figcaption>The RL update is not only small; it touches far fewer parameters above the threshold.</figcaption></figure>

Normalizing the vectors removes size from the picture and exposes direction. The RL pairwise cosines are around \(10^{-5}\) to \(10^{-4}\), close to orthogonal at the paper's scale.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-6.png" alt="Normalized RL update arrows separating onto nearly perpendicular axes"><figcaption>Direction-only geometry shows room between the task updates.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-7.png" alt="Analysis utilities producing update norms and a pairwise cosine matrix"><figcaption>`analyze_lora.py` and `analyze_full.py` implement the two measurements used by this compass.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-2-8.png" alt="Small sparse nearly orthogonal update vectors beside their cosine matrix"><figcaption>Small, sparse, nearly orthogonal updates are the empirical signature of coexistence.</figcaption></figure>

## Chapter 3 · Advantage Leaves Only the Residual

The paper's explanation starts from a group of on-policy samples. Its GRPO analysis uses groups of 16 rollouts, matching `num_rollouts: 16` in the repository's paper-default configuration and the statistics path in `src/parallel_rl/score_function_stats.py`.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-0.png" alt="Sixteen rollout score vectors sampled for one prompt"><figcaption>A task update begins with several answers drawn from the current policy.</figcaption></figure>

Those score vectors share a broad group direction. Averaging makes that common component explicit.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-1.png" alt="A group mean arrow emerging from a cloud of rollout score vectors"><figcaption>The mean captures what the sampled trajectories have in common.</figcaption></figure>

GRPO's normalized advantages center the rewards within the group. Better trajectories receive positive weight, worse trajectories negative weight, and the shared component cancels from the weighted score function.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-2.png" alt="Centered advantages assigning positive and negative weights around the group mean"><figcaption>Relative reward removes the part that every rollout shares.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-3.png" alt="The large group mean disappearing and leaving a small cloud of residual vectors"><figcaption>The optimizer follows within-group residuals rather than the full score vectors.</figcaption></figure>

That cancellation changes the interference term in the paper's bound. The SFT expression depends on the absolute score norm; the RL expression depends on the much smaller within-group residual and its variance.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-4.png" alt="Two interference bounds contrasting SFT score norm with RL residual variance"><figcaption>The theoretical comparison isolates a different scale for cross-task interference.</figcaption></figure>

Table 3 reports an SFT score norm around 7.1 and an RL residual norm around \(10^{-2}\). It also reports cosine scales near \(10^{-1}\) for SFT versus \(10^{-3}\) for RL in this analysis.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-5.png" alt="Measured norm cards comparing about 7.1 for SFT with about 0.01 for the RL residual"><figcaption>The measured residual is orders of magnitude smaller than the supervised score term.</figcaption></figure>

Repeating the process for a second task produces another centered residual cloud. For compatible tasks, those clouds overlap much less than their original score directions.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-6.png" alt="Two task-specific residual clouds separating after their shared directions are removed"><figcaption>Centering makes cross-task directions easier to combine.</figcaption></figure>

Appendix D is an important boundary: task selection still matters, and the paper does not claim every pair of tasks will coexist.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-7.png" alt="A compatibility warning beside partially overlapping residual task clouds"><figcaption>The bound explains a tendency, not a universal guarantee.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-3-8.png" alt="A final card instructing the learner to subtract the shared direction"><figcaption>On-policy sampling and advantage weighting leave the small residual that the merge will use.</figcaption></figure>

## Chapter 4 · Train Apart, Merge Once

The public workflow in `scripts/train/run_parallel_tasks.sh` launches independent task jobs from one shared base model. `configs/experiment_matrix.yaml` and `paper_defaults.yaml` supply the experiment structure and paper-aligned defaults.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-0.png" alt="One base weight matrix forking into four independent task jobs"><figcaption>Parallel-RL starts each task from the same checkpoint.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-1.png" alt="Math science logic and code jobs training simultaneously"><figcaption>Independent jobs prevent the tasks from overwriting one another during training.</figcaption></figure>

`src/parallel_rl/merge_full.py` then reconstructs the final checkpoint as the base plus a merged task delta. The LoRA path implements the same idea for adapter updates.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-2.png" alt="Four sparse task updates flowing toward a shared merge plate"><figcaption>The artifact being combined is each task's update, not four whole checkpoints.</figcaption></figure>

The repository exposes `sum`, `mean`, sign-aware `ties`, and `svd` merge modes. These are concrete command-line choices, not an unspecified model soup.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-3.png" alt="A merge selector showing sum mean TIES and SVD choices"><figcaption>The merge rule is explicit and reproducible.</figcaption></figure>

For the paper's 1.5B model, Table 4 reports 94.2% average single-task retention for naive sum merging.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-4.png" alt="A summed merge reaching 94.2 percent average retention"><figcaption>Even the simplest additive merge preserves most corresponding single-task performance.</figcaption></figure>

TIES raises that reported retention to 97.4% by trimming small values, resolving sign disagreement, and combining the surviving updates.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-5.png" alt="Sign-aware trimming resolving conflicting update cells and reaching 97.4 percent retention"><figcaption>Conflict-aware merging closes more of the gap to the single-task references.</figcaption></figure>

A light adaptation stage using 5% of the training samples reaches 103.2% retention in that same result row.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-6.png" alt="A merged checkpoint receiving five percent adaptation and reaching 103.2 percent retention"><figcaption>The best reported row slightly exceeds the average single-task reference after limited adaptation.</figcaption></figure>

Table 5 removes one task update at a time. The target task drops by 7.1% on average, while the other tasks change by about +0.6%, evidence that the merged deltas remain task-specific rather than acting as one inseparable blob.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-7.png" alt="One task delta removed from the merge while its target score drops and other scores remain steady"><figcaption>Deleting a carrier mostly removes the capability it was trained to add.</figcaption></figure>

The repository is deliberately honest about its boundary. Its analysis and merge tools are runnable, but datasets, model checkpoints, external evaluators, and some task-specific launch details must be supplied by the user; `docs/reproducibility_map.md` records that separation.

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-8.png" alt="A reproducibility map separating included tools from external datasets checkpoints and evaluators"><figcaption>The release provides the mechanics without pretending to bundle every external dependency.</figcaption></figure>

<figure><img src="/generated/parallel-rl-coexistence/blog/chapter-4-9.png" alt="Parallel-RL end card listing fork train measure merge and evaluate"><figcaption>The architecture is a consequence of the measured geometry: train separately, then combine updates that learned not to collide.</figcaption></figure>

## Sources

- Zhu et al., [“SFT Conflicts, RL Coexists: A Theoretical and Empirical Analysis of Multi-Task Learning for LLMs”](https://arxiv.org/abs/2608.03573), arXiv:2608.03573.
- [Hugging Face paper page](https://huggingface.co/papers/2608.03573), selected as the #1 paper for August 10, 2026 with 42 visible upvotes.
- [Official Parallel-RL source repository](https://github.com/GaryStack/Parallel-RL), grounded at commit [`7c7ad319fb1e1fe383602d1404501ea4578e6b44`](https://github.com/GaryStack/Parallel-RL/commit/7c7ad319fb1e1fe383602d1404501ea4578e6b44).
- Repository grounding: `src/parallel_rl/analyze_lora.py`, `analyze_full.py`, `score_function_stats.py`, `merge_lora.py`, `merge_full.py`; `scripts/train/run_parallel_tasks.sh`; `configs/experiment_matrix.yaml`; and `docs/reproducibility_map.md`.
