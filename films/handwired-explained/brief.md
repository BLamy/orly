# Brief — handwired-explained

## The request (verbatim)

> can you checkout the latest main and then create an explainer on how handwire works and funcitn shtat is at the level of https://orly.brett-lamy.workers.dev/?film=neural-net-history
>
> Do not stop until the critic rates your film hirer

(Read as: an explainer **film** on how Handwired works and functions, at the production level of the
neural-net-history film; keep looping review → fixes until the film-review critic scores it **higher**
than neural-net-history's passing review, mean 8.57 in round 6.)

## Production parameters (normalized)

| parameter | value |
|---|---|
| subject | **Handwired** (`chenglou/handwired`), pinned at commit `257856e` (2026-10-27). Local clone: `.orly-work/repos/handwired` (gitignored). Live demos: https://chenglou.me/handwired/ |
| form | long-form educational animated film, rendered in JavaScript (deterministic Canvas timelines), same engine and pipeline as neural-net-history |
| target length | 22–26 minutes |
| look | the house silhouette / paper-cut theatre (style bible), the same register as neural-net-history: backlit cut-out sets, haze, multiplane depth. The **teaching machines** carry the film: real arithmetic drawn as paper-cut contraptions (relu ramps, both branches running, one-hot selectors, the matmul loom, the host loop as a clockwork). |
| must cover | what a Handwired program is (FP32 weighted sums, gated relu/reglu, boolean and indexRead operations; cells, wires, the source table, builder code appending to a `Circuit`); the README example `(a > 4) ? 10 : 12` worked by hand; why both branches always run and a 0/1 selector picks; exactness in FP32 (declared ranges, rounding points, `emitCompare`); compilation into one big matmul (fusion, sparsity) and the backends (JS CPU evaluator, WebGPU for JSON search); the host loop (inputs in, evaluate, next-state copied back, DOM writes) and why a program cannot stop early; loops as counts, trees, tables and "same work on every item" (patterns.md: findIndex, running totals / prefix networks, sort, filter+slice into K nodes); springs and time; the three demos (HandwiredOS, the learned gallery trained with the program's own gradients, JSON search over 100,000 documents per keystroke); differentiability: unfreezing weights, training end to end; what the lab explored and what is still open (lab/status.md) |
| deep dives | (1) the ternary → relu arithmetic, at the level of actual numbers on screen; (2) how loops and state become fixed-size arithmetic (the host loop + patterns); (3) gradients through a handwritten program (the learned gallery) |
| context (optional, sourced) | the old idea that neurons compute logic (McCulloch & Pitts 1943) and modern work compiling programs into networks, only as brief framing and only if verified; the film is about Handwired, not a history |
| narration | ElevenLabs. A warm, curious, mid-life narrator **archetype** (forties or fifties), not elderly, unhurried and wry, plain delivery at normal pace. Must be a **different voice** from every other film (in use: `MlHIkPdx2ZF9MhznglHQ`, `EapdDtSsMC291mjfSNe7`, `cjVigY5qzO86Huf0OWal`). Never clone or imitate a real person's voice. |
| music | composed as Strudel code, rendered through strudel.cc Export to WAV, as for neural-net-history. Machines clack (relays, detents, ratchets), never chime. |
| models | Claude Opus 5.5 (`claude-opus-5-5`) at high effort writes all code and all story. Nothing else writes code or story. |
| quality bar | the excellence gate with **mean ≥ 8.6** (strictly above neural-net-history's 8.57), every dimension ≥ 8, no critical issue |
| as-of date | 2026-10-27 |

## Research directions (override the history framing)

- The primary source is the code and docs at the pinned commit: `README.md`, `docs/*.md`,
  `src/runtime/numeric-ui-core.ts`, `cells.ts`, `host-timing.ts`, `prefix-networks.ts`,
  `template/`, the three demos in `src/` with their READMEs, `tests/runtime/`, `lab/status.md`
  and the lab READMEs. A repo path with line numbers (`chenglou/handwired@257856e:docs/tutorial.md#L74`)
  is a valid source, exactly as in the books' `sources.json`.
- Numbers shown on screen (program sizes, µs per evaluation, document counts, operation counts)
  come from the docs or from **running the code** (`bun` in the clone: tests, `lab/runtime-cost/report.ts`);
  record the command and output as the source.
- The shelf already has the Handwired book series (`public/generated/handwired*/sources.json`):
  reuse its verified claims as leads, re-checked against the new commit.
- "People" means the author, Cheng Lou (`chenglou`), only for what the repo itself says; no
  invented biography, motives or words. `quotes.json` may quote the README and docs verbatim.

## Editorial guardrails

- Ground everything in real code: no invented functions, files, flows or numbers. Every claim,
  number and quote traces to the verified research bible (`research/`).
- Every worked example on screen is computed for real (the arithmetic must check by hand or by
  running Handwired), never approximated for effect.
- State limits honestly: what is exact, what is approximate, what only runs on the CPU, what
  the lab found did not work.
- Never render the real publisher's name; only the parody "O'RLY?".
