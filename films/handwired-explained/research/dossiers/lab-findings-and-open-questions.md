# Dossier: The Lab — What Was Tried, What Did Not Work, and What Is Still Open (to 2026-10-27)

Topic id: `lab-findings-and-open-questions` · era: June 2026 – 2026-10-27 · subject pinned at
`chenglou/handwired@257856e` (local clone `.orly-work/repos/handwired`).

Method: every repo claim below was read directly from the pinned commit (file + line numbers given as
`R-path#Lnn`, which resolve to `https://github.com/chenglou/handwired/blob/257856e/<path>#Lnn`).
Git facts come from `git log` in the clone. External reception was checked through the Hacker News
Algolia API, the fxtwitter API for the launch post, and web search on 2026-10-27. Prior-art
references named in the repo were checked against arXiv / publisher pages. **Not done:** no lab
script was run for this dossier (an attempt to run `bun lab/cascade-argmax/report.ts` was blocked by
the sandbox), so every number below is the number the repo's own records state, not a fresh rerun.

Date note for the art/story team: the brief says "pinned at commit 257856e (2026-10-27)". 2026-10-27
is the film's as-of date. The commit itself is dated **2026-10-16 17:33:49 -0700** (= 2026-10-17
00:33 UTC). No newer commit was on `main` as of 2026-10-27.

---

## 1. Summary

Handwired's `lab/` is where the project tested its own bigger claims, and its records are unusually
candid. The arc has three beats.

1. **July 2026, round one.** Four experiments (generative fields, event window, trace compiler,
   gather lowering) were "adversarially verified (29 confirmed findings fixed, 17 refuted)" and
   produced confident conclusions: layouts interpolate validly, recurrence becomes "event-clocked,
   not frame-clocked", gather lowering "discovered hard attention" (R-lab/research-sweep.md#L23-L30;
   commit `a137ccd`, 2026-07-08). Separately, an **undated** earlier report on a learned interpreter
   found 0/20 (R-lab/reassessment-2026-09-03.md#L21). [Fact-check: the learned interpreter was NOT one
   of the four July round-one experiments, and the repo never dates the 0/20 report; `lab/learned-interpreter`
   first appears in commit `c6bf933` on 2026-09-03. Say "an earlier report", not "in July".]
