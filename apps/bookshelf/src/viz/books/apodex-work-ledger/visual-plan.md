# The Work Ledger - visual plan

Paper: "Apodex 1.1: Scaling Agentic Intelligence for Complex Work" (arXiv:2608.23283)

Official implementation: `ApodexAI/FrontierAgent` at commit `7d38394d939244d8df8ef39ed8618a45315ba8a9`.

Throughline: one amber work item enters as a fuzzy objective, gains durable state, passes through bounded parallel execution, returns as protected evidence, and crosses one exact publication aperture.

## Chapter 1 - The Board Outside the Conversation

Grounding: `plugins/tools/task_board.py`; paper section 3.3.2.

Visual machine: a single objective ribbon folds into four task-board rows. Each row gains a stable identifier, owner, and resolution mark while a pale conversation strip repeatedly compacts behind it. The board stays still and authoritative.

Beats:

1. Introduce one long-running objective as an amber ribbon.
2. Show model history stretching and then compressing.
3. Fold the ribbon into stable board rows stored in `_BOARDS`.
4. Reveal the real item fields: description, owners, group, resolution.
5. Separate coordinator-owned resolution from runtime execution status.
6. Move from planning to execution through `finish_planning`.
7. Resolve returned work while leaving incomplete work open.
8. Compact history again; the board survives outside it.
9. End on the board as external memory and a finalization gate.

## Chapter 2 - Fan Out Through a Finite Gate

Grounding: `frontier_agent/components/agent_bus/bus.py`; `frontier_agent/components/agent_bus/spawn_guard.py`; `plugins/tools/assign_task.py`; paper section 3.3.2.

Visual machine: work-item beads queue at a four-slot rotating gate. The gate checks depth and token reservations before beads enter; a semaphore admits only the visible slots; completed beads return their slots. One session lane demonstrates FIFO reuse and the five-task cap.

Beats:

1. Split the board into independent work-item beads.
2. Register persistent sessions before dispatch.
3. Run `pre_check` across depth and reserved tokens.
4. Queue excess work at `acquire_slot` rather than dropping it.
5. Send admitted items down four parallel lanes.
6. Show a busy session taking a second item into its FIFO queue.
7. Return a slot even when a worker fails, via `finally` and `release`.
8. Stop a sticky session at `MAX_TASKS_PER_SESSION = 5`.
9. End on bounded parallelism: more organization without unbounded work.

## Chapter 3 - Fan In Without Erasing the Evidence

Grounding: `plugins/tools/collect_reports.py`; `frontier_agent/components/agent_bus/bus.py`; `frontier_agent/core/runtime/loop/tool_exec.py`; paper section 3.3.3.

Visual machine: four colored report threads race toward a loom. The first completed thread wakes the coordinator; later reports braid in. An older observation tape is compressed, but protected fan-in bands remain full-width. A soft deadline folds useful partial evidence into the result instead of cutting it off.

Beats:

1. Begin with asynchronous reports finishing at different times.
2. Drain anything already ready without blocking.
3. Wait for `FIRST_COMPLETED` only when work is genuinely running.
4. Wake on the first report, then drain companions that also finished.
5. Distinguish incomplete and failed reports as partial evidence.
6. Add live intervention before the next model call without killing workers.
7. Compact old tool bodies while preserving protected fan-in results.
8. Clamp waits at the soft deadline and consolidate useful work.
9. End on a braided evidence tape that retains provenance through a long run.

## Chapter 4 - One Manifest Owns the Finish

Grounding: `plugins/tools/assign_task.py`; `tests/test_agent_team_publish_deadlock.py`; paper section 3.3.4 and Figure 3.

Visual machine: candidate artifacts orbit one violet manifest stencil. Workspace candidates can approach but only the leased publisher and exact declared paths fit the aperture. A stale artifact and undeclared path visibly bounce. The final recap traces the amber work item through board, gate, reports, and manifest.

Beats:

1. Separate candidate production in `/workspace` from delivery in `/outputs`.
2. Show `output_paths` itself becoming the publication grant.
3. Lock the lease to one active publisher.
4. Reject a second publisher racing the same deliverable.
5. Bounce an undeclared output path at the aperture.
6. Reject an empty or stale same-named artifact against the baseline.
7. Move the lease only after the incumbent is capped or gone.
8. Admit the declared manifest and collect the deliverables.
9. Retrace objective to board to bounded work to evidence to publication.
10. End on the paper's operational boundary: the runtime makes delivery checkable, not automatically correct.
