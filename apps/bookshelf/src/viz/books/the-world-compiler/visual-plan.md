# The World Compiler — visual plan

Paper: “Agentic Game Development as a Verifiable Trajectory Data Engine for Scaling World Models” (arXiv:2608.25518).
Official source: `LanceZPF/cardinal-preview` at `ed46cb24778dbe69bf086391af7de736e851eb66`.

Throughline: one proposed game scene becomes executable evidence, then a linked trajectory, then an auditable claim.

## Chapter 1 — Make the World Executable

Grounding: paper sections 1 and 4; `scripts/unityscenebench/run_author_design_exp1_true_generation_by_training.py`.

Visual machine: a small rail-platform scene is assembled from the script’s real asset names. The same persistent scene moves through import, render, snapshot, and engine checks. Failure modes strike the scene like diagnostic scan lines, then resolve into a pass record.

Beats:

1. Contrast a fuzzy image score with an executable scene.
2. Sample a fresh model-conditioned scene plan.
3. Import real FBX assets into Unity.
4. Assemble and render the candidate while writing a snapshot.
5. Sweep the six released failure modes across the scene.
6. Localize an overlap and an off-platform asset.
7. Repair the same scene and rerun the checks.
8. Turn the accepted scene into grounded trajectory evidence.

## Chapter 2 — Two Judges at the Gate

Grounding: paper sections 4 and 5; `agentic_artifacts/unityscenebench/main_eval_720/results.json`; `agentic_artifacts/unityscenebench/scaling_generation/true_generation_720_all/SUMMARY.md`.

Visual machine: one candidate rides a balance between dense engine diagnostics and sparse human acceptance. The structural gate visibly controls whether either reward can count. The scene then morphs into the released method and result bars.

Beats:

1. Establish that an engine is a partial verifier, not an oracle.
2. Close the structural gate on an invalid candidate.
3. Let dense engine diagnostics localize the repair.
4. Add the developer’s global acceptance decision.
5. Compare fuzzy, supervised, human-only, engine-only, and full RLHEV.
6. Reveal the gated reward equation from the paper.
7. Plot the eight-seed UnitySceneBench primary means.
8. Compare true-generation quality and pass rate for full RLHEV and engine-only training.

## Chapter 3 — Keep the Repair

Grounding: paper section 5 and appendix protocol description; `agentic_artifacts/ARTIFACT_POLICY.md`; `schemas/REVIEWER_SCORE_SCHEMA.md`; `agentic_artifacts/manifests/manifest_summary.json`.

Visual machine: a single trajectory tape grows field by field—intent, object, state, action, engine output, rendered evidence, human decision, repair link. A rejection folds back through the repair link to the exact object, then a release boundary removes raw prompts while preserving sanitized audit artifacts.

Beats:

1. Start with an accepted image and ask what training signal it loses.
2. Extend the Unified World-Development Protocol tape.
3. Keep stable object identity attached to every state and action.
4. Attach engine output and rendered evidence to the same step.
5. Record human rejection instead of hiding it.
6. Follow the repair link back to the failing object.
7. Compile accepted states, failures, and repairs into different training examples.
8. Show the public release boundary: sanitized metrics and manifests remain; raw interactive traces do not.

## Chapter 4 — Audit the Claim

Grounding: `scripts/verify_release_reproduction.py`; `REPRODUCTION_CHECK_REPORT.md`; `agentic_artifacts/generalization/paper_generalization_table.csv`; `agentic_artifacts/embodied/FINAL_MAIN_METRIC_TOTAL_TABLE_20260706.md`.

Visual machine: a verifier conveyor hashes files, compiles scripts, and lights result checks. It then fans into three evidence panels—main evaluation, transfer, embodied diagnostics—before the camera pulls back to the complete loop.

Beats:

1. Turn the paper’s claim into files a verifier can inspect.
2. Verify fifty-two hashes, ten Python scripts, and one shell script.
3. Separate the eight-seed mean from the single figure seed.
4. Check true-generation quality and pass rate from released result files.
5. Check distribution and cross-engine transfer rows.
6. Check the three embodied diagnostics without pretending their gains are uniform.
7. State the verifier’s boundary: it checks released artifacts but does not rerun full GPU or engine training.
8. Retrace executable scene, two judges, linked repair, and audit trail.
