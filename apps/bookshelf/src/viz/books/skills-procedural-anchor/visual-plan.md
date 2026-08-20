# The Procedural Anchor — visual plan

Paper: **Demystifying Agent Skills: Why They Work—Until They Don't** (arXiv:2608.14036)

Official source: https://github.com/zhiyuanjiang04/demystify-agent-skills

Throughline: a **procedure card** distilled from a noisy run. Each chapter asks what happens to that same card as it is constructed, compared, retrieved, and finally audited.

## Chapter 1 — From trace to procedure card

Sources: `pm2s-clean/README.md`, `pm2s-clean/scripts/export_workflows.py`, `pm2s-clean/scripts/generate_skills.py`, `src/procmem2skills/inducer/workflow.py`.

Visual machine: a long trajectory tape passes through qualification gates, becomes a workflow, then folds into normal and no-hint skill cards before the controlled evaluator.

1. Reveal a noisy event tape.
2. Move a scan head across actions and observations.
3. Qualified successes and failures survive the status gate.
4. `export_workflows.py` orders actionable steps and verification hints.
5. `generate_skills.py` branches the shared workflow input into normal and no-hint cards.
6. The evaluator holds benchmark, task set, model, provider, and trials fixed.
7. The persistent card reaches the comparison gate.

## Chapter 2 — The representation earns six points

Sources: `README.md`, `src/procmem2skills/runtime/workflow_memory.py`, `src/procmem2skills/packager/llm_skill_creator.py`, `research/failure-taxonomy/outputs/report_v1_tables.json`.

Visual machine: the same evidence is poured into two vessels. Workflow Memory stays a long context strip; Skill becomes an execution-ready card. Matched success bars rise to 55.9 and 61.9, then the skill bar opens to reveal the mechanism mix.

1. Split identical evidence into two representations.
2. Show workflow context as one rendered text strip.
3. Show the skill's ordered steps, preconditions, and verification checks.
4. Grow the matched success bars.
5. Mark the 6.06-point difference.
6. Open the skill bar: 65.7% procedural anchoring versus 4.5% explicit knowledge injection.
7. Land on stabilization, not magical fact injection.

## Chapter 3 — Retrieval is not use

Sources: `pm2s-clean/README.md`, `pm2s-clean/scripts/retrieval/run_agent_pick.py`, README retrieval results.

Visual machine: a pool-size dial stretches from 5 to 100 while three independent traces respond. Embedding precision slopes gently, actual-use precision collapses, and downstream success stays in a narrow band.

1. Reveal three independent diagnostic rails.
2. Turn the pool-size dial from five to one hundred.
3. Embedding top-one precision moves 88.3% to 76.9%.
4. Parsed actual-use precision moves 29.6% to 3.3%.
5. Downstream success stays around 36–39%.
6. Separate offline ranking, explicit agent selection, and real execution.
7. Show that exact invocation is neither sufficient nor necessary for completion.

## Chapter 4 — Audit the anchor

Sources: `research/failure-taxonomy/05_report.py`, `research/failure-taxonomy/outputs/canonical_mode_map.v1.json`, `research/failure-taxonomy/outputs/pair_labels_v1.jsonl`, `research/failure-taxonomy/outputs/labels_raw.jsonl`.

Visual machine: 8,135 trial dots flow through a 240-record open-code sample, two invalid labels fall away, and 238 labels fan into twelve modes and three categories. A procedure card succeeds on one side and breaks on brittle context on the other.

1. Fill a field representing 8,135 normalized trials.
2. Pull out the 240 open-coded records.
3. Drop two invalid records, retaining 238 labels.
4. Fan labels into twelve modes and three high-level categories.
5. Contrast a procedural anchor with a brittle assumption.
6. Show misapplied or ignored guidance as a new failure boundary.
7. Retrace tape → card → retrieval → audit.
8. End with the paper's claim: skills stabilize execution, until context breaks their assumptions.
