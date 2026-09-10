# The Routing Harness — visual plan

Grounding: NeoHorse official repository `README.md` and
`TechnicalReport_NeoHorse_v1.pdf` (arXiv:2609.08183, especially Sections 3–5).
Official source revision: `f8a36a87e9afc39fdef90c9e2c92330ea6618129`.

Throughline: **the turn**. A user turn is routed, recorded, filtered, scheduled,
distilled, evaluated, and then used to choose the next training mixture.

## Chapter 1 — The Harness Leaves a Trace

Visual machine: one turn crosses a four-tier routing field while a persistent
event tape grows behind it. The route is not only serving metadata; it becomes
the spine of a training record.

Beats:

1. A user turn enters a heterogeneous model pool.
2. The router estimates capability demand from request, dialogue, prior route,
   and execution state.
3. Four service tiers C0–C3 appear; the predicted, adjusted, and served values
   stay separate.
4. The chosen model begins a trajectory.
5. Reasoning, tool call, observation, recovery, and response append to one tape.
6. The current turn keeps its reasoning; earlier-turn reasoning is omitted.
7. Each turn remains linked to its parent trajectory and subscene.
8. The complete prediction–action–outcome record becomes training material.
9. Close on the tape returning toward the training stack.

## Chapter 2 — Quality Has Layers

Visual machine: the same event tape passes through a literal sieve. Structural
checks close tool-call pairs and branch ownership first; then six semantic
gauges judge execution, while Scene–Goal–Outcome lenses describe the task.

Beats:

1. Raw traces are not automatically trustworthy supervision.
2. Exact and near duplicates fall away; evaluation overlap is screened out.
3. Structural validation reconstructs causal order and tool-call/result pairs.
4. Complete, recoverable, and quarantined lanes separate.
5. Recoverable traces contribute only causally closed sub-trajectories.
6. Six independent semantic dimensions light up.
7. Missing evidence remains NOT_EVALUATED, never a positive verdict.
8. Scene, Goal, and Outcome label the subscene without overwriting facts.
9. Close on a structured record, not one magic quality score.

## Chapter 3 — Curriculum Keeps the Easy Cases

Visual machine: twelve turn cards sort by routing score onto a three-stage
conveyor. The same cards then become token strips; only current-turn assistant
spans receive supervised loss.

Beats:

1. Turns require different levels of capability.
2. The router produces C0–C3 support rather than using the served model as truth.
3. Hard ordering uses the tier; soft ordering uses the score-weighted mean.
4. Cards sort into three roughly equal stages.
5. Higher-scored examples enter progressively.
6. Some lower-scored examples remain in later stages.
7. Every example is used once per pass; the optimizer and learning-rate schedule continue.
8. Historical context remains visible, but loss lands only on current assistant spans.
9. Close on an ordered curriculum that changes presentation, not targets.

## Chapter 4 — The Student Closes the Loop

Visual machine: a student token distribution walks across its own generated
prefix while a fixed teacher distribution measures it. The resulting checkpoint
returns to a capability heatmap, whose deficient cells pull the next data mixture.

Beats:

1. Supervised fine-tuning learns recorded responses; deployment visits the student's own prefixes.
2. Recorded pre-response contexts are scheduled by the same three-stage routing curriculum.
3. The student generates one response from each context.
4. A fixed teacher scores each student-generated prefix.
5. Shared top-K candidates plus an “other” bin make the distributions comparable.
6. Reverse KL supplies response-normalized token supervision; only the student updates.
7. Refreshed checkpoints generate later rollouts.
8. Evaluation builds a deficiency profile across attributes, quality, outcome, and routing tiers.
9. The next mixture shifts toward underperforming regions while preserving broad coverage.
10. Report the measured macro-average gains, then close with the paper's limitation: this is an initial prototype whose successive iterations remain future work.
