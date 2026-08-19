# The Runbook Remembers

This explainer covers **StateM: Reaching 95.3% Raw Accuracy, or a $15 Frontier Run, on Terminal-Bench 2.1 via Harness Scaling** by Ziheng Qin, Yaxin Lu, Zhangyang Atlas Wang, and Kai Wang. The stable paper identifier is **arXiv:2608.15089**. It was the #1 Hugging Face Daily Paper for 2026-08-18 with 221 visible upvotes when selected; the next two papers showed 115 and 108.

StateM is an agent-native runtime for turning a long procedure into explicit states, checked transitions, per-run durable records, and versioned practices. This book is grounded in the [paper](https://arxiv.org/abs/2608.15089), its [Hugging Face page](https://huggingface.co/papers/2608.15089), and the official [`henryqin1997/statem`](https://github.com/henryqin1997/statem) repository at commit `45b71b7d7a1942f561543f80317c4755db60de21`.

## Chapter 1 · When the Trace Forgets

A long agent run naturally accumulates commands, observations, retries, and repairs. That append-only trace is valuable evidence, but it becomes an unreliable place to hide the only copy of the plan. StateM separates the two concerns: a versioned runbook describes nodes and legal edges, while a per-run state record owns the current node, its entry identifier, and the obligations attached to leaving it.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-1-1.png" alt="A compact four-phase plan above a growing append-only execution trace"><figcaption>The trace keeps every event; the compact plan becomes harder to recover from that history alone.</figcaption></figure>

In `statem/core.py`, `StatemSpec` loads and validates the shared graph. `StatemRuntime.start` creates or resumes a run whose record includes `spec_hash`, `current`, `current_entry_id`, options, and history. `cur` then returns the current prompt, entry-scoped dynamic-check summary, static exit checks, and legal next edges. The model still has broad autonomy inside a phase; the durable record becomes authoritative at the boundary.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-1-4.png" alt="A versioned runbook separating plan execute verify and handoff from the execution trace"><figcaption>The runbook names legal phases and transitions instead of asking the growing trace to reconstruct them.</figcaption></figure>

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-1-8.png" alt="An authoritative run-state card over a dimmed execution trace"><figcaption>StateM's first scaling move is narrow: let a durable record own the run's position and boundary obligations.</figcaption></figure>

## Chapter 2 · The Gate Before Goto

The key operation is not “advance”; it is “prove this source state is ready to leave.” `StatemRuntime.goto` resolves the target edge, executes the current node's `before_transfer` items, loads current-entry `dynamic_before_transfer` checks, evaluates the edge condition, then runs the source `out_hook` and edge hook before it commits `current = target`. The target entry hook runs only after the new state and entry identifier exist.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-2-1.png" alt="A goto token entering an ordered rail of transition gates"><figcaption>A transition request enters an ordered protocol while the source state remains authoritative.</figcaption></figure>

The verification guide distinguishes kinds of evidence instead of treating every shell command as equally meaningful. Static checks encode invariants known when the runbook is authored. Dynamic checks live under the current node entry, so task-specific evidence cannot silently leak into a later attempt. Freshness can prove that a receipt belongs to the current run, but the guide explicitly warns that freshness is not semantic correctness.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-2-4.png" alt="A failed transition held at an evidence receipt gate"><figcaption>When a gate fails, StateM records the attempt and leaves the current pointer in the source state.</figcaption></figure>

Hooks have a different failure boundary. An `out_hook` can persist progress before departure, and an edge hook can prepare the transfer, but arbitrary external effects are not transactional. The implementation delays its own state commit until blocking hooks pass; retry or compensation for effects outside the runtime remains the runbook author's responsibility.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-2-8.png" alt="A final panel saying ready is the expensive claim"><figcaption>The evidence gate makes readiness expensive while keeping failed checks repairable in the source phase.</figcaption></figure>

## Chapter 3 · Crash, Resume, Rebind

The runbook is shared, but runtime progress is isolated by run identifier. `start` writes a distinct state record for each run, and the code updates it through a temporary file plus `os.replace`. Each phase entry receives a fresh entry ID; transition attempts and hook results accumulate in history without merging two agents' current positions.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-3-1.png" alt="One shared runbook feeding two independent run ledgers"><figcaption>Two executions reuse the same control graph while retaining independent current pointers and histories.</figcaption></figure>

On resume, `start` reloads the specification, refreshes the stored spec path and hash, ensures the current entry exists, and appends a resume event. `statem cur` restores the active prompt, checks, and legal next states; `statem history` restores the recent path. The entry hook can reload a compact durable artifact such as `progress.md`, but neither the implementation nor the paper claims to recover unsaved work, hidden model thoughts, or arbitrary external side effects.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-3-5.png" alt="Current and history query cards beside a resumed run record"><figcaption>The small ledger rebinds the active phase, evidence, and recent path after a restart or context compaction.</figcaption></figure>

`integrations/hooks/statem_stop_hook.py` uses the same state boundary at host shutdown. It allows a stop when the current state is terminal or has no outgoing transitions. Otherwise it returns a continuation prompt containing the current phase, legal next states, and the command needed to inspect the run. This is durable control, not a promise that every effect can be replayed.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-3-9.png" alt="A final panel showing the small ledger that survives a long run"><figcaption>Current phase, evidence, and recent history are deliberately small enough to survive without reconstructing the whole trace.</figcaption></figure>

## Chapter 4 · What the Harness Learns

The paper tests harness scaling by changing procedural control around fixed models. On Terminal-Bench 2.1, the reported StateM profile raises GPT-5.5 xhigh from 83.1% to 92.1%. Frozen transfer to GPT-5.6 Sol reaches a reported 95.28% raw public submission score, while GPT-5.6 Luna moves from 76.7% to 85.4%. The 95.28% headline is explicitly pre-adjudication: the submission pull request remained open, and the paper reports adjudication-sensitive alternatives separately.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-4-1.png" alt="A Terminal-Bench matrix comparing baseline and StateM profile scores"><figcaption>Nearby model generations can reuse a developed profile, but the raw 95.28 result retains its submission-status caveat.</figcaption></figure>

Exact procedural transfer is not universal. Applying the frozen GPT-oriented profile to DeepSeek-V4 Flash changes the paper's score from 82.7% to 82.0%. Retaining the runtime and failure-analysis method while adapting concrete checks under standard timeouts yields 88.09%. BusinessBench shows the same selectivity: some task families improve strongly, while mismatched profiles regress elsewhere.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-4-4.png" alt="A transfer matrix showing frozen and adapted DeepSeek results"><figcaption>The provider boundary rejects exact-profile transfer and rewards adapting the concrete practices.</figcaption></figure>

The reusable lesson is therefore a hierarchy. Durable state boundaries, visible routing, and failure analysis can travel broadly. Model-specific checks must be reshaped, and generic procedure that does not fit should be removed. Harness scaling complements model scaling by making procedural control explicit enough to test, version, adapt, and reuse—not by declaring one runbook universal.

<figure><img src="/generated/statem-durable-runbooks/blog/chapter-4-9.png" alt="A final panel saying harness scaling is selective"><figcaption>Keep what survives the boundary test, adapt what changes, and drop procedure that does not transfer.</figcaption></figure>

## Sources

- [Hugging Face Daily Paper: StateM](https://huggingface.co/papers/2608.15089)
- [Canonical paper page: arXiv:2608.15089](https://arxiv.org/abs/2608.15089)
- [Paper PDF](https://arxiv.org/pdf/2608.15089)
- [Official project page](https://henryqin1997.github.io/statem/)
- [Official code repository](https://github.com/henryqin1997/statem), source revision `45b71b7d7a1942f561543f80317c4755db60de21`
- `statem/core.py`
- `design.md`
- `docs/verification-guide.md`
- `integrations/hooks/statem_stop_hook.py`
