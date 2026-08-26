# The Work Ledger

- **Paper:** [Apodex 1.1: Scaling Agentic Intelligence for Complex Work](https://arxiv.org/abs/2608.23283) by the Apodex Team (75 named authors in the arXiv metadata)
- **Stable identifier:** `arXiv:2608.23283`
- **Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2608.23283) · selected at rank 1 with 179 upvotes from the [2026-08-25 ranking](https://huggingface.co/papers/date/2026-08-25)
- **Official code:** [ApodexAI/FrontierAgent](https://github.com/ApodexAI/FrontierAgent) at source commit [`7d38394`](https://github.com/ApodexAI/FrontierAgent/tree/7d38394d939244d8df8ef39ed8618a45315ba8a9)

Apodex 1.1 is presented as a system for complex, long-horizon agent work. The interesting engineering claim is not merely that several agents can run. It is that their work can remain bounded, inspectable, and deliverable after the model conversation that launched them has become long, asynchronous, or compacted. This explainer follows the control plane implemented in FrontierAgent: an external task board, guarded fan-out, evidence-preserving fan-in, and a single manifest-governed publisher.

## 1. The Board Outside Conversation

### The plan survives the shrinking transcript

The board is process state, not prose remembered by a model. In [`plugins/tools/task_board.py`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/plugins/tools/task_board.py), `_BOARDS` is keyed by task ID and stores concrete work items with their descriptions, owners, groups, and resolution state. Planning mode deliberately limits which tools may run, and execution opens only after the board has been reviewed. That makes the board a finalization gate: message history may be summarized, but unresolved work remains explicit.

{% viz scene="books/apodex-work-ledger/chapter-1" section="chapter-1-external-ledger" cue="0" from="0.000" to="62.601" title="The plan survives the shrinking transcript." %}
{% endviz %}

The distinction between a worker's runtime status and a board item's resolution is important. A report can arrive without silently closing the planning obligation; the coordinator still has to reconcile the external ledger before [`finalize_answer`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/plugins/tools/finalize_answer.py) can treat the run as finished.

## 2. Finite Fan-Out

### Parallel work passes through four different limits

FrontierAgent does not equate more agents with unlimited concurrency. [`spawn_guard.py`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/frontier_agent/components/agent_bus/spawn_guard.py) checks nesting depth and reserves a token estimate before dispatch. The agent bus uses a semaphore for parallel slots and releases reservations even when a worker fails. [`assign_task.py`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/plugins/tools/assign_task.py) also reuses persistent specialist sessions, queues follow-up assignments first in, first out, and caps a session at five tasks.

{% viz scene="books/apodex-work-ledger/chapter-2" section="chapter-2-bounded-fan-out" cue="0" from="0.000" to="60.279" title="Parallel work passes through four different limits." %}
{% endviz %}

Those mechanisms bound different failure modes. Depth prevents recursive agent explosions; token reservations put a budget in front of creation; the semaphore limits simultaneous execution; and the per-session cap prevents stale specialist history from absorbing an indefinitely long assignment stream.

## 3. Protected Fan-In

### Partial reports remain evidence, not debris

[`collect_reports.py`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/plugins/tools/collect_reports.py) waits with first-completed semantics, then drains whatever else is already available without blocking. The shared formatter in [`fan_in.py`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/frontier_agent/components/agent_bus/fan_in.py) labels reports as complete, partial, or failed instead of erasing imperfect results. Soft deadlines let the coordinator recover useful work; hard deadlines remain the final cancellation boundary.

{% viz scene="books/apodex-work-ledger/chapter-3" section="chapter-3-protected-fan-in" cue="0" from="0.000" to="66.874" title="Partial reports remain evidence, not debris." %}
{% endviz %}

Long contexts add another hazard: compaction can discard the very report a coordinator still needs. FrontierAgent's overflow path explicitly spills protected fan-in bodies before compaction; [`plugins/tools/_overflow.py`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/plugins/tools/_overflow.py) is designed so repeated protection of the same report is idempotent rather than consuming a new recovery slot each time.

## 4. The Exact Manifest

### Delivery authority is a path manifest

The final boundary is narrower than “an agent may publish.” In [`AgentTeamAssignmentSpec`](https://github.com/ApodexAI/FrontierAgent/blob/7d38394d939244d8df8ef39ed8618a45315ba8a9/plugins/tools/assign_task.py), exact absolute `output_paths` are the authority grant. The bus admits at most one active publisher lease for a run, rejects competing publishers, and compares declared outputs with a baseline so an empty or stale file cannot impersonate new delivery. Candidate work stays in `/workspace`; only the declared artifact crosses into `/outputs`.

{% viz scene="books/apodex-work-ledger/chapter-4" section="chapter-4-exact-manifest" cue="0" from="0.000" to="69.102" title="Delivery authority is a path manifest." %}
{% endviz %}

This is an operational guarantee, not a correctness theorem. The manifest makes the handoff attributable and checkable: it tells us which worker had authority, which paths were in scope, and whether those files changed. Whether the delivered conclusion is scientifically or technically right still requires evaluation outside the publication gate.

---

Read the [canonical paper](https://arxiv.org/abs/2608.23283), its [PDF](https://arxiv.org/pdf/2608.23283), the [Hugging Face paper page](https://huggingface.co/papers/2608.23283), and the [official FrontierAgent repository](https://github.com/ApodexAI/FrontierAgent).
