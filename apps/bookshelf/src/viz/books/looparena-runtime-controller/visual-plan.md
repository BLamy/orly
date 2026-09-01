# LoopArena visual plan

Paper: LoopArena: Benchmarking Models as Runtime Controllers for Loop Engineering

Stable ID: arXiv:2608.28281

Official code: https://github.com/AMAP-ML/LoopArena at `18b1af4a206a60be2b9a7bb347f5c7669ce8c3cc`

Book slug: `looparena-runtime-controller`

Cover title: The Runtime Controller

Throughline: one coding task moving through increasingly rigorous control and evaluation.

## Chapter 1 — The loop outside the loop

Visual centerpiece: a persistent orbital track. The task moves through Worker, a temporary read-only Reporter, an Evidence Packet, a tool-less Controller, and a Loop Contract, then returns to the same Worker conversation.

1. Establish one long-running repository task and the completion-risk problem.
2. Animate the Worker alone in the inner loop, with repository/tool activity accumulating.
3. Pause the Worker at a natural boundary; fork a temporary Reporter orbit.
4. Show the Reporter reading conversation plus workspace through read-only apertures.
5. Compile the Reporter's four-part report and cited turns into the Evidence Packet.
6. Move the packet to the Controller, visually removing repository tools from its reach.
7. Split the Contract into advance, verify, and stop; choose verify for the live task.
8. Render the bounded assignment back into the persistent Worker conversation.
9. Pull back to the complete outer loop and show stop handing the workspace to the evaluator.

Grounding: paper Sections 1 and 2.2; `docs/protocol.md`; `harness/continuous_session.py`; `harness/packet_compiler.py`; `harness/rendering.py`.

## Chapter 2 — Evidence without a second author

Visual centerpiece: a transcript tape passing through a citation scanner and being folded into a structured packet. Unknown evidence labels bounce away; cited Worker turns pass through unchanged.

1. Lay out the accumulated Worker transcript as evidence-labelled turns.
2. Fork the Reporter view without altering the persistent tape.
3. Fill the four required report fields: task context, current state, verification, open issues.
4. Sweep the citation parser across bracketed evidence labels.
5. Reject an unknown label and accept known labels in first-appearance order.
6. Lift the complete cited Worker turns into quoted evidence, without re-summarizing them.
7. Add previous action, round index, and the remaining main-Worker response budget.
8. Stamp the allowed actions: advance, verify, stop.
9. Close on a compact read-only packet whose claims remain attached to primary Worker turns.

Grounding: `harness/packet_compiler.py`; `harness/validation.py`; `harness/rendering.py`; paper Appendix C.

## Chapter 3 — Three magnifications of control

Visual centerpiece: one 27-task ribbon under a camera lens. The lens first shows a full task, then a prepared task slice, then freezes one decision point and fans out four replayed Contracts.

1. Show 27 paired source tasks from 11 SCBench and 16 BeyondSWE cases.
2. Magnify Type III: original state through complete implementation, verification, and stopping.
3. Mark its observed 139.81 to 288.90 Worker-turn range and 8.60 to 13.46 control cycles.
4. Crop the same ribbon to a prepared intermediate workspace for Type II.
5. Show the cumulative-through-stage evaluator and 51.38 to 80.12 Worker-turn range.
6. Quantify the measured 64.4 percent average cost reduction without calling Type II a replacement.
7. Freeze a restorable control point for Type I and fan out four complete candidate Contracts.
8. Replay all four under two matched schedules; reject an item without the same unique winner.
9. Pull back to 90 Type I questions, 27 Type II slices, and 27 paired Type III tasks.

Grounding: paper Sections 2 and 3 and Table 1; `harness/type1_benchmark.py`; `commands/type2_run.py`; `commands/type3_run.py`.

## Chapter 4 — The expensive claim

Visual centerpiece: a five-row results matrix that transforms from decision accuracy to task-slice strict success to full-task strict success, with cost bars and rank threads.

1. Define strict success as evaluator pass plus protocol validity, across three repeats per task.
2. Populate Type I Contract Accuracy for the five Controllers.
3. Transform to Type II Strict Success Rate while holding Worker and Reporter fixed.
4. Transform again to Type III; highlight the 16.05 to 24.69 percent Controller range.
5. Compare fixed control and no control: 46.91 versus 39.51 on slices, tied at 18.52 on full tasks.
6. Animate the paired Type II cost bars shrinking by 64.4 percent on average.
7. Tie the Type II and Type III Controller orderings with Spearman rho 0.9747.
8. Emphasize that the strongest observed full-task result is still 24.69 percent.
9. Retrace task to packet to Contract to evaluator; the benchmark makes controller quality measurable, not solved.

Grounding: `results/0.1.0/manifest.json`; `results/0.1.0/outcomes.jsonl`; `commands/results_summarize.py`; paper Sections 4 and 5 and Table 2.
