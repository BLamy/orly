# The Answer Audits Itself — visual plan

Paper: **AREX: Towards a Recursively Self-Improving Agent for Deep Research**
(`arXiv:2607.21461`).

Official implementation: `https://github.com/VectorSpaceLab/arex-model`.

Throughline: a **provisional answer**. It starts as one expensive point in a
large search space, accumulates evidence through the released quickstart,
passes through the paper's confidence gate, survives context consolidation,
and becomes a training trajectory whose decisive turns receive extra credit.

The public repository is a concise inner-loop quickstart. The paper's outer
self-improvement loop and `update_context` tool are described as paper
mechanisms, not misrepresented as code shipped in the quickstart.

## 1. The Expensive Guess

Visual machine: a candidate point searches a sparse particle field for the
tiny overlap of four constraint lenses. Once found, verification replaces the
search field with four direct checks.

Grounding: paper sections 1 and 2.1; repository `README.md` overview.

## 2. Evidence on a Tape

Visual machine: the released `AREXReActClient.run` grows a message tape. XML
tool calls are parsed, dispatched to the three real HTTP-backed tools, and
returned inside `tool_response` observations until no call remains.

Grounding: `src/arex_client.py`, `src/arex_http_tools.py`,
`src/arex_tool_schema.py`, and `src/arex_prompts.py`.

## 3. The Confidence Gate

Visual machine: a structured provisional answer enters a gauge. High
confidence accepts; low confidence plus a recoverable trajectory preserves
evidence and narrows the next objective; low confidence plus an unrecoverable
trajectory restarts.

Grounding: paper sections 2.2.2 and 2.3; repository `web/index.html` framework
copy and figure caption.

## 4. Keep the State, Lose the Clutter

Visual machine: a long interaction ribbon folds into a compact six-row state.
Verified findings and source identifiers stay; duplicate observations,
superseded conclusions, and obsolete plans fall away; fresh steps append after
the compact state.

Grounding: paper section 2.2.1; repository `README.md` context-management
claims. The scene labels this as the paper's learned `update_context` tool,
which is not present in the public quickstart.

## 5. Reward the Turning Point

Visual machine: a long training trajectory first receives one flat outcome
wave. Then decisive evidence and correction steps rise above the rest as
bounded key-step bonuses, while hierarchical averaging prevents longer
trajectories from dominating. The closing beat retraces the full answer.

Grounding: paper sections 3.2, 4.1, and 4.2; repository `README.md` benchmark
and model-variant descriptions.
