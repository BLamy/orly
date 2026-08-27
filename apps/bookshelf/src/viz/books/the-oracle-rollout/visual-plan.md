# The Oracle Rollout — visual plan

- Paper: **Annotations as Rollouts: Efficient and Scalable Reinforcement Learning for Video MLLMs**
- Stable ID: **arXiv:2608.20492**
- Hugging Face: https://huggingface.co/papers/2608.20492
- Canonical paper: https://arxiv.org/abs/2608.20492
- Official source: https://github.com/HVision-NKU/OraRL at `a794756eb9b42988add88c39bd5157c81a569868`

Throughline: **one annotated video query and the rollout group built around it**.

## Chapter 1 — The Annotation Joins the Group

Visual machine: a persistent video strip and annotation ribbon. The ribbon is serialized into a valid answer card, then physically joins eight sampled cards as a ninth oracle row. The same task adapter scores every row while an `is_oracle_row` marker distinguishes the annotation-derived target.

Grounding: paper §3.2–3.3; `verl/trainer/ray_trainer.py::_build_oracle_append_rows`; `orarl/rewards`; `configs/orarl_9b.yaml`.

Beats:

1. Reveal one video query and its task annotation.
2. Sample eight policy response cards beneath the same query.
3. Transform the annotation through `build_oracle_response_from_ground_truth`.
4. Append the result without replacing any sampled response.
5. Sweep one task reward adapter across all nine rows.
6. Mark exactly one row with `is_oracle_row`.
7. Separate “sampled exploration” from “known-correct optimization target.”
8. Close on the complete nine-row group.

## Chapter 2 — Move the Baseline, Flip the Sign

Visual machine: a score ruler whose four policy beads come from `test_directional_gain_is_positive_only_and_policy_recentered`: `0.0, 0.2, 0.4, 0.6`, plus oracle `1.0`. The policy mean sits at `0.3`; admitting the oracle into the mean shifts it to `0.44`, visibly pushing the `0.4` rollout across zero. The ruler then resets to OraRL's oracle-excluded baseline, applies positive-only directional gain, and adds the detached `0.24` oracle anchor from `test_complete_orarl_keeps_policy_zero_mean_and_sets_oracle_anchor`.

Grounding: paper equations 6–10; `orarl/algorithm/advantages.py`; `tests/test_algorithm_advantages.py`.

Beats:

1. Place four policy rewards and their mean on a ruler.
2. Append the perfect oracle at one.
3. Shift the naive mixed mean from `0.30` to `0.44`.
4. Highlight the `0.40` rollout: better than policy average, now assigned a negative sign.
5. Restore the policy-only baseline so signs recover.
6. Show `g_q` amplifying only above-mean policy advantages.
7. Recenter transformed policy advantages to zero mean.
8. Compute the oracle separately, capped relative to the best positive policy signal.
9. Close on two deliberately separate channels: policy comparison and oracle guidance.

## Chapter 3 — Keep Both Signs

Visual machine: a mechanical sorter fed by group A from `test_strict_selection_meets_budget_with_all_fallback_paths`: policy advantages `0.8, 0.4, -0.9, -0.3, 0.0` plus oracle `0.5`. Beads split into positive/negative/zero lanes; the sorter retains row IDs `0, 2, 3, 5`, then a moment-correction press recenters and downscales the retained vector.

Grounding: paper equations 11–13; `orarl/algorithm/selection.py`; `orarl/algorithm/correction.py`; `tests/test_algorithm_selection.py`; `tests/test_algorithm_correction.py`; `configs/orarl_9b.yaml`.

Beats:

1. Feed the full advantage group into the selector.
2. Split rows by sign while keeping sequence-level magnitude visible.
3. Force-keep the oracle.
4. Retain one strongest positive policy row and two strongest negative rows.
5. Explain cross-sign and zero fallback without changing the strict budget.
6. Drop the remaining rows before actor forward/backward.
7. Show selection's mean/scale distortion.
8. Recenter, project the oracle nonnegative, and only downscale RMS.
9. Close on four retained rows carrying both reinforcement directions.

## Chapter 4 — Decode Once, Update Four

Visual machine: a decoded film strip becomes one inline multimodal contract, then fans out by reference to the rollout group. After scoring and advantage construction, the same group collapses through the sign-balanced gate into four actor-update lanes. A final camera pullback retraces every earlier machine.

Grounding: `verl/utils/multimodal_contract.py`; `verl/workers/rollout/vllm_rollout_spmd.py`; `verl/trainer/ray_trainer.py`; paper §4.1, Fig. 7, and Appendix B.

Beats:

1. Decode a video into tensors and metadata once.
2. Package inline `frames`, `metadatas`, and traceable `paths`.
3. Reuse that contract in rollout and forward consumers without re-decoding.
4. Generate eight on-policy responses and append one oracle row with the same group identity.
5. Overlap reward computation with old-log-probability computation.
6. Compute advantages on the driver, then select before the actor update.
7. Collapse nine rows to the configured four-row update group.
8. Ground the efficiency result: `62.4 s` OraRL step time versus `135.6 s` for GRPO with chain-of-thought in the paper's matched comparison.
9. Recap: serialize, compare, balance, reuse, update.
