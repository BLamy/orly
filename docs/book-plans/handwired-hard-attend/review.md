# Fact-check: handwired-hard-attend captions

Reviewer: Claude Haiku 5.5 (role: review). Captions are checked against the pinned source at `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (clone: `.orly-work/hw-books/repo`, read-only).

Method: each numeric claim was reproduced by running the verbatim `hard-attend.ts:46-78` scoring, winner, and softmax functions, plus the item table at `:7-27`, under `bun` with no DOM (probe output in the quote column). The DOM page itself was not run in a browser. Non-numeric claims were checked against `lab/hard-attend/README.md`, `hard-attend.html`, `lab/status.md`, and `lab/reassessment-2026-09-03.md`.

Note: the clone path resolves through a symlink to another worktree (`.../screencast/.orly-work/screencast/handwired-labs-workshop/repo`); `git rev-parse HEAD` in it is `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`.

Result: 33 captions checked. 1 FIX (ch.3 #5), 32 OK. Edits made in `book.json` and `plan.md` for the FIX only.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
|---|---|---|---|---|---|
| 1 Closer Wins | 1 | OK | | lab/hard-attend/hard-attend.ts:12-13 | `name: 'Aster'`, `value: 10` (Banyan 20 at :19, Cobalt 30 at :25) |
| 1 Closer Wins | 2 | OK | | lab/hard-attend/README.md:3 | "A page of plain JavaScript, not a numeric program" |
| 1 Closer Wins | 3 | OK | | lab/hard-attend/hard-attend.ts:51 | `return [2 * itemIndex, -itemIndex * itemIndex]`; probe keys [0,0] [2,-1] [4,-4] |
| 1 Closer Wins | 4 | OK | | lab/hard-attend/hard-attend.ts:47 | `return 2 * queryIndex * itemIndex - itemIndex * itemIndex` |
| 1 Closer Wins | 5 | OK | | lab/hard-attend/hard-attend.ts:47 | probe: "q 1 scores [0,1,0] winner 1" |
| 1 Closer Wins | 6 | OK | | lab/hard-attend/hard-attend.ts:47; lab/hard-attend/README.md:3 | algebra 2qj−j² = q²−(j−q)²; README: "highest at the item nearest the query" |
| 1 Closer Wins | 7 | OK | | lab/hard-attend/hard-attend.ts:47 | probe: "q 0 scores [0,-1,-4]" |
| 1 Closer Wins | 8 | OK | | lab/hard-attend/hard-attend.ts:47 | probe: "q 2 scores [0,3,4] winner 2" |
| 1 Closer Wins | 9 | OK | | lab/hard-attend/hard-attend.ts:47 | probe: "q 1.25 scores [0,1.5,1]" |
| 1 Closer Wins | 10 | OK | | lab/hard-attend/hard-attend.ts:47 | probe: "q 0.5 scores [0,0,-2]" (Aster and Banyan both 0) |
| 1 Closer Wins | 11 | OK | | lab/hard-attend/hard-attend.ts:58-71 | `function winnerIndexFor(scores: readonly number[])` |
| 2 One Winner, Two Reads | 1 | OK | | lab/hard-attend/hard-attend.ts:58-71; lab/status.md:257 | the tie rule is the strict `>` in code; status: "ties defined in advance" (that wording is about the open experiment, used here as the general requirement) |
| 2 One Winner, Two Reads | 2 | OK | | lab/hard-attend/hard-attend.ts:58-64 | `let winnerScore = scores[0]`; loop `for (let index = 1; ...)` |
| 2 One Winner, Two Reads | 3 | OK | | lab/hard-attend/hard-attend.ts:65 | `if (score > winnerScore) {` |
| 2 One Winner, Two Reads | 4 | OK | | lab/hard-attend/hard-attend.ts:65; probe | probe: "q 0.5 scores [0,0,-2] winner 0" |
| 2 One Winner, Two Reads | 5 | OK | | probe | probe: "q 1.5 scores [0,2,2] winner 1" |
| 2 One Winner, Two Reads | 6 | OK | | lab/hard-attend/hard-attend.ts:136 | `const onehot = items.map(item => item.index === winner.index ? 1 : 0)` |
| 2 One Winner, Two Reads | 7 | OK | | lab/hard-attend/hard-attend.ts:141 | `return sum + bit * item.value`; probe: "onehot sum q=1 20" |
| 2 One Winner, Two Reads | 8 | OK | | lab/hard-attend/hard-attend.ts:177; lab/hard-attend/hard-attend.html:52 | `values[${winner.index}] = ${winner.value} (${winner.name})`; html: `<p class="eyebrow">hardAttend</p>` |
| 2 One Winner, Two Reads | 9 | OK | | lab/hard-attend/hard-attend.ts:134, :136, :177 | `const winner = items[winnerIndex]`; both reads derive from `winner` (inference, worded as inference in the caption) |
| 2 One Winner, Two Reads | 10 | OK | | lab/hard-attend/hard-attend.ts:141; lab/status.md:9 | "copy `candidates[floor(index)]` in 1 operation at any table size, for an index range strictly inside ±2^24" (the ±2^24 scope is not in the caption; the "any table size" wording is the status wording, so not contradicted) |
| 2 One Winner, Two Reads | 11 | OK | | lab/hard-attend/README.md:3; lab/hard-attend/hard-attend.ts:58-71 | "a direct gather, which reads the value at the winner's index"; all three steps in code |
| 3 Soft Versus Exact | 1 | OK | | lab/hard-attend/hard-attend.ts:73-78, :146 | `const weights = scores.map(score => Math.exp((score - maxScore) * beta))`; `return sum + weight * item.value` |
| 3 Soft Versus Exact | 2 | OK | | lab/hard-attend/hard-attend.html:61; lab/hard-attend/hard-attend.ts:75 | `min="0.5" max="14"`; the beta term scales the score gaps |
| 3 Soft Versus Exact | 3 | OK | | probe | probe: "q 0.25 beta 14 weights 0.9991,0.0009,0.0000 blend 10.0091" |
| 3 Soft Versus Exact | 4 | OK | | probe | probe: "q 0.75 beta 14 weights 0.0009,0.9991,0.0000 blend 19.9909" |
| 3 Soft Versus Exact | 5 | FIX | "even at sharpness one thousand" → "at any sharpness" | lab/hard-attend/hard-attend.html:61 (max 14); probe | probe: "q 0.5 beta 1000 weights 0.5000,0.5000,0.0000 blend 15.0000"; the page's sharpness slider cannot go past 14, so "one thousand" is outside the page. The first sentence ("more sharpness pulls the blend toward the exact value") holds: probe q=0.25 blend 10.7586 at beta 5, 10.0091 at beta 14 |
| 3 Soft Versus Exact | 6 | OK | | probe; lab/hard-attend/hard-attend.ts:58-71 | probe: "q 1.5 beta 14 weights 0.0000,0.5000,0.5000 blend 25.0000"; exact winner 1 → 20 |
| 3 Soft Versus Exact | 7 | OK | | synthesis of captions 5–6 | same probes as 5–6 |
| 3 Soft Versus Exact | 8 | OK | | lab/hard-attend/README.md:7; probe | README: "The folder has no tests."; `bun test` in lab/hard-attend: "error: 0 test files matching"; `bun lab/hard-attend/hard-attend.ts`: "ReferenceError: document is not defined" (from `mustQuery` at hard-attend.ts:30) |
| 3 Soft Versus Exact | 9 | OK | | lab/status.md:257; lab/reassessment-2026-09-03.md:121 | "Its indexed retrieval half ... now cover it"; "It recognized retrieval after a selection was already represented. It neither learned query/key scoring" |
| 3 Soft Versus Exact | 10 | OK | | lab/status.md:257 | "exact selection has no useful gradient with respect to the winner, so training goes through soft mixtures" (checked; an edit was made and then reverted, since the source supports the caption) |
| 3 Soft Versus Exact | 11 | OK | | lab/status.md:257; lab/hard-attend/README.md:3 | synthesis; the scored half is listed as open in status.md:257 |

## Wrong numbers in plan.md visuals

Not edited, since the task limits edits to captions. Fix in the visual spec:

- **Ch.3, Beat sheet item 5** (plan.md line 119): "Dial runs on past 14 to 1000 and the bars do not move." The page's sharpness slider stops at 14 (`hard-attend.html:61`, `max="14"`). Suggested wording: "Dial stops at 14 (the page's top setting)". The fact that the bars do not move at tie positions still holds at any sharpness (probe: 0.5/0.5/0 at beta 14 and 1000).

No other visual number was found wrong. The checked values were: the chapter 1 key chips and score bars (beats 3, 5, 7, 8, 9), the chapter 2 bit and sum values (beats 3, 5, 6), the chapter 3 weights and blends (beats 3, 4, 6), and the on-screen labels in all three chapters.

## Wording notes (not numbers, not edited)

- **Ch.3, Visual, beat 10**: "no useful gradient for exact selection → soft mixtures, check hardening separately" is supported by status.md:257 for its first half. Its "check hardening separately" is a caution from the same line.
