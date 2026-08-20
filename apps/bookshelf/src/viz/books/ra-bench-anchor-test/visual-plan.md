# The Anchor Test — visual plan

Paper: **Can We Defend Against AI-Generated Video Attacks on Real-World Crisis Events? A Systematic Evaluation of Detectors, Generators and Social Dissemination**  
Stable ID: arXiv:2608.14391  
Hugging Face: https://huggingface.co/papers/2608.14391  
Canonical paper: https://arxiv.org/abs/2608.14391  
Official code: https://github.com/24029100313/RA-Bench

Throughline: one real crisis-video anchor is held fixed while the benchmark changes what surrounds it.

## Chapter 1 — One anchor, nine mirrors

Grounding: `README.md`, `metadata/release_inventory.json`, `metadata/ra_bench_main.csv`.

Visual machine: a persistent real-video filmstrip fans into a nine-column matrix of generated counterparts, then the matrix resolves into the released totals.

1. Reveal one real anchor and its `norm_clip_id`.
2. Duplicate the anchor's position into nine source columns.
3. Fill matched generated cells source by source.
4. Pull back to show 1,830 anchors across 10 risk categories.
5. Count 16,056 generated clips and 17,886 total videos.
6. Land on the invariant: the real anchor stays fixed.

## Chapter 2 — Count each source once

Grounding: `scripts/evaluate_predictions.py`, `EVALUATION.md` sections 1–4.

Visual machine: nine source buckets pour unequal numbers of clips into a pooled basin, then reset into nine equal-weight metric columns feeding one arithmetic mean.

1. A prediction row enters with `item_id`, `fake_score`, and `prediction`.
2. Duplicate and incomplete rows visibly bounce off the evaluator gate.
3. Pair each generated item with the real row sharing `norm_clip_id`.
4. Show unequal source counts making a pooled result lean.
5. Split into nine source-level metric columns.
6. Average the nine columns equally.
7. Distinguish `public-media` from `full` coverage.

## Chapter 3 — The five-person sieve

Grounding: `metadata/ra_bench_humanproof.csv`, `scripts/evaluate_predictions.py::humanproof_pairs`, `README.md`, `EVALUATION.md` section 3.

Visual machine: generated-video tokens pass through three reviewer apertures, then two more; only tokens judged real at all five stages enter the HumanProof chamber.

1. Start with a generated clip paired to its real anchor.
2. Three first-stage reviewers vote.
3. Two second-stage reviewers vote.
4. A single generated judgment ejects the token.
5. All-five-real tokens accumulate to 633.
6. Re-pair every survivor with its matched real anchor.
7. Show pooled HumanProof metrics as primary, with source diagnostics beside them.

## Chapter 4 — Six trips through the last mile

Grounding: `metadata/ra_bench_lastmile.csv`, `metadata/release_inventory.json`, `EVALUATION.md` LastMile table.

Visual machine: the same paired filmstrip traverses six adjacent processing gates. Its pixels, frame ticks, codec bands, and badge change deterministically while the identity thread stays attached.

1. T0 is the standardized original.
2. T1 runs VP9 then H.264.
3. T2 adds half-size spatial downsampling.
4. T3 converts to eight frames per second.
5. T4 adds an AP-style news badge.
6. T5 combines the full chain.
7. Pull back to 150 anchors × 9 sources × 6 conditions.
8. Re-trace the anchor through all four chapters and land on the paper's result: dissemination makes detection harder.