2. **3 September 2026, the reassessment.** An independent audit (three audits plus reruns) reversed
   the headline learning failure (it was an Adam-epsilon artifact: scaling every loss by 10^6 took
   both tasks from 0/20 to 20/20), found that some correctness checks "compare implementations that
   share the same mistake" (a compiled function returned 4 where JavaScript returns 3 while the
   harness reported zero mismatches), found a wrong gradient (d(3·v)/dv at 0 reported as 0), found
   that the event demo dropped information, and "retired" ten earlier claims, replacing each with a
   narrower statement (R-lab/reassessment-2026-09-03.md#L5-L9, #L61-L70, #L76-L78, #L84-L88,
   #L109-L124). Fixes landed the same day in commit `c6bf933` (274 tests passing).
3. **September–October 2026, honest bookkeeping.** `lab/status.md` became the single page of current
   results, known production issues, open decisions, "Still open", and "Parked and deferred". Many
   experiments were removed or archived behind two git tags (`exploration-2026-09`,
   `json-regex-experiments-2026-10`). The last commit (`257856e`, 2026-10-16) merged a two-day,
   238-commit experiment: training a strict table parser's *unused* entries so it recovers from
   errors. It was a clear win on JSON. On TOML it failed **"by the rule fixed beforehand"** in a final
   test that ran once (gradient descent alone below the one-rule baseline); on a bison-generated LR
   table, gradient descent alone "did not carry over" on validation data (bison's final test has not
   run). On both, filling the same entries by trial and error did carry over, and so did the "fairer
   starts" (one hand-set line rule on TOML; realistic mistakes in the bison training data), the latter
   on validation data only. On TOML's final test, gradient descent + trial and error with TOML mistakes
   in the data came out level with the 39 hand-written rules (98.3/82.7 vs 98.7/81.7) (R-commit
   257856e message; R-lab/recovery-parser/README.md#L1-L5, #L89-L101, #L137-L147). [Fact-check:
   "pre-registered" and "rescued only by fairer starts measured on validation data" were overstated.]

What is still open (R-lab/status.md#L242-L246): whether fractional examples identify addition
grouping; scaling program learning past a complete loss table; learning a search guide across task
families; discovering shared query/key functions; evidence from real human tasks. "GPU execution, a
general JavaScript compiler, learned arbitrary abstractions, and a full learned UI runtime are not
delivered by these experiments."

Public reception by 2026-10-27: a viral launch post on X (2026-10-15), several HN submissions, a Show
HN (45 points, 12 comments), one aggregator write-up (AlphaSignal). **No public discussion of the lab,
the reassessment, or the recovery-parser experiment was found.**

---

## 2. Timeline

| Date | Event | Source |
|---|---|---|
| 2026-06-03 | First commit, "Create numeric UI atom lab" (`3d2c717`). | git log; https://github.com/chenglou/handwired/commit/3d2c717 |
| June 2026 | The "June 2026 plan" considers a `hardAttend` operation: score candidates against a query, pick a winner with a tie rule, retrieve its values. | R-lab/status.md#L257 |
| July 2026 | Lab round one: four experiments built from briefs, "adversarially verified (29 confirmed findings fixed, 17 refuted)". | R-lab/research-sweep.md#L23-L30 |
| July 2026 | Parked work tried and set aside: compiler mutation tests, executor split, precompiled demos, portable tensor format, layer scheduling, relation layout, GPU megakernel, slot reuse. | R-lab/status.md#L250-L260 |
| before 2026-09-03 (undated) | "The previous report" on the learned interpreter found 0/20 on both tasks and proposed moving to structured discrete search. The repo gives no date; the folder was first committed in `c6bf933` (2026-09-03). Do not say "July". | R-lab/reassessment-2026-09-03.md#L21; git log -- lab/learned-interpreter |
| 2026-09-03 | The reassessment note written "before implementation"; fixes and new experiments (reusable layout, user effort, data adapter) land in commit `c6bf933`, "Verified: 274 tests pass". | R-lab/reassessment-2026-09-03.md#L1-L3; git `c6bf933`; R-lab/status.md#L275 |
| 2026-09-12 to 14 | `lab/ui-exploration`: 24 prototypes on how far circuit UI goes. | R-lab/status.md#L290; R-lab/research-sweep.md#L5 |
| 2026-09-14 | Cheng chooses the recommended option for runtime decisions 1–3 (index read instruction, `emitCompare`, etc.). | R-lab/status.md#L7 |
| 2026-09-15 | "Parked" and "Deferred" move from research-sweep.md to status.md; `todo.md` removed; `tricks.md` becomes `expressions.md`, "with Cheng's approval". | R-lab/status.md#L3; R-lab/research-sweep.md#L5 |
| 2026-09-16 | Tag `exploration-2026-09` (`d01b763`) keeps every removed path; 8 of 24 prototypes removed or merged; reassessment script removed; HandwiredOS runs on WebGPU as 24 shaders at 2.2 ms per evaluation vs 81 µs on CPU. | git tag; R-lab/status.md#L259, #L287-L290; R-lab/reassessment-2026-09-03.md#L190 |
| 2026-09-17 | Temporary "traditional JavaScript task" demos: JSON highlighter, regex search, text rows, many paragraphs on GPU, Knuth-Plass line breaking. Full test run 989 passing. | R-lab/status.md#L232-L240, #L275 |
| 2026-09-17 to 18 | Term-order probe (sort sum terms by content hash). Decision: "not switched". | R-lab/status.md#L91-L93 |
| 2026-10-06 | Repo renamed from Indirect to Handwired, IndirectOS to HandwiredOS (`e86f5ed`). | git log; R-lab/status.md#L287 |
| 2026-10-13 | Demo site; 100,000 JSON documents searched per keystroke on WebGPU (Apple M5 Max, headless Chrome 155). | R-lab/status.md#L95-L121 |
| 2026-10-14 | JSON highlighter and regex search experiments removed; tag `json-regex-experiments-2026-10` at `4a80450`; `lab/briefs` removed; last recorded full run 1,264 passing, 2 skipped, 0 failed, 160 files, 159 s (at `259c5d2`). | R-lab/status.md#L125-L163, #L275; R-lab/reassessment-2026-09-03.md#L111 |
| 2026-10-15 00:50 PDT | First commit of the recovery-parser experiment (`397092b`). | git log 257856e^1..257856e^2 |
| 2026-10-15 02:15 UTC | GitHub repo created (public, MIT). | https://api.github.com/repos/chenglou/handwired (via sibling dossier the-project-and-its-claim.md) |
| 2026-10-15 02:24:24 UTC | Launch post on X by @_chenglou. | https://x.com/_chenglou/status/2110557373651931267 ; https://api.fxtwitter.com/_chenglou/status/2110557373651931267 |
| 2026-10-15 to 16 | Early HN submissions by others (items 50102806, 50105735, 50105849, 50112421, 50120274). AlphaSignal write-up 2026-10-15 18:19 UTC. | https://hn.algolia.com/api/v1/search?query=handwired%20chenglou&tags=story ; https://alphasignal.ai/news/cheng-lou-s-handwired-compiles-javascript-directly-into-neural-networks-without |
| 2026-10-16 17:33 PDT | Merge `257856e`: the recovery experiment, 238 commits (112 on Oct 15, 127 on Oct 16 in the branch). | git show 257856e |
| 2026-10-20 21:32 UTC | "Show HN: Turn regular JavaScript into a neural net", by chenglou: 45 points, 12 comments when fetched. | https://news.ycombinator.com/item?id=50172984 |
| 2026-10-22 to 23 | HN comments: "overclaim"/DSL critique, "why?", Tracr pointer, the 4.5 → 11 finding. | https://hn.algolia.com/api/v1/items/50172984 |
| 2026-10-27 | As-of date; `main` still at `257856e`. | GitHub API (sibling dossier) |

---

## 3. People

**Cheng Lou** (`chenglou`), the repo's sole commit author (825 of 825 commits by `git log`; 756
carry a `Co-Authored-By: Claude Code` trailer). Location/institution: the repo states none; commit
timestamps are in UTC−7 (Pacific Daylight Time). Secondary coverage (AlphaSignal) says, verbatim,
"Engineer Cheng Lou, formerly a member of the React core team, presents the project as a toy
compiler…"; treat as secondary.

What the repo records him believing or deciding (only in his own quoted words or as decisions
recorded "with Cheng's approval"):
- He chose the recommended options for runtime decisions 1–3 on 2026-09-14 (R-lab/status.md#L7).
- On the term-order question, "Cheng's point was that correctness needs one deterministic order that
  every evaluator shares, not statement order in particular" (R-lab/status.md#L93; paraphrase by the
  record's writer, not a quote).
- He asked for the temporary traditional-JavaScript demos, asked whether pretext layout or regex/JSON
  is faster on GPU, and suggested Knuth-Plass as min-plus matrix products (R-lab/status.md#L234,
  #L239-L240, #L107).
- He ordered the removal of the old JSON/regex experiments (verbatim quote in section 6).

**Who wrote the lab records.** Important and easy to get wrong: much of `lab/` reads as written by AI
agents working for Cheng. The reassessment is in the first person and says "I traced the relevant
June and July Claude conversations, this conversation's experiments, the original June Codex design
discussion… Historical conversation claims were treated as hypotheses, including those written by the
earlier Codex agent in this task" (R-lab/reassessment-2026-09-03.md#L15-L17). The 2026-09-03 commit
message says "Leave … local Claude settings uncommitted". The repo never names the "I". **Do not
put the reassessment's words in Cheng's mouth.** Attribute them to "the September reassessment" or
"the lab's own review".

**Depiction.** The repo contains no physical description of anyone, and the brief forbids invented
biography. For silhouette: a single generic figure at a desk with a laptop and a second screen, no
identifying features; or, better, show no person at all and let the machines and the documents
carry the scenes. The "reviewers" can be anonymous paper-cut hands holding red pencils.

Public responders on HN (named only as commenters, no biography): gregsadetsky, curtisblaine,
hungryhobbit, echoangle, aatd86, dvrp, auraham, seamossfet (https://hn.algolia.com/api/v1/items/50172984).

---

## 4. The belief of the age

Here "the age" is the project's own July 2026. The beliefs were held in the July lab briefs, chiefly
the shared brief `lab/briefs/context-shared.md` (committed in `a137ccd`, 2026-07-08; removed 2026-10-14),
whose section is headed "Established conclusions from the design conversation (take these as given)"
(git show a137ccd:lab/briefs/context-shared.md#L32; R-lab/reassessment-2026-09-03.md#L111). Holders:
the July experiment briefs, which present them as conclusions of an earlier "design conversation";
the repo does not name that conversation's participants, so do not attribute these beliefs to Cheng. Dissent: the September 3 reassessment and its three independent audits. Duration:
roughly July to 3 September 2026. What ended it: reruns of the decisive counterexamples, then the
fixes in `c6bf933`, then status.md replacing research-sweep.md as the authority (R-lab/research-sweep.md#L3-L5).

The ten retired claims, each with its replacement (R-lab/reassessment-2026-09-03.md#L113-L124).
[Fact-check: both columns below are condensed paraphrases of the reassessment's table, and its left
column is itself the reassessment's restatement, not brief text (e.g. the brief's own words were "A
JS-to-circuit compiler for arbitrary code is a dead end"; the reassessment writes "Compiling ordinary
source is a dead end"; the latch row reads verbatim "A latch is attention with one slot, so the event
formulation removes recurrence."). Quote on screen only from #L115-L124 verbatim.]

| July belief | September replacement |
|---|---|
| Continuous fields interpolate through valid UIs. | Numeric interpolation is easy; preserving content, validity and continuity needs separate evidence. |
| Dense training necessarily averages layouts into incoherence. | Some representations and losses average incompatible solutions; not a general limit of neural models. |
| Symmetry forces attention; repeated slot functions are convolution. | Shared functions can respect permutations if identity and tie rules travel with the items. |
| A latch is attention with one slot, so events remove recurrence. | A latch is persistent state; no automatic removal of temporal dependencies. |
| Behavior cells are fast weights because they are inputs. | A learned parameter remains a parameter wherever it is stored. |
| Removing the boolean atom makes exact choices directly trainable. | Hard cascade's useful score gradients remain absent; success comes from softened circuits then hardening. |
| Gather lowering discovered hard attention. | It recognized retrieval after a selection existed; it did not learn query/key scoring. |
| The fixed circuit can express any behavior without recompilation. | Only the family its inputs, operations and capacity support. |
| Compiling ordinary source is a dead end. | Compiling a defined numeric subset is feasible; dynamic allocation, unbounded sizes, side effects and precision contracts are the hard parts. |
| A live-value peak in the present schedule is a universal lower bound. | It is a property of that schedule. |

The second-largest belief reversal: "the old 0/20 result was not sufficient evidence to abandon"
separate instruction choices (R-lab/reassessment-2026-09-03.md#L38).

Outside the project, the wider field framing (programs compiled into networks, e.g. DeepMind's Tracr,
2023) is covered in the `framing-logic-neurons-to-compiled-programs` dossier. Tracr was pointed to by
an HN commenter as prior art, not by the repo.

---

## 5. Experiments and results

Apparatus for the art department: there is no physical lab. The "machines" are one developer
laptop-class Apple machine (the GPU numbers name an **Apple M5 Max**, R-lab/status.md#L107, #L121),
the JavaScript runtime **Bun 1.4.x**, **headless Chrome 153–155** driven through the DevTools
protocol, WebGPU through Metal. Tests are run as `bun run test` (last recorded full run: 1,264
passing, 2 skipped, 0 failed, 160 files, 159 s). The records repeatedly note runs "on a machine that
ran other jobs" (R-lab/status.md#L275). [Fact-check: the earlier quote "one machine shared with other
agents' work" does not appear in the repo; UNVERIFIED — do not use as a quote.] Visual metaphor
options that stay accurate: a bench of identical paper-cut machines each with a brass tag (folder
name), a ledger (status.md) with entries struck through and rewritten, two sealed archive drawers
labeled with the tags.

### 5.1 Learned interpreter (lab/learned-interpreter) — reversed failure
- Setup: a tiny interpreter with `add`, `subtract`, `multiply`; instruction 0 has 3×4×4 = 48
  candidates, instruction 1 has 3×5×5 = 75; 3,600 complete programs; four runtime inputs `pointerX`,
  `panelLeft`, `scale`, `distractor`; 14,739 integer training combinations; range −128..128
  (R-lab/learned-interpreter/README.md#L1-L45).
- Earlier (undated) report: 0/20 on both tasks. September: multiplying every loss by a constant (math-neutral) changed
  results: ×1 → 0/20 and 0/20; ×100 → 3/20, 0/20; ×10,000 → 9/20, 20/20; ×1,000,000 → 20/20, 20/20
  (seeds 3001–3020). Cause: losses already divided by 256²; Adam's `1e-8` epsilon dominated tiny
  gradients; scaling gradients by c is equivalent to epsilon/c (R-lab/reassessment-2026-09-03.md#L23-L36).
- Current: coordinate 60/60; two adds 59/60 on integers but **only 15/60 with fractional FP32
  checks**, because integer training cannot determine addition grouping. Example: for pointerX = 1,
  panelLeft = 2^-24, distractor = −1, `(pointerX + panelLeft) + distractor` = 0 in FP32 but
  `(panelLeft + distractor) + pointerX` = 2^-24 (R-lab/status.md#L196; R-lab/reassessment-2026-09-03.md#L42).
- Limit stated by the repo: "Neither establishes scalable program synthesis. The hard-loss method
  still evaluates every complete program before training." (R-lab/learned-interpreter/README.md#L9).

### 5.2 Trace compiler (lab/trace-compiler) — the oracle that shared the mistake
- Compiles a restricted numeric TypeScript subset by walking the AST; July claim: both layout modes of
  chenglou.github.io compile with zero mismatches across 1.1M comparisons (R-lab/research-sweep.md#L29).
- Reassessment counterexample: `if (true) { return x + 1 } return x + 2` at x = 2 returns 3 in
  JavaScript, 4 compiled, "zero mismatches and zero float64 drift" reported, because the interpreter
  shared the bug (R-lab/reassessment-2026-09-03.md#L61-L70). Also: unmasked mutations in an untaken
  ternary branch; nullable equality treated as a null test.
- Fix: five calculations per trial, including native JS execution of the source; frozen fixture from
  gallery commit `f315d58…` (R-lab/trace-compiler/README.md#L1-L40).

### 5.3 Wrong gradient and bad bounds (core runtime)
- `emitMultiply` expanded into two ReLUs; derivative of 3·v at v = 0 reported 0, reversed order gave 3
  (R-lab/reassessment-2026-09-03.md#L76-L78). Fixed: "Multiplication at zero now has the intended
  derivative in either operand order" (R-lab/status.md#L216).
- Range bounds computed in float64: with x = 1 − 2^-24, y = 2^-25, `Math.floor(x + y)` compiled to
  constant 0, though FP32 rounds the sum to 1 (R-lab/reassessment-2026-09-03.md#L51-L53). Gather of
  `[5, x*2]` with x = fround(3e38): reference NaN, lowered gather 5 (#L55). `emitSelect` overflow with
  off = fround(3e38), on = fround(−3e38) → NaN (#L92). All fixed per R-lab/status.md#L216-L222.

### 5.4 Event window (lab/event-window) — dropped moves
- July claim: drag/focus/click-vs-drag as a pure single-frame function of latched events; zero
  divergence over 120,000 frames; six behavior cells recovered 20/20 seeds (R-lab/research-sweep.md#L28).
- Reassessment: demo kept only the last pointer move; press, move 20 px away, return, release → the
  full sequence cancels the click, the compressed one toggles maximize; the oracle got the same
  compressed input (R-lab/reassessment-2026-09-03.md#L84-L88). Fixed (R-lab/event-window/README.md#L3-L7).
- Positive: six shared parameters learned and reused; eight fresh reviewer runs across 320,000
  frames; but training supplies correct internal state; recurrence remains (#L105-L107).

### 5.5 Generative fields (lab/generative-fields) — "valid" that hid content
- July: one 16-slot circuit, five layout families, no recompilation; naive interpolation 31.5% valid,
  projection repair 100% across 6,060 points (R-lab/research-sweep.md#L27).
- Reassessment: of 4,154 repairs, 1,408 hid previously visible items; one went from 16 visible to 6;
  width fraction 0.239749 → 0.239751 moved an item from ≈(965.55, 24) to (24, 98); an item extended to
  1,282.56 px in a 1,280 px viewport and still counted valid; padding gradient wrong (FD ≈ 4.3e-8 vs
  implemented −0.00144) (R-lab/reassessment-2026-09-03.md#L80, #L98-L103).

### 5.6 Cascade argmax (lab/cascade-argmax)
- Exact sign cascade, ReLU + power-of-two scaling + clamping. Hard cascade gives no useful score
  gradients. Training through soft comparisons fits a 128-cell table (16 cases × 8 candidates):
  seven-stage soft cascade 160/160 (seeds 1–10), single clipped ramp 160/160 (seeds 101–110). "There
  is no learned shared query/key function." Cost at 8 candidates: production 56 ops/15 layers vs
  cascade 196/75 (R-lab/cascade-argmax/README.md#L1-L38).

### 5.7 Hard attend (lab/hard-attend) and the parked hardAttend
- A plain-JavaScript page (not a numeric program, no tests) comparing one-hot, direct and softmax
  gathers over three items with keys (2j, −j²) and query (q, 1) (R-lab/hard-attend/README.md#L1-L7).
- The June hardAttend plan is parked: its retrieval half is covered by `circuit.indexRead` and gather
  lowering; its scored-selection half is the experiment decision 8 recommends (R-lab/status.md#L257).

### 5.8 Candidate gallery (lab/candidate-gallery)
- Three complete layouts (Cinema, Contact, Story) built in one program; `emitArgmax` picks the best;
  26 layout reads lower to gathers (R-lab/candidate-gallery/README.md#L1-L10; R-lab/status.md#L228).
  Known issue: `emitArgmax`'s comparison sum adds terms in wire order, so between scores 2–5 FP32 steps
  apart the two build orders picked differently in 3% to 12.5% of 2,000,000 samples (R-lab/status.md#L170).

### 5.9 Knuth-Plass (lab/knuth-plass) — correct, slower
- Optimal line breaking as min-plus matrix products. Exact against the reference. At n = 1,024,
  W = 32: chain 277,068 ops, 10,232 layers, 2.9 ms; tree 2,823,382 ops, 230 layers, 22 ms, 7.4 GB RSS
  while building; plain JS 75 µs. GPU one paragraph ≈ 0.3–0.6 ms, longer than the reference's 1–303 µs
  (R-lab/status.md#L240).

### 5.10 Traditional-JS demos, GPU and removals
- Regex search with pattern as data at S = 32, 1,024 code points: 2,297,760 live ops, 28,669 µs per
  evaluation, 5.8–8.1 GB RSS. "Nothing beat a loop over 32-bit words, e.g. 867 µs against 17 ms on the
  GPU." Removed 2026-10-14 (R-lab/status.md#L237).
- HandwiredOS on WebGPU: 2.2 ms per evaluation vs 81 µs on CPU (R-lab/status.md#L259).
- JSON search over 100,000 docs: after the bit-emit shaders, 4.6/4.7/5.2 ms for ≤8/16/32 states when
  back to back; still "no" against JavaScript in 8 workers (R-lab/status.md#L116-L121).

### 5.11 UI exploration learned-bits, user-population
- "learned-bits: 0 of 48 runs learned a task exactly at base settings." user-population cut summed
  mistake rates 56.1% → 36.5% on synthetic users; "No Tab rule was learned exactly from part of its
  cases." (R-lab/status.md#L204).

### 5.12 The recovery experiment (commit 257856e; lab/recovery-parser, recovery-toml, recovery-lr)
- Idea: the JSON highlighter's tables have ≈1,560 entries; valid JSON reads ≈240; the other ≈1,300 are
  reached only after an error, so filling them cannot change how valid input parses
  (R-lab/recovery-parser/README.md#L13-L17). Method: soften each free entry into a weighted mix,
  train with gradient descent on ≈40,000 payloads broken by 55 mistake types (#L29), round to the
  strongest choice; or "trial and error" search (#L19-L23). Soft parser runs ≈1,000 payloads/s; one
  step was also built as a Handwired circuit with identical values and gradients; "The whole run as
  one circuit was not built." (#L25).
- Scoring: a character counts as right only if label, nesting depth and container are all right;
  scoring starts at the first error (#L39).
- JSON final test, run once; "trained" is the mean of 5 gradient-descent-alone runs (#L55) (chars
  right / payloads entirely right, %): familiar mistakes (5,306):
  original 41.8/12.8, 35 hand-written rules 96.6/79.6, trained 98.1/79.8; 4 unseen types (2,029):
  rules 98.9/87.2, trained 97.1/68.9; agent-written (215): rules 82.7/56.7, trained 85.6/46.3
  (#L56-L61). Worst failure: text in front of the JSON (#L66). Search alone 98.1 familiar, 77.5 unseen (#L67).
- Example payload `{ name: 'get_weather', … }`: original 0 of 60 right; rules 59; trained 60 (#L44-L52).
- Random damage only: validation 98.0/80.5 → 82.8/61.8; the trained parser read everything after the
  first quote as one string, 17 of 60 (#L75-L82).
- TOML (≈4× larger table, no setting changed): gradient descent alone 86.6/28.6 vs one rule "start
  anew on the next line" 89.8/37.9 and 39 hand rules 98.7/81.7. "By the rule fixed beforehand the
  track failed" — below the one rule "on both sets, in every run"; section headers like
  `[tasks.clean]` read as arrays about half the time (#L88-L100). What reached the hand rules on
  TOML's final test was the **combination** "gradient descent, then trial and error, with TOML
  mistakes in the training data": 98.3/82.7 vs 98.7/81.7 (#L97, #L101). Trial and error alone on
  random damage was 93.8/46.3, above the one rule but well below the hand rules (#L96). [Fact-check:
  do not say "trial and error, *or* TOML mistakes, brought it level"; the repo's sentence is "With
  trial and error, and with TOML mistakes in the training data, the result is level with the
  hand-written rules".]
- Bison LALR(1) table for "miniml" (bison 2.3, flex 2.6.4; 99 states, 38 terminals, 3,762 action
  cells, ≈2,371 open) — validation only, final test not run: original 2.0/0.0; panic mode 60.8/27.6;
  yacc error productions 84.5/39.3; hand rules 88.0/48.7; gradient alone 82.9/35.9; gradient + search
  88.1/48.4 (R-lab/recovery-parser/README.md#L106-L121; R-lab/recovery-lr/README.md#L1-L27). With 34
  realistic mistake types (written "in under an hour and were not reviewed") in a half-and-half
  training set: gradient alone 94.1, gradient + search 96.2, vs 90.6 for hand rules (#L123-L135).
- More passes/data don't help the bison gradient run (83.1, 83.6, 83.5); trial and error reaches
  89.5 on the same data, so "the gap there is in how the soft parser is trained and rounded" (#L143).
- Caveats stated by the repo: later numbers "are not results on unseen data"; "The final tests of
  JSON and TOML are used up" (#L146-L147). Test sets were committed before training (commit message).

---

## 6. Verified quotes

All repo quotes are verbatim from commit 257856e.

| # | Quote | Speaker | Date | Source | Context |
|---|---|---|---|---|---|
| Q1 | "Keep the smaller numeric representation and the ambition to learn useful computation. Change what we treat as established, and make the next experiment test a rule that works on new situations rather than another configuration fitted to one situation." | the reassessment (unnamed writer) | 2026-09-03 | R-lab/reassessment-2026-09-03.md#L7 | "Bottom line" |
| Q2 | "The most concerning finding is also concrete: some correctness checks compare implementations that share the same mistake." | same | 2026-09-03 | #L9 | |
| Q3 | "separate instruction choices can recover composition in this experiment; the old 0/20 result was not sufficient evidence to abandon them." | same | 2026-09-03 | #L38 | bold in original |
| Q4 | "it passes yesterday's interpretation to tomorrow's agents as a constraint." | same | 2026-09-03 | #L111 | on the "take these as given" brief |
| Q5 | "The important question is not whether a net can reproduce rectangles. It is whether a small learned rule adapts a design across changes we did not specify individually." | same | 2026-09-03 | #L154 | |
| Q6 | "Compare alternatives without presuming that attention must emerge." | the `todo.md` hardAttend entry (unnamed writer), as quoted in status.md | written 2026-09-03 (commit `c6bf933`, todo.md); moved to status.md 2026-09-15 | R-lab/status.md#L257; `git log -S` | "in the entry's words". [Fact-check: NOT a June 2026 sentence; the June plan is older, but these words were added on 2026-09-03.] |
| Q7 | "we can remove all the bits from the 2 old json and regex experiments, except whichever important new patterns we found, like that nlogn loop or whatever. Beside those lessons, the demos should disappear." | Cheng Lou, as quoted in status.md | 2026-10-14 | R-lab/status.md#L127 | instruction to agents; casual register in the original |
| Q8 | "go. Make sure btw that the docs are without legacy crufts. Those and the tutorial and templates are the entrypoint for ppl when we release." | Cheng Lou, as quoted | 2026-10-14 | R-lab/status.md#L127 | on the removal plan |
| Q9 | "A table parser that gives up at the first error has entries that valid input never reads. Filling only those keeps valid input parsed exactly as before, and training can fill them so that the parser keeps going after a mistake." | commit message of 257856e (author Cheng Lou, co-authored by Claude Code) | 2026-10-16 | https://github.com/chenglou/handwired/commit/257856e3b221140acb4cc4460626b850c0bd4ff1 | |
| Q10 | "JSON is a clear success. A strict parser became a recovering one with no recovery code written, and valid JSON is unchanged by construction." | lab/recovery-parser/README.md | 2026-10-16 | R-lab/recovery-parser/README.md#L139 | |
| Q11 | "By the rule fixed beforehand the track failed: gradient descent alone is below the one simple rule on both sets, in every run." | same | 2026-10-16 | #L99 | TOML track (bold removed) |
| Q12 | "A failure by that rule says that the gradient step does not carry over as it is. It does not say that training cannot work there." | same | 2026-10-16 | #L140 | |
| Q13 | "GPU execution, a general JavaScript compiler, learned arbitrary abstractions, and a full learned UI runtime are not delivered by these experiments." | lab/status.md | Oct 2026 | R-lab/status.md#L246 | "Still open" |
| Q14 | "This is not a proof of all possible circuits or all JavaScript programs." | lab/status.md | Oct 2026 | R-lab/status.md#L224 | after "Correctness changes" |
| Q15 | "My dear friends, I’d like to show you my latest toy project / Introducing Handwired: turn your regular JavaScript code into a neural net! - no training - exact outputs vs the JS program - fully differentiable / All runnable in a browser, without GPU" | Cheng Lou, X | 2026-10-15 02:24:24 UTC | https://x.com/_chenglou/status/2110557373651931267 (text via https://api.fxtwitter.com/_chenglou/status/2110557373651931267) | launch post; curly apostrophe; line breaks shown as "/" |
| Q16 | "As far as I understand, this doesn't turn \"regular\" JavaScript into a NN, it's rather \"write your logic in a DSL that creates a neural-net-shaped circuit\"" | gregsadetsky (HN) | 2026-10-22 | https://news.ycombinator.com/item?id=50172984 | criticism |
| Q17 | "Lol, if you pass a = 4.5 to their homepage const result = (a > 4) ? 10 : 12 you get 11." | curtisblaine (HN) | 2026-10-23 08:18 UTC | same | the comment continues "Not everything is differentiable." Arithmetic checks: the README's comment says "For an integer a"; at a = 4.5, above4 = max(0, 0.5) − max(0, −0.5) = 0.5, so 0.5·10 + 0.5·12 = 11 (R-README.md#L15-L20) |
| Q18 | "Website is missing the #1 thing I imagine most readers would want to know: why?" | hungryhobbit (HN) | 2026-10-22 | same | single space; "why" is in italics in the original (`<i>why</i>?`). [Fact-check: corrected from "know:  why ?".] |

UNVERIFIED / do not use: any quote of Cheng Lou about the lab, the reassessment or the recovery
experiment beyond Q7–Q9. None exists publicly as far as was found. The "Cheng's point was…" sentence
in status.md#L93 is a paraphrase, not a quote.

---

## 7. Debates and controversies

1. **Did the learned interpreter fail?** An earlier, undated report: 0/20, proposed moving to structured discrete search instead of separate instruction
   choices. September: the failure was mostly an Adam-epsilon/loss-scale artifact (20/20 at ×10^6).
   But the reassessment also limits the win: no evidence of scaling; full loss table enumerated; 15/60
   under fractional checks (R-lab/reassessment-2026-09-03.md#L21-L45; R-lab/learned-interpreter/README.md#L7-L9).
2. **Is gradient training better than hand rules for parser recovery?** For: JSON familiar-mistake
   final test 98.1/79.8 vs 96.6/79.6. Against: on unfamiliar mistakes rules win on whole payloads
   (87.2 vs 68.9); TOML gradient alone fails the pre-set rule; bison gradient alone below yacc error
   productions; trial-and-error search matches or beats gradients without gradients ("Gradients add
   nothing to trial and error here"; R-lab/recovery-parser/README.md#L56-L67, #L99-L102, #L119-L121).
   The "fairer start" wins are on validation data with settings chosen in view (#L146).
3. **"Regular JavaScript"?** The launch tagline vs HN critique (Q15 vs Q16); the repo's own
   trace-compiler only handles "a defined numeric subset" and "does not compile arbitrary JavaScript"
   (R-lab/trace-compiler/README.md#L3); "a general JavaScript compiler… not delivered" (Q13). Covered
   in more depth in the-project-and-its-claim dossier.
4. **Does the GPU help?** Mixed. HandwiredOS on WebGPU 2.2 ms vs 81 µs CPU; Knuth-Plass and many
   regex cases lose to plain loops; JSON search over 100,000 documents beats single-thread RegExp
   after bit-emit, but "still no" against 8 workers (R-lab/status.md#L109-L121, #L237-L240, #L259).
5. **Term order.** Sorting sum terms by content hash would make statement moves harmless but made
   operand edits change 232 of 877 root keys; "not switched" (R-lab/status.md#L93). Remains a known
   issue for `emitArgmax` and gradients (#L170-L171).

---

## 8. Misconceptions to avoid

- **The lab is not a physical lab or institution.** It is the `lab/` folder of one repo, run on one
  machine (with agents). The repo names no lab or institution. [Fact-check: the earlier line
  "AlphaSignal confirms 'No lab or institution is named.'" is not in the AlphaSignal article's visible
  text or metadata; removed. UNVERIFIED — do not use as a quote.]
- **Do not credit Cheng with the reassessment's words.** Its writer is an unnamed "I" who reviewed
  Claude and Codex conversations; status.md's decisions are recorded "with Cheng's approval".
- **research-sweep.md is not a survey of related work.** It is an internal July log ("Landed",
  "Lab round one", "Superseded"), now explicitly historical. External prior art in the lab sits in the
  reassessment (Joachims et al. 2016; SUPPLE++ 2007; DreamCoder 2020; Slang autodiff) and in status.md
  (Percepta's mixed-integer scheduling formulation, named but not located online for this dossier;
  bison/yacc/panic-mode recovery in the recovery READMEs).
- **"The trained parser beat hand-written rules"** is true only on JSON's final test: on familiar
  mistakes (98.1/79.8 vs 96.6/79.6, the payload margin is 0.2 points) and on characters for the
  agent-written payloads (85.6 vs 82.7). The rules won on the 4 unseen types on both measures (98.9/87.2
  vs 97.1/68.9) and on whole agent-written payloads (56.7 vs 46.3). Not for TOML, not for bison (final
  test not run).
- **The recovery training did not run as one Handwired circuit.** Only one step was built as a
  circuit; training ran on a soft copy at ≈1,000 payloads/s.
- **Gather lowering did not discover attention.** Retired claim.
- **Event window did not eliminate recurrence.** Retired claim.
- **"Zero mismatches" in July did not mean correct.** The oracle shared the bug.
- **The fixes are not proofs** (Q14).
- **Commit 257856e is dated 2026-10-16**, not 2026-10-27.
- **The 238 commits** are the experiment branch's history (git counts 239 commits in
  `257856e^1..257856e^2`; the message says 238); say "about 240" or quote "238" as the message states.
- Do not say the GPU makes Handwired fast in general.

---

## 9. Curiosity hooks

1. Multiplying every loss by the same constant, a change that should do nothing, turned 0/20 into
   20/20, because of Adam's tiny `1e-8` safety term (R-lab/reassessment-2026-09-03.md#L23-L36).
2. A function that JavaScript says returns 3 compiled to 4, and the test harness reported zero
   mismatches: the checker had the same bug (#L61-L70).
3. The derivative of 3 × v at zero came out as 0, or 3, depending on which operand was written first (#L78).
4. Press, drift 20 px, come back, release: the real gesture is "no click"; the compressed demo
   maximized the window anyway (#L86).
5. Over a third of July's layout repairs (1,408 of 4,154) hid previously visible items; one went from
   sixteen visible items to six (#L100). [Fact-check: not "valid only because they hid items"; the
   reassessment says hiding is allowed by the experiment, "not an implementation error".]
6. A strict JSON parser has about 1,300 table entries that valid JSON never touches; training only
   those turns it into a forgiving parser with the valid-input behavior unchanged "by construction"
   (R-lab/recovery-parser/README.md#L13-L17, #L139).
7. Trained only on random damage, the parser learned to read everything after a single quote as one
   long string: 17 of 60 characters right (#L75-L82).
8. On TOML the gradient method lost, in every run, to a one-line rule, "after an error, start anew on
   the next line" (#L92, #L99).
9. Test sets were committed before any training on each track, and the final tests of JSON and TOML
   are now "used up" (commit 257856e; #L147).
10. HandwiredOS on WebGPU took 2.2 ms per evaluation, about 27 times the CPU's 81 µs (R-lab/status.md#L259).

---

## 10. Visual and dramatic details

- **Settings:** a single desk; terminal windows of `bun run test` scrolling "1,264 pass"; a headless
  browser with no window (draw as an empty frame with a glowing outline); an Apple laptop-class
  machine (M5 Max named). Pacific time stamps: the reassessment day (Sep 3), the removal day (Oct 14),
  the launch night (Oct 14 PDT evening = 02:24 UTC Oct 15), the two-day recovery sprint (Oct 15 00:50
  PDT to Oct 16 17:33 PDT). No weather is recorded; do not invent any.
- **Objects:** the ledger `status.md` with sections as drawer labels ("Known issues", "Open
  decisions", "Still open", "Parked and deferred"); a table with ten struck-through claims and their
  replacements; two sealed archive drawers labeled `exploration-2026-09` and
  `json-regex-experiments-2026-10`; a lookup-table grid where ≈240 cells glow (valid path) and ≈1,300
  dark cells get filled by a paper hand; a red pencil for the reviewer; a scale (balance) for the loss
  multiplier going ×1 → ×1,000,000.
- **The recovery payload** `{ name: 'get_weather', arguments: { city: 'Osaka', days: 2 } }` with its
  label strings (`pwkkkk…`) under three parsers is a ready-made on-screen beat: a row of `E`s, a row
  with one slip, a perfect row (R-lab/recovery-parser/README.md#L44-L52).
- **Dramatic shape:** confident July → humbling September → honest October ledger → a new, bounded,
  partly failed experiment the day after launch. Close on "Still open".
- Music/sfx: machines clack; a ratchet click for each "retired claim" turned over.

---

## 11. Sources

1. https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md
2. https://github.com/chenglou/handwired/blob/257856e/lab/status.md
3. https://github.com/chenglou/handwired/blob/257856e/lab/research-sweep.md
4. https://github.com/chenglou/handwired/commit/257856e3b221140acb4cc4460626b850c0bd4ff1
5. https://github.com/chenglou/handwired/blob/257856e/lab/recovery-parser/README.md
6. https://github.com/chenglou/handwired/blob/257856e/lab/recovery-toml/README.md
7. https://github.com/chenglou/handwired/blob/257856e/lab/recovery-lr/README.md
8. https://github.com/chenglou/handwired/blob/257856e/lab/learned-interpreter/README.md
9. https://github.com/chenglou/handwired/blob/257856e/lab/trace-compiler/README.md
10. https://github.com/chenglou/handwired/blob/257856e/lab/event-window/README.md
11. https://github.com/chenglou/handwired/blob/257856e/lab/generative-fields/README.md
12. https://github.com/chenglou/handwired/blob/257856e/lab/cascade-argmax/README.md
13. https://github.com/chenglou/handwired/blob/257856e/lab/hard-attend/README.md
14. https://github.com/chenglou/handwired/blob/257856e/lab/candidate-gallery/README.md
15. https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/review-and-decisions.md#L250
16. https://github.com/chenglou/handwired/commit/c6bf933 (2026-09-03 fixes; 274 tests)
17. https://github.com/chenglou/handwired/commit/3d2c717 (first commit, 2026-06-03)
18. https://github.com/chenglou/handwired/commit/e86f5ed (rename, 2026-10-06)
19. https://github.com/chenglou/handwired/tree/exploration-2026-09
20. https://github.com/chenglou/handwired/tree/json-regex-experiments-2026-10
21. https://x.com/_chenglou/status/2110557373651931267 ; https://api.fxtwitter.com/_chenglou/status/2110557373651931267
22. https://news.ycombinator.com/item?id=50172984 ; https://hn.algolia.com/api/v1/items/50172984
23. https://hn.algolia.com/api/v1/search?query=handwired%20chenglou&tags=story (items 50102806, 50105735, 50105849, 50112421, 50120274)
24. https://alphasignal.ai/news/cheng-lou-s-handwired-compiles-javascript-directly-into-neural-networks-without (2026-10-15; secondary; partly paywalled)
25. https://javascript.plainenglish.io/goodbye-if-else-hello-handwired-neural-code-35c821945d96 (member-only blog; lead only, not read)
26. https://arxiv.org/abs/1608.04468 (Joachims, Swaminathan, Schnabel, "Unbiased Learning-to-Rank with Biased Feedback")
27. https://www.eecs.harvard.edu/~kgajos/papers/2007/gajos07automatically.shtml (SUPPLE++, "Automatically generating user interfaces adapted to users' motor and vision capabilities", 2007)
28. https://arxiv.org/abs/2006.08381 (Ellis et al., DreamCoder)
29. https://docs.shader-slang.org/en/stable/external/slang/docs/user-guide/07-autodiff.html (Slang automatic differentiation)
30. https://arxiv.org/abs/2301.05062 (Lindner et al., Tracr; raised by HN commenter aatd86)
31. https://www.gnu.org/software/bison/manual/html_node/Error-Recovery.html (bison error recovery, background for panic mode / error productions)
32. Sibling dossier: films/handwired-explained/research/dossiers/the-project-and-its-claim.md (GitHub API metadata: created 2026-10-15T02:15:09Z, ~2,033 stars on 2026-10-27)

---

## Fact-check log (adversarial pass, 2026-10-27)

Method: every repo claim re-read at `chenglou/handwired@257856e` in the local clone (`cat -n`, `git log`,
`git show`, `git log -S`, `git rev-list`); GitHub API (`gh api repos/chenglou/handwired`: created
2026-10-15T02:15:09Z, MIT, main = 257856e, 2,034 stars); HN Algolia API items 50172984 and 50112421 and
the HN item page; fxtwitter API for the launch post; the AlphaSignal page (WebFetch). About 78 claims
checked: 64 confirmed, 13 corrected, 1 unverifiable.

**Confirmed (selection):** Adam-epsilon loss-scale table and seeds 3001-3020 (reassessment L23-L36);
Q1-Q5, Q7-Q16 verbatim; "some correctness checks compare implementations that share the same
mistake" (L9); x + 1 / x + 2 early-return counterexample, 3 vs 4, zero mismatches (L61-L70);
emitMultiply 0 vs 3 at zero (L78), fixed in either order (status L216; reassessment L190); event
demo 20 px press/move/return (L86) and fix (event-window README L3-L5); 4,154 / 1,408 / ten of sixteen
removed (L100); ten retired claims (L113-L124); `c6bf933` 2026-09-03 06:13 PDT, 274 tests; `259c5d2`
2026-10-14 22:43 PDT, 1,264 passing / 2 skipped / 0 failures / 160 files / 159 s (status L275); 59/60,
15/60, 3,600 programs (status L196; learned-interpreter README L7-L9); `257856e` 2026-10-16 17:33:49
PDT, message says 238 commits, `git rev-list` counts 239 (112 on Oct 15, 127 on Oct 16), branch
starts `397092b` 2026-10-15 00:50 PDT; ≈1,560 / ≈240 / 1,300 / 55 types / ≈40,000 (recovery-parser
README L13, L29); JSON final-test table (L57-L61); random damage 98.0/80.5 → 82.8/61.8, 17 of 60
(L75-L83); TOML table and "By the rule fixed beforehand the track failed" (L89-L99); bison 99 × 38 =
3,762 action cells, 2,371 open, bison 2.3, flex 2.6.4 (recovery-lr README L3, L15-L20) and 82.9 /
60.8 / 84.5 / 88.0 with final test not run (recovery-parser README L110-L119); status "Still open"
(L244-L246); known issues: emitArgmax 3%-12.5% of 2,000,000 samples, gradients by statement order,
NaN range, title-bar buttons "still kept equal by hand" (status L168-L171); parked list "tried in July
2026" (L250-L260); HandwiredOS WebGPU 2.2 ms vs 81 µs, measured 2026-09-16 (L259); research-sweep
sections Landed / Lab round one (29 fixed, 17 refuted) / Superseded (research-sweep L12-L35); prior art
Joachims/Swaminathan/Schnabel, SUPPLE++, DreamCoder, Slang (reassessment L163, L167, L173, L186);
first-person "I traced the relevant June and July Claude conversations … the original June Codex
design discussion" (L15) and "with Cheng's approval" (status L3); 825/825 commits by Cheng Lou, 756
with a Claude co-author trailer; launch post text and 2026-10-15 02:24:24 UTC; Show HN 50172984 by
chenglou, 2026-10-20 21:32 UTC, 45 points, 12 comments; "overclaim" is in gregsadetsky's DSL comment;
early submissions 50102806, 50105735, 50105849, 50112421, 50120274 by others; AlphaSignal
datePublished 2026-10-15T18:19:37Z with no mention of the lab, the reassessment or the recovery
experiment.

**Changes made:**
1. *Learned interpreter dated "July", listed with round one* → the 0/20 report is undated ("The
   previous report", reassessment L21), and `lab/learned-interpreter` first appears in `c6bf933`
   (2026-09-03). The July round one (`a137ccd`, 2026-07-08) holds four experiments and no learned
   interpreter. Summary, timeline, 5.1 and Debates #1 reworded. (Dating: unverifiable.)
2. *Summary: "failure by its own pre-registered rule on TOML and on bison … rescued only by fairer
   starts measured on validation data"* → only TOML has the explicit "rule fixed beforehand" verdict
   (final test). Bison "did not carry over" on validation data, and its final test has not run. On
   TOML's final test, trial and error plus TOML mistakes reached the hand rules (recovery-parser README
   L3, L97-L101, L140; commit message).
3. *Key claim 12 "Trial-and-error search, or training with TOML mistakes, brought it level"* → the
   combination did (98.3/82.7 vs 98.7/81.7). Trial and error alone was 93.8/46.3 (L96-L101).
4. *AlphaSignal "a former React core team member"* → verbatim "formerly a member of the React core team".
5. *"AlphaSignal confirms 'No lab or institution is named.'"* → not in the article; removed.
6. *"one machine shared with other agents' work" (status L236)* → not in the repo; the wording is "on
   a machine that ran other jobs" (status L275). Demoted to UNVERIFIED.
7. *"1,264 tests"* → 1,264 passing plus 2 skipped (status L275).
8. *Q6 dated June 2026* → the sentence was added to todo.md's hardAttend entry in `c6bf933`,
   2026-09-03 (`git log -S`). It moved to status.md 2026-09-15.
9. *Q18 "know:  why ?"* → "know: why?", with "why" in italics (HN Algolia text and HN page HTML).
10. *Misconception "trained beat rules … only familiar mistakes, chars right"* → it also won on
    familiar whole payloads (79.8 vs 79.6) and on agent-written characters (85.6 vs 82.7). The rules won
    on unseen types on both measures and on agent-written whole payloads.
11. *Hook 5 "valid only because they hid items"* → "hid previously visible items". Hiding is allowed
    by the experiment and "not an implementation error" (reassessment L100).
12. *Belief-of-the-age table* → marked as condensed paraphrases. The brief's verbatim heading
    "Established conclusions from the design conversation (take these as given)" and its "dead end"
    wording ("A JS-to-circuit compiler for arbitrary code is a dead end") were added (git show
    a137ccd:lab/briefs/context-shared.md L32, L42). Holders: participants are not named.
13. *Line citations in 5.12* → scoring L39 (not L45), soft parser L25 (not L31), method L19-L23,
    55 types L29, "trained" = mean of 5 runs (L55).

**Notes, no change needed:** Q17's arithmetic was checked by hand from the README (a = 4.5 gives 11).
In key claim 17, the HandwiredOS WebGPU number dates from 2026-09-16, not July, even though it sits
inside the parked "GPU megakernel" entry. Key claim 15 says "learning shared query/key functions"
where the repo says "discovering shared query/key functions". Use the repo's word if quoting.
