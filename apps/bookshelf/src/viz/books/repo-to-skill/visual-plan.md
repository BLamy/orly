# Visual plan — The Missing Layer

Paper: Repo-To-Skill: Distilling GitHub Repositories Into AI4AI Skills (arXiv:2609.02749)

Official source: https://github.com/VectorSpaceLab/AREX-Skill at `ac3fe1afa80fb9a09775ecfb2b6cc3ba850a2db6`

Throughline: one research task token moves from an unfamiliar problem to a verified result. The question in every chapter is what information the token is allowed to carry.

## Chapter 1 — The Missing Layer

Visual machine: a task token crosses a decision field. With only the model and harness it spends its path budget in dead ends; a skill card adds the operational-knowledge layer and lights a direct route without changing the other two parts of the agent.

Grounding: paper Sections 1–2 and Equations 1–4.

Beats:

1. Assemble the model and harness around a task token.
2. Reveal the method, package, settings, and checks hidden in a decision field.
3. Let the token wander into dead ends and show its shrinking budget.
4. Name operational knowledge as the missing layer.
5. Add K to the agent equation and light capability plus usage policy.
6. Fold that knowledge into a portable skill card.
7. Re-run the same task with the same model and harness along the guided route.
8. Close on the controlled comparison the paper will later measure.

## Chapter 2 — Four Gates, One Skill Graph

Visual machine: a source reel is cut into evidence tiles, filtered by a moving aperture, folded into the three layers of a skill, and grown into a graph. A verifier finds one unsupported edge, sends it backward for localized repair, then stamps the accepted graph.

Grounding: paper Sections 3.1–3.3 and Appendix A.1; `create-repo-skill/SKILL.md`; `planning-and-writing.md`; `verify-repo-skill/SKILL.md`.

Beats:

1. Choose a repository or task anchor.
2. Scope the capability set Q.
3. Ground only admissible evidence X and visibly reject build output and vendored material.
4. Assemble SKILL.md, references, and scripts into one skill.
5. Split a broad source into an entry skill and focused component skills.
6. Run assertion-backed usability, safe native, and static checks.
7. Bounce an unsupported edge back as `SKILL_GAP` and repair only its owner.
8. Record surviving gaps in R instead of hiding them.
9. Admit only the verified graph G.

## Chapter 3 — Only One Branch Opens

Visual machine: a 20-row by 9-column field stands for the fixed two-level taxonomy of 20 areas and 178 families. A request beam narrows one row, one family, one repository graph, and one sub-skill; everything else stays dim and unloaded.

Grounding: paper Sections 4.1–4.2 and Appendix A.1; `repo-skills-router/SKILL.md`; `update_repo_skills_router.mjs`; `repo-skills-library-manager.ts`; `docs/architecture.md`.

Beats:

1. Establish the 1,000-repository, 5,000-plus-skill library.
2. Show the fixed taxonomy grid and its 20 areas / 178 families.
3. Give the request beam a concrete research need.
4. Select one likely area and compare a matching family.
5. Require repository evidence, rationale, and confidence for an assignment.
6. Allow multiple exact routes, but reject keyword-only or weak fits.
7. Open one repository entry and one relevant sub-skill.
8. Show the staged manager transaction and rollback boundary.
9. Close on progressive disclosure: the full library never enters context.

## Chapter 4 — Hold Everything Else Still

Visual machine: four paired benchmark gauges share a lock bar for the fixed backbone, harness, and downstream budget. The skill condition expands within each row while the baseline remains pinned, then the whole route retraces from anchor to execution.

Grounding: paper Sections 5.1–5.5, Tables 1–4, and Appendix A.2.

Beats:

1. Lock the GPT-5.5 backbone, harness, and downstream execution budget.
2. Separate skill construction from downstream running.
3. Reveal MLE-bench Any Medal: 31.11 to 72.89.
4. Reveal PaperBench replication score: 29.45 to 39.59.
5. Reveal FrontierCS score: 70.63 to 77.14.
6. Reveal PassNet AS Score: 1.343 to 1.531.
7. Label relative gains and warn that row scales differ.
8. Surface the reported task-level regressions instead of hiding them.
9. Retrace anchor, evidence, graph, verification, routing, and execution.
10. Close on the measured variable: operating context.
