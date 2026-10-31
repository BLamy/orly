# Dossier: Exactness in FP32: declared ranges, rounding points, comparisons and magnitude limits

- Topic id: `exactness-in-fp32`
- Era: repo at `chenglou/handwired@257856e` (commit dated 2026-10-16 17:33 -0700 by `git log`; pinned for the film on 2026-10-27)
- Local clone: `/Users/blamy/Documents/Codex/orly-2/.orly-work/repos/handwired`
- Researcher run: 2026-10-27, Bun 1.4.3, macOS arm64
- Source convention: `GH/<path>#Lnn` means `https://github.com/chenglou/handwired/blob/257856e/<path>#Lnn`, the same as the repo path form `chenglou/handwired@257856e:<path>#Lnn` used in the books' `sources.json`. Numbered URLs are in section 11.

---

## 1. Summary

Handwired's README calls its programs "exact" ([S1]). This dossier pins down what that word means in the repo. It is narrower and more careful than a viewer would guess.

**What "exact" means.** A Handwired program is evaluated in FP32, IEEE-754 single precision. Every step is `Math.fround`, and the terms of a weighted sum are added in their stored order:
`value = f(bias); for (wire, coefficient) in terms: value = f(value + f(f(coefficient) * values[wire]))` ([S2] L7-17).
The **reference evaluator**, `circuit.evaluateReference`, *defines* what a program computes. The compiled matmul evaluator has to reproduce every live value bit for bit, and `validateTensorEvaluation` checks this with `===` ([S2] L50). The docs say plainly that "exactness means equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic" ([S2] L257). There is a second, separate check: does the program do what the original JavaScript did? That check runs against a plain JavaScript reference, e.g. `template/toggle.test.ts` ([S2] L50).

**Which numbers are safe.** FP32 has a 24-bit significand. It holds every integer exactly only up to 2^24 = 16,777,216. Past that, neighbouring values are 2 apart, then 4 ([S3] L41; [W2]). Run in Bun: `Math.fround(2**24 + 1)` is 16,777,216 and `Math.fround(2**24 + 3)` is 16,777,220 (probe P1). Handwired's exact constructions all work by keeping every product and partial sum a whole number of some power-of-two step, within 2^24 of those steps.

**Declared ranges and grids.** The builder can't see runtime values, so the caller *declares* them:
- `assumeRange(wire, min, max)` gives the range.
- `assumeGrid(wire, step)` says every value is a multiple of a power-of-two step, e.g. 1/64 px.
- `assumeOneHot` says exactly one of a group of bits is 1.

The builder picks its constructions from these declarations ([S2] L52). The cells table (`cells.ts`) declares every source cell before the first operation exists, e.g. `viewportWidth: input([0, 16_384], {grid: 1})`. `emitCompare` refuses to build without finite ranges ([S2] L56, L122; probe P5). "Declarations are promises from the caller, not proofs" ([S2] L60). Both evaluators reject a *source* value outside its declared range: they throw "source wire 0 is outside its assumed range" ([S6] L784-795; probe P4). A false promise about a *computed* wire is not caught, and it gives wrong bits (probe P6).

**emitCompare.** This is how a comparison becomes an exact 0/1 decision. It builds an exact bit of `>`, `>=`, `<`, `<=` or `===`, and picks one of two constructions from the declarations ([S2] L116-147):
1. **Integer bits on a grid.** If both operands lie on grids and every partial sum stays within 2^24 grid steps, the bit comes from the integer `D = (a - b)/grid`. For example, `a >= b` is `relu(1 - relu(-D))`. Nothing rounds. This costs 2 operations in 2 layers for `>=` and `>`, and 3 for `===`.
2. **Sign cascade.** Otherwise the difference `d = f(a - b)` is kept as its own operation. Thanks to subnormals, it is 0 only when `a === b`, and otherwise it has the sign of `a - b`. Then come stages of `min(limit, scale × x)`, written as `x - relu(x - limit)`, with power-of-two scales. These lift every nonzero `d`, down to 2^-149, to at least 1. For operands within 0..16,384 the scales are 2^10, 2^24 ×5, and 2^19. The exponents sum to 149. This costs 15 operations in 14 layers for `>=`, 16 in 15 for `>`, and 28 in 14 for `===`.

There is also a one-operation shortcut, the **boolean atom**: `f(f(f(score) + 8,388,609) - 8,388,609)`. It rounds a score in 0..1 at 0.5, but only when executed literally in FP32 ([S2] L24, L28, L126, L159; [S3] L32).

**Rounding points.** `circuit.roundingPoints()` lists the operations where "the exact FP32 evaluation, term order and operand wires matter". There are four kinds: `'boolean'`, `'integer bit'`, `'sign cascade'` and `'marked'` ([S2] L155-164). A backend can reorder, fuse or widen every *other* sum. (Fact-check nuance: the strictness differs by kind. Boolean atoms and marked operations must keep the stored FP32 evaluation, term order and operand wires. For `'integer bit'` operations a backend "may add an operation's terms in any order, fuse them, or evaluate them in float64", and for `'sign cascade'` operations it "may evaluate an operation's own sum in any order or in float64"; both only require that each operation stay its own operation, reading the same wires ([S2] L160-161).) The WGSL spec permits exactly that kind of rewriting: "An implementation may reassociate operations" ([W4]). A lab probe found GPU shader compilers folding the atom's `(a + 8388609) - 8388609` to `a` ([S8] L110-127). HandwiredOS records 59 boolean atoms, 707 integer-bit operations and 33 marked operations ([S2] L164).

**Magnitude limits.** Several common macros are exact only within limits:
- `emitMinimum`, `emitMaximum` and clamps: integer operands below 2^23. `emitMaximum(2^24, -1)` returns 16,777,215 and `emitMinimum(2^24, -1)` returns 0. Fractional operands drift even when small: `emitMinimum(f(1000.37), f(0.3))` gives 0.29998779 ([S3] L12, L41; [S2] L280-288; probe P7).
- `emitSelect` at a gate of exactly 0 or 1 is exact at any finite magnitude ([S3] L11).
- Spring "Magnitude limits" cover matrix cells, settle thresholds of at least 2^-22, retarget rebases, and times within 2^24 steps of 1/64 ms ([S2] L239-247).

**Dynamic division.** Dividing by a runtime value is **not exact and not in the runtime**. A Newton reciprocal in `lab/ui-exploration/numeric-library` has relative error ≤ 2.5e-7, and its quotient ≤ 3e-7 ([S3] L16, L43-48; [S9] L64-65). The item is parked in `lab/status.md` with "Revisit dynamic division only when a real UI needs it." An idea for computing a reciprocal "from FP32's changing precision" is untested ([S4] L267).

**Tests (run 2026-10-27).** `bun test tests/runtime` gives **174 pass, 0 fail, 155,853 expect() calls, 11 files, 2.13 s**. By file:
- `random-hardened`: 5 pass
- `builder-differential`: 2 pass
- `numeric-semantics`: 17 pass
- `macro-ranges`: 15 pass
- `comparison`: 15 pass

The randomized tests mostly check the compiled evaluator against the reference evaluator, bit for bit. `builder-differential` checks the reference against a naive float64 replay *with a 1e-4 tolerance*, and exactly only for boolean atoms. The comparison tests check bits against native JavaScript comparisons (section 5).

**Honest scope.** The repo itself says: "This is not a proof of all possible circuits or all JavaScript programs" ([S4] L224).

---

## 2. Timeline

Every date comes from the repo's own dated notes. The repo is the primary source.

| Date | Event | Source |
|---|---|---|
| July (year not stated in the source; 2026 inferred from context) | Arbitrary division, among other things, "still lacked a UI behavior that required them" and was deferred | [S4] L270 |
| 2026-09-03 | Reassessment; full test run at c6bf933 had 274 passing tests | [S4] L1-3, L275 |
| 2026-09-13 | exactness-budget measurements: seven UIs run with each operation's terms added "in eight ways"; float64 everywhere broke every UI with round chains (e.g. 1,150,506 wrong rows in life-calendar); keeping FP32 order only at rounding points brought those flips back to 0 | [S8] L195-205 |
| 2026-09-14 | The runtime gains `emitCompare` (integer bits / sign cascade), grids, and the rounding-point records ("Cheng chose the recommended option for three runtime questions") | [S4] L5-9 |
| 2026-09-15 | HandwiredOS and Photos move to the Sept-14 runtime additions (shared spring matrix / `emitAnimatedObject`, `advanceFrame`, timestamped events, and window hit tests as `emitCompare` integer bits on a 1/64 px grid). With that whole move, HandwiredOS goes from 5,253 to 3,654 live operations and 192 to 124 layers. The repo does not attribute the drop to the hit tests alone. | [S4] L14 |
| 2026-09-16 | Dynamic division moved from the README TODO to "Parked"; exp/'s magnitude guards removed and not added to the runtime | [S4] L265, L267 |
| 2026-09-17 to 18 | Term-order probe (sort sums by a content hash instead of wire number): not switched | [S4] L91-93 |
| 2026-10-14 | Repo made public, after a history rewrite | [S4] L36 |
| 2026-10-15 | `emitArgmax` keep-left band measured (8.94e-8 / 2.38e-7); the "changing precision" reciprocal idea text removed from docs/expressions.md and kept in status.md | [S4] L170, L267 |
| 2026-10-16 | Commit 257856e (the pinned commit) | `git log -1` in clone |
| 2026-10-27 | This dossier's run of `bun test tests/runtime`: 174 pass, 0 fail | Run R1 (section 5) |

External context, for framing only:

| Date | Event | Source |
|---|---|---|
| ECMAScript 2015 (browsers since July 2015) | `Math.fround` "returns the nearest 32-bit single precision float representation of a number" | [W1] |

---

## 3. People

- **Cheng Lou (`chenglou`)**, author of Handwired. The repo is the only source used here. The repo describes his decisions in the third person:
  - "Cheng chose the recommended option for three runtime questions" (Sept 14, 2026) ([S4] L5).
  - On term order, "Cheng's point was that correctness needs one deterministic order that every evaluator shares, not statement order in particular" ([S4] L93). This is paraphrase in the repo's voice, **not a verbatim Cheng quote**.
  - Institution, city and appearance: **no source in the repo. Do not invent.** For a silhouette, use a generic, non-likeness figure at a desk, or show only hands and the machine. Don't render a portrait.
- **No other people** figure in this topic. The repo's numeric work is unattributed beyond the author.

---

## 4. The belief of the age

The common assumption is that floating point is approximate. Goldberg's classic 1991 survey puts it this way: "Squeezing infinitely many real numbers into a finite number of bits requires an approximate representation" ([W6], section "Rounding Error"). MDN warns that checking a 64-bit float and a 32-bit float for equality "may fail even though the numbers are seemingly identical" ([W1]). (Fact-check: MDN's fround page does **not** use the word "approximate", so do not attribute that word to MDN. "Held by most programmers" is framing with no survey behind it; do not state it as a sourced fact.) On that view, a network of weighted sums and ReLUs can't make the hard, exact decisions a program makes: `open`, `focused`, `x >= left`.

Handwired's position is narrower and testable. FP32 arithmetic is deterministic and *exact on a known set of values*:
- integers up to 2^24;
- multiples of a power-of-two grid within 2^24 steps;
- multiplication by powers of two, which "only changes the exponent";
- subnormal differences down to 2^-149.

So exactness can be *engineered* at the points where a score becomes a decision ([S3] L27-37; [S6] L2213-2228).

Handwired's own caveats. These are dissents within the repo, not from outside:
- An exact bit is exact for the FP32 values it compares, *not* for the float64 JavaScript it replaces. The width-1732 column count is 6.9999995 in FP32 but exactly 7 in float64 ([S3] L37; probe P9).
- Exactness depends on the executor keeping FP32 rounding at rounding points. GPU compilers don't by default ([S8] L127, L176).
- Declarations are promises, not proofs ([S2] L60).

How long this has held: these are the current docs at 257856e. Nothing in the repo retracts them.

---

## 5. Experiments and results

### R1. The runtime test suite (run for this dossier)

Command, in the clone:

```
cd .orly-work/repos/handwired && bun test tests/runtime
```

Output (Bun 1.4.3, 2026-10-27):

```
[differential] circuits=3000 reads=8584 decoys=4073 chainedReads=390 chainedCandidatePicks=463 pairFormCircuits=1015 allowAllZeroGroups=1954 comparedWires=857955
 174 pass
 0 fail
 155853 expect() calls
Ran 174 tests across 11 files. [2.13s]
```

(`time`: 2.138 s total.) The `[differential]` line is printed by `gather-lowering.test.ts`.

Per-file runs (`bun test tests/runtime/<file>`):

| File | Pass | Fail | expect() calls | Time |
|---|---|---|---|---|
| random-hardened.test.ts | 5 | 0 | 237 | 95 ms |
| builder-differential.test.ts | 2 | 0 | 15 | 38 ms |
| numeric-semantics.test.ts | 17 | 0 | (not printed) | 13-15 ms |
| macro-ranges.test.ts | 15 | 0 | 17,201 | 56 ms |
| comparison.test.ts | 15 | 0 | 4,402 | 412 ms |

Instrumented copies of two files ran from the scratchpad. A `console.log` of the tests' own counters was added; nothing else changed. Results: builder-differential compared **83,460 wires**, of which 8,760 were boolean wires, with 4,593 alias reuses. Random-hardened made **2,531 macro applications**. Both passed.

For comparison, the last recorded *full* repo run (`bun run test`, commit 259c5d2, 2026-10-14) had "1,264 passing tests, 2 skipped and no failures, across 160 files in 159 s" ([S4] L275). That is the whole repo, not tests/runtime.

### What each exactness test actually checks (honest reading)

- **random-hardened.test.ts** ([S7a] L64-220). 320 seeded random circuits, each with 6-19 operations drawn from affine, reglu, `emitMultiply`, `emitMaximum`, `emitMinimum`, `emitSelect`, boolean atoms, `emitArgmax`, `emitFirstActive` and `emitSpring`. The coefficients are deliberately *non-dyadic*: 1/3, 0.1, 0.7, 12,345.6789, π, and so on. The code comment explains why: "so the per-product fround in the compiled evaluator must round mid-mantissa instead of trivially landing exact" (L33-34). Each circuit is compiled and evaluated on 5 random inputs, and `validateTensorEvaluation` requires every live wire to equal the reference evaluator. **This is compiled vs reference (FP32 vs FP32), not vs JavaScript float64.** Other tests in the file:
  - A boolean battery at 0.49999997 → 0, 0.5 → 1 and 0.50000006 → 1 (L223-248).
  - Argmax ties keep the left candidate (L250-317).
- **builder-differential.test.ts** ([S7b] L11-25, L106-111, L244-301). The file's own comment says the random test above can't see a builder bug, because "BOTH run the same already-rewritten operation stream". So this test records each operation's *intended* expression before the builder rewrites it (term merging, constant folding, affine composition, constant-gate demotion). It replays that intent in plain float64 and compares against `evaluateReference`. **Continuous wires are compared with tolerance 1e-4, relative and absolute. Only boolean atoms are compared exactly.** It runs 400 circuits × 6 samples, and the test requires more than 50,000 compared wires (83,460 in R1).
- **numeric-semantics.test.ts** ([S7c]). 17 tests:
  - explicit rounding (`roundAffine`) survives consumers, duplicate terms and inlining;
  - range bounds include rounded endpoints and FP32 overflow;
  - min/max ranges "describe their arithmetic, not mathematical bounds";
  - multiplication's derivative at zero;
  - select preserves extreme finite operands;
  - declarations after readers throw;
  - `validateNoNaN` names the select whose unpicked side overflowed.
- **macro-ranges.test.ts** ([S7d]). Its header calls it "Characterization tests for the magnitude preconditions of the macro library... Nothing here is fixed; the tests document the bounds the compiled UI silently relies on." Pinned values:
  - `emitMaximum(2^24, -1) = 16,777,215`, and the first failing integer is exactly 2^24;
  - min/max are exact over 3,000 random integer pairs with |x| < 2^23;
  - min/max are *not* exact for `f(422.8824...)` vs `f(-79.529...)`;
  - clamp01 is exact through 2^24, gives 2 at 2^24+2, and gives 0 at 2^25;
  - `emitMultiply` equals `fround(a*b)` even into overflow.

  Every case also checks tensor === reference.
- **comparison.test.ts** ([S7e] L257-298, L367-378, L381-402). This is the file that checks **comparison bits against native JavaScript comparisons**: `values[bit] !== nativeCompare(a, relation, b)` counts as wrong. (Fact-check: it is not the only runtime test with a native-JS check. macro-ranges.test.ts compares `emitMinimum`/`emitMaximum` with `Math.min`/`Math.max`, at L104-149.)
  - Sign cascades run over five range configurations, from 0..16,384 to ±(largest finite/2) and ±2^-120, with 150 pairs each, with and without ending in an atom. Required: wrong 0 and rounded 0, i.e. no stage operation rounds.
  - Grid bits run over 3,000+ pairs on a 1/64 grid within ±8,192. Required: wrong 0.
  - The 1732 px column test pins that the bit reads the FP32 value 6.9999995, not float64's 7.

### P. Probes run for this dossier

Scripts: `/private/tmp/claude-501/-Users-blamy-Documents-Codex-orly-2/a761f115-e5d3-4a45-b429-b6ac42e99b03/scratchpad/fp32/probe.ts`, `probe2.ts` and `probe3.ts`. Each imports the clone's `src/runtime/numeric-ui-core.ts` and runs with `bun <script>` from the clone. These are on-screen-ready numbers, computed for real.

- **P1. The 2^24 edge.** `Math.fround(2**24)` = 16777216; `fround(2**24+1)` = 16777216; `fround(2**24+3)` = 16777220. `fround(0.1)` = 0.10000000149011612; `fround(5/24)` = 0.2083333283662796 < 5/24.
- **P2. `x >= 3` with x declared 0..16,384 on a 1/64 grid.** 2 live operations in 2 layers. `roundingPoints()` = `{"integer bit": 2}`. Bits: x = 2.984375 → 0; 3 → 1; 3.015625 → 1; 100 → 1.
- **P3. The same comparison with no grid.** 15 live operations, 14 layers, `{"sign cascade": 15}`. The bits are the same, and x = 2.9999998 → 0 (correct).
- **P4. A false grid.** Declare grid 1 and feed x = 2.5: the "bit" comes out **0.5**. On the 1/64 grid, x = 2.9999998, which is off-grid, gives **0.9999847412109375**. `validateGrids` throws "wire 0 must be a multiple of 1, got 2.5". A source value outside its declared range is refused by `evaluateReference` ("source wire 0 is outside its assumed range").
- **P5. An open range.** `emitCompare` on an undeclared source throws "emitCompare needs finite declared ranges on both operands, got -Infinity..Infinity".
- **P6. A false range on a computed wire, i.e. what fails if a range is wrong.** Take `y = roundAffine(x)`, with x honestly declared 0..1e9, and falsely declare `assumeRange(y, 0, 16384)`. Then:
  - `y > 3` answers 0 at y = 20,000, 1,000,000 and 100,000,000 (wrong).
  - `y === 3` answers 1 at y = 20,000, 1e6 and 1e8 (wrong).
  - `y >= 3` and `y < 3` happened to stay right on these values.
  - Over integers 0..40,000, `y > 3` was **wrong for 23,613 of 40,001 values. The first wrong value was 16,388.** There, the first cascade stage computes 2^10 × 16,385 = 16,778,240 > 2^24, so `x - relu(x - 1)` loses the 1.
  - With the honest range 0..1e9, `y > 3` is right at every value tried, and it costs 19 operations instead of 18.
- **P7. Min/max magnitude.** `emitMinimum(f(1000.37), f(0.3))` = 0.29998779296875, while `emitMinimumExact` = 0.30000001192092896 = f(0.3). `emitMaximum(2^24, -1)` = 16777215 and `emitMinimum(2^24, -1)` = 0.
- **P8. The boolean atom.** `boolean(0.49999997)` → 0, `boolean(0.5)` → 1, `boolean(0.3)` → 0, `boolean(0.7)` → 1. The mechanism: `f(f(0.49999997) + 8388609)` = 8388609, while `f(0.5 + 8388609)` = 8388610. 8,388,609.5 is a tie, and round-half-to-even sends it to 8,388,610, the even neighbour. That is why the constant is 2^23 + 1 and not 2^23.
- **P9. The 1732 column.** `f(f(1732-24) × f(1/244))` = 6.999999523162842 in FP32, while (1732-24)/244 = 7 in float64.

### Sign-cascade plan, worked (from code)

`planSignCascade` ([S6] L2230-2248). For a difference bound of 16,384 = 2^14, the first stage can multiply only by 2^10, so that 2^14 × 2^10 = 2^24 stays exact. Each later stage multiplies by 2^24 with limit 1, until the total lift reaches 2^149: 10 + 24×5 + 19 = 149. "Any finite bound needs at most 12 stages" ([S2] L124).

### HandwiredOS hit test (real application)

A press hits a rectangle when it is at least half a pixel inside. So each rectangle compares its 4 edge distances with 0.5, and the 4 bits combine as `relu(sum of bits - 3)`. The host rounds pointer coordinates to 1/64 px and clamps them within ±32,768 px, so each comparison is an integer bit. If the clamp were ±65,536 px instead, a title bar's right edge would span more than 2^24 steps of its 1/128 px grid and become a sign cascade, "13 more operations per window" ([S2] L147).

### GPU compiler probes (lab, 2026-09)

Both wgpu (Deno) and Dawn (Node) gave the same answers. Per the lab, the folding was done by "the compiler behind both stacks", Apple's Metal shader compiler on one machine; "only Apple's Metal compiler was tested" ([S8] L127, L176). On screen, credit the folding to the shader compiler under both stacks, not to wgpu or Dawn themselves. Both stacks:
- folded the boolean atom `(a + 8388609) - 8388609` to `a` (0 of 2 strict);
- fused `a + b*c` (0 of 8 strict).

Wrapping each value in `max(x, lowest)`, with `lowest = -3.4028235e38` loaded from a buffer, restored strict results (8 of 8 and 2 of 2) ([S8] L110-127). The lab's caution: "the guard relies on the compiler not seeing through a runtime value. That held today, but no spec promises it, and only Apple's Metal compiler was tested" ([S8] L176).

### Exactness budget (lab, 2026-09-13)

Seven UIs were run with each sum added "in eight ways" ([S8] L201-205):
- Float64 everywhere broke every UI with round chains, e.g. 1,150,506 wrong rows in life-calendar and 18,820 of 20,000 percent labels.
- Keeping stored FP32 order only at rounding points "brought all four back to 0 flips".
- Rounding points were 4.9% of HandwiredOS's operations then (256 of 5,253).

### Art-department description (accurate to the code)

There is no physical apparatus. These are the honest paper-cut metaphors:
- **The number line as a ruler whose ticks spread out.** Up to 16,777,216 every whole number has a tick. Past it, every other tick goes missing, then three of every four.
- **The grid as pegboard holes** spaced 1/64 px apart. Pointer coordinates are rounded onto the holes by the host.
- **The sign cascade as a series of ratchet stages.** Each stage multiplies the gap by a power of two, which is a lever that only slides the exponent, then clips at 1. Even the smallest possible gap, 2^-149, ends up a full notch.
- **The boolean atom as a detent at the halfway mark.** Add 8,388,609 and take it away again.
- **Declarations as tags tied to each wire**, reading "0..16,384, every 1/64". A false tag lets a gear slip (P6).

---

## 6. Verified quotes

All verbatim from the repo at 257856e, checked by reading the files in the clone.

1. "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" README tagline, [S1] L3.
2. "Exactness means equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic." docs/execution-model.md, Macro contracts, [S2] L257.
3. "FP32 holds every integer exactly only up to 2^24 (16,777,216), and above that, neighboring values are 2, then 4 apart." docs/expressions.md, Magnitude safety, [S3] L41.
4. "Declarations are promises from the caller, not proofs." docs/execution-model.md, Declarations, [S2] L60.
5. "A false declaration can still lead to an invalid optimization, e.g. a false grid turns an integer bit into a fraction" [S2] L60.
6. "A score isn't automatically a decision." docs/expressions.md, Decision bits, [S3] L27.
7. "Make the bit exact at the moment a score becomes a decision" [S3] L27.
8. "The builder records rounding points: operations where the exact FP32 evaluation, term order and operand wires matter." [S2] L157.
9. "`(score + 8,388,609) - 8,388,609` only rounds to a bit when evaluated in FP32 as written, and a shader compiler that simplifies it to `score` breaks it." [S2] L159.
10. "What is guaranteed: on the CPU, the bit is correct for every nonzero FP32 difference, down to 2^-149." [S2] L141.
11. "An exact bit is exact for the FP32 values it compares, not for the float64 arithmetic of the JavaScript it replaces." [S3] L37.
12. "The reference evaluator defines what a program computes, and a compiled program must reproduce every live value." [S2] L50.
13. "That the two evaluators agree doesn't show that a program does what the JavaScript it replaces did." [S2] L50.
14. "Revisit dynamic division only when a real UI needs it." The README's former TODO, quoted in lab/status.md, Parked, [S4] L267.
15. "This is not a proof of all possible circuits or all JavaScript programs." lab/status.md, Correctness changes, [S4] L224.
16. "Nothing here is fixed; the tests document the bounds the compiled UI silently relies on." tests/runtime/macro-ranges.test.ts header comment, [S7d] L14-15.
17. "BOTH run the same already-rewritten operation stream." tests/runtime/builder-differential.test.ts comment, [S7b] L14-15.
18. External: "An implementation may reassociate operations." W3C WGSL spec §15.7.5 Reassociation and Fusion, [W4].
19. External: "Any inputs or outputs of operations listed in § 15.7.4 Floating Point Accuracy may be flushed to zero." WGSL §15.7 (differences from IEEE-754), [W4].
20. External: "The `Math.fround()` static method returns the nearest 32-bit single precision float representation of a number." MDN, [W1].

UNVERIFIED, do not use as a quote: any first-person words from Cheng Lou on exactness. The repo reports his view only in paraphrase ("Cheng's point was that...", [S4] L93).

---

## 7. Debates and controversies (inside the repo)

- **Term order: wire number vs content hash.** A September 17-18 probe sorted sums by a content key.
  - For switching: moving statements stopped changing values.
  - Against: swapping the two arguments of one `emitMultiply` changed 232 of 877 root keys, so bit-identical outputs would stop working as the check for an optimization edit.

  Decision: "not switched" ([S4] L91-93).
- **Magnitude guards: throw vs trust.** exp/'s guard made building throw when min/max operands reached 2^23 or a clamp's operand exceeded 2^24. It found no false positives on 5 UI ranges, but it was "not added" ([S4] L265). The runtime documents the limits and tests them (macro-ranges) instead of enforcing them.
- **Boolean atom vs sign cascade.**
  - The atom is 1 operation, but it needs literal FP32 at the atom, and its gradient throws unless the caller asks for straight-through.
  - The cascade is up to 28 operations, but it survives float64 or reordered evaluation inside each stage.

  The docs: "The boolean atom is a one-operation shortcut for this construction, not a necessity" ([S3] L33; [S2] L127).
- **Exact vs JS float64 parity.** Exact bits follow FP32 values, so they can disagree with float64 JavaScript (the 1732 column). The docs' remedy is to restructure, e.g. compare the width with thresholds instead of using a reciprocal ([S3] L37).
- **Known open issue: NaN.** Range propagation doesn't track NaN. `nan-range-case.ts` finds 10 source tables over 200 random circuits where executor and reference differ. The demos can't reach the case, because their JavaScript validation rejects non-finite sources ([S4] L169).

---

## 8. Misconceptions to avoid

- Do NOT say Handwired "matches JavaScript exactly" in general. It matches its *FP32 reference*, and decisions match JS comparisons *of FP32 values within declared ranges*. Float64 JS can differ (1732 column).
- Do NOT say all of Handwired's arithmetic is exact.
  - Exact: decisions, `emitSelect` at 0/1, `emitMultiply` (= one FP32 product), integers below 2^24, sums on grids.
  - Not exact: min/max/clamp for fractional operands, the Newton reciprocal/divide (≤2.5e-7 / 3e-7), sqrt, sin/cos, spring trajectories versus float64 ([S3] L12-17; [S2] L266).
- Do NOT say the randomized tests compare against JavaScript. random-hardened compares compiled vs reference. builder-differential uses a 1e-4 tolerance. comparison.test.ts is the JS-native check for comparison bits (macro-ranges also checks min/max against `Math.min`/`Math.max`).
- Do NOT say declarations are checked everywhere. Source cells are range-checked at evaluation, and tests call `validateGrids`, `validateIndexReads` and `validateOneHotGroups`. A false range on a computed wire goes uncaught (P6).
- Do NOT say division is in the runtime. "The runtime has no floor division" ([S3] L15), and runtime-divisor division lives in lab folders ([S3] L45).
- Do NOT describe a GPU as guaranteeing these results. All of src/runtime runs on the CPU in JavaScript, "Tensor" means sparse layers, not a GPU ([S2] L298), and WGSL allows subnormal flush and reassociation ([W4]).
- 2^24 is 16,777,216, and 2^23 is 8,388,608. The atom's constant 8,388,609 is 2^23 + 1. Don't round it to "8.4 million" on screen where the exact value matters.
- Do NOT state "174 tests" as the whole repo's suite. It is tests/runtime only. The whole repo had 1,264 at 259c5d2.

---

## 9. Curiosity hooks

1. The cascade's scales for a 0..16,384 comparison are 2^10, five 2^24's, and 2^19. The exponents add up to exactly 149, the distance from the smallest positive FP32 number, 2^-149, up to 1 ([S2] L124; [W2]).
2. The boolean atom's constant is 8,388,609, not 8,388,608. A score of exactly 0.5 lands on a tie, 8,388,609.5, and round-half-to-even sends it to the even neighbour, so 0.5 becomes 1 (P8; [S2] L24).
3. GPU shader compilers "fold" the atom away entirely: `(a + 8388609) - 8388609` becomes `a`. Loading −3.4e38 from a buffer and wrapping the sum in `max` stops them ([S8] L119-127).
4. At a width of 1732 px, a column count computes to 6.9999995 in FP32 but exactly 7 in JavaScript's float64. So the "exact" bit for `columns >= 7` says no ([S3] L37; P9).
5. Lie to the builder that a value stays under 16,384, and `y > 3` first goes wrong at y = 16,388. It is wrong for 23,613 of the integers up to 40,000 (P6).
6. `emitMaximum(16,777,216, -1)` returns 16,777,215. The true maximum loses one, because 2^24 + 1 doesn't exist in FP32 ([S7d] L99-106; P7).
7. Pointer coordinates in HandwiredOS are rounded to 1/64 px precisely so that hit tests become 2-operation integer bits instead of 15-operation cascades ([S2] L147).
8. Running the programs in float64, i.e. "more precise", broke them: 18,820 of 20,000 percent labels came out wrong. They needed FP32's rounding at the rounding points ([S8] L204).
9. The comparison works for differences as tiny as 2^-149 only because subnormal numbers "fill the gap next to 0". A backend that flushes subnormals, which WGSL permits, can call two different numbers equal when they differ by less than 2^-126 ([S2] L124, L141; [W4]).

---

## 10. Visual and dramatic details

There are no rooms or weather here; this is a code-only topic. Honest visual material:
- **On-screen numbers** (all computed): 16,777,216; 16,777,217 → 16,777,216; 8,388,609; 2^-149; 0.29998779; 6.9999995; 174 pass / 0 fail.
- **The README tagline** as a title card ([S1] L3).
- **A terminal frame** showing `bun test tests/runtime` and its four output lines (R1).
- **The cost contrast**: 2 operations versus 15, the same bit (P2/P3).
- **The machines**: the spreading ruler, the pegboard grid, the ratchet cascade, the halfway detent, and tags on wires (section 5, art-department notes).
- **Sound**: the cascade stages could clack like a ratchet, per the brief: machines clack, never chime.

---

## 11. Sources

Repo sources (commit 257856e). Line numbers were read from the local clone.

- [S1] https://github.com/chenglou/handwired/blob/257856e/README.md#L3
- [S2] https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md (FP32 L7-17; Instructions L19-26; Compilation/reference evaluator L50; Declarations L52-64; Comparisons L116-147; Grids L149-153; Rounding points L155-164; Magnitude limits L239-247; Macro contracts L255-288; Backends L296-298)
- [S3] https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md (Familiar expressions table L7-23; Decision bits L25-37; Magnitude safety L39-41; Dynamic division L43-48)
- [S4] https://github.com/chenglou/handwired/blob/257856e/lab/status.md (Runtime additions L5-34; Term order probe L91-93; Known issues L165-177; Correctness changes L214-224; Magnitude guards L265; Dynamic division L267; Deferred L270; Verification L272-283)
- [S5] https://github.com/chenglou/handwired/blob/257856e/src/runtime/cells.ts
- [S6] https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts (evaluateReference L649-652; validateSourceRanges L784-795; evaluateOperationStream L1673-1702; emitCompare L2017-2068; emitGridCompare ~L2090-2170; planSignCascade L2230-2248; emitCascadeCompare ~L2262-2330)
- [S7a] https://github.com/chenglou/handwired/blob/257856e/tests/runtime/random-hardened.test.ts
- [S7b] https://github.com/chenglou/handwired/blob/257856e/tests/runtime/builder-differential.test.ts
- [S7c] https://github.com/chenglou/handwired/blob/257856e/tests/runtime/numeric-semantics.test.ts
- [S7d] https://github.com/chenglou/handwired/blob/257856e/tests/runtime/macro-ranges.test.ts
- [S7e] https://github.com/chenglou/handwired/blob/257856e/tests/runtime/comparison.test.ts
- [S8] https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/codegen/README.md (GPU probes L110-127; caution L176; exactness budget L195-208)
- [S9] https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/numeric-library/README.md (contracts L50-73; reciprocal L64; divide L65)
- [S10] https://github.com/chenglou/handwired/blob/257856e/template/toggle.test.ts (plain-JS reference check, cited by [S2] L50)

Runs (this dossier, 2026-10-27, Bun 1.4.3):

- [R1] `bun test tests/runtime` → 174 pass, 0 fail, 155,853 expect() calls, 11 files, 2.13 s; per-file counts in section 5.
- [P1-P9] probe scripts: `/private/tmp/claude-501/-Users-blamy-Documents-Codex-orly-2/a761f115-e5d3-4a45-b429-b6ac42e99b03/scratchpad/fp32/probe.ts`, `probe2.ts`, `probe3.ts`; instrumented test copies `bd.test.ts` and `rh.test.ts` in the same folder.

External:

- [W1] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
- [W2] https://en.wikipedia.org/wiki/Single-precision_floating-point_format (24-bit significand; integers to ±16,777,216 exact; min subnormal 2^-149; min normal 2^-126; max ≈ 3.4028235e38)
- [W3] https://frama-c.com/2013/05/04/Rounding-float-to-nearest-integer-part-3.html (the add-then-subtract 1.5·2^23 rounding trick; floats in 2^23..2^24 are spaced 1 apart; context for `emitRound`'s 2^23 + 2^22)
- [W4] https://www.w3.org/TR/WGSL/ (§15.7 flush to zero; §15.7.5 Reassociation and Fusion)
- [W5] https://kdab.searchfox.org/firefox-main/source/dom/webgpu/tests/cts/checkout/docs/fp_primer.md (WebGPU CTS floating-point primer: FTZ may apply to inputs and outputs; lead only)
- [W6] https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html (David Goldberg, "What Every Computer Scientist Should Know About Floating-Point Arithmetic", ACM Computing Surveys, March 1991; edited reprint, section "Rounding Error")

---

## 12. Fact-check log (adversarial pass, 2026-10-27)

Method: I re-read every cited repo line in the clone at 257856e3b221 (commit date confirmed: Fri Oct 16 17:33:49 2026 -0700). I re-ran `bun test tests/runtime` and each of the five per-file runs. I re-ran the instrumented copies `bd.test.ts`/`rh.test.ts` and wrote an independent probe, `scratchpad/fc/check.ts`, that rebuilds P1-P9 from scratch. I fetched MDN fround, the W3C WGSL spec (full text, grepped), Wikipedia single precision and Goldberg 1991. All runs used Bun 1.4.3 on macOS arm64.

**Confirmed, no change:**
- The definition of "exact" ([S2] L257, verbatim).
- The reference evaluator and `validateTensorEvaluation ===` ([S2] L50, verbatim).
- Both evaluators call `validateSourceRanges` (numeric-ui-core.ts L650, L752, L774).
- `Math.fround(2^24+1)` = 16,777,216 and `fround(2^24+3)` = 16,777,220 (rerun).
- The `emitCompare` open-range refusal (L2040).
- The false-range probe: `y > 3` wrong for 23,613 of 40,001, first at 16,388 (rerun, identical).
- The false grid gives 0.5 (rerun).
- Integer-bit costs of 2/2/3 ops in 2 layers, and cascade costs of 15/14, 16/15 and 28/14 with matching `roundingPoints()` kinds (rerun).
- The cascade scales 2^10, 2^24 ×5, 2^19 ([S2] L124; the planSignCascade comment L2224-2228).
- The atom's tie: f(0.5+8388609) = 8388610 and f(f(0.49999997)+8388609) = 8388609 (rerun).
- HandwiredOS's rounding-point counts of 59/707/33 ([S2] L164).
- The GPU probe table ([S8] L113-127).
- The exactness budget: 1,150,506 rows, 18,820/20,000 labels, "brought all four back to 0 flips", 256 of 5,253 ([S8] L199-204).
- The 1732 column: 6.999999523162842 vs 7 (rerun).
- min/max at 2^24: 16,777,215 and 0. `emitMinimum(f(1000.37), f(0.3))` = 0.29998779296875 (rerun).
- `emitSelect` returns the chosen operand exactly at ±3.3e38 (rerun).
- The reciprocal and divide bounds 2.5e-7/3e-7 and 50/51 ops ([S3] L16; [S9] L64-65).
- "Revisit dynamic division only when a real UI needs it." ([S4] L267).
- The test counts: 174 pass / 0 fail / 155,853 expect() / 11 files, and per-file 5/2/17/15/15 with 237/15/17,201/4,402 expects (rerun).
- 320 circuits × 5 inputs, 6-19 ops each (random-hardened L67, L97, L207). 400 × 6 and the 1e-4 tolerance (builder-differential L109-110, L244, L272).
- The instrumented counts: 83,460 wires / 8,760 boolean / 4,593 alias, and 2,531 macro applications (rerun).
- All 17 repo quotes in section 6, checked verbatim against the files.
- The WGSL quotes, verbatim: "An implementation may reassociate operations." is in §15.7.5. "Any inputs or outputs of operations listed in § 15.7.4 Floating Point Accuracy may be flushed to zero." is in §15.7.2 Differences from IEEE-754.
- The MDN fround quote, verbatim. MDN Baseline: "available across browsers since July 2015".
- Wikipedia: integers between -16,777,216 and 16,777,216 exact, min subnormal 2^-149, min normal 2^-126.

**Changed:**
1. Section 4 (belief of the age). The dossier attributed the word "approximate" to MDN, but the fround page never uses it (0 occurrences in the fetched page). Replaced with Goldberg 1991's verbatim "Squeezing infinitely many real numbers into a finite number of bits requires an approximate representation" [W6]. "Held by most programmers" is flagged as unsourced framing.
2. Timeline 2026-09-15. The dossier implied the hit tests alone took HandwiredOS from 5,253 to 3,654 ops and 192 to 124 layers. [S4] L14 gives those numbers for the whole Sept-15 move to the runtime additions (springs, `advanceFrame`, events and hit tests). Reworded, and the citation corrected from L12 to L14.
3. Timeline 2026-10-14. Citation corrected from L34 to L36 (the history-rewrite and made-public sentence).
4. Timeline "July 2026". [S4] L270 says only "In July". The year is marked as inferred.
5. Rounding points (summary). Added the nuance from [S2] L160-161: only boolean and marked operations need the stored order. For integer-bit and sign-cascade operations, a backend may reorder, fuse or use float64 within each operation, as long as each operation stays separate. The phrase "where the exact FP32 evaluation, term order and operand wires matter" is verbatim, but it is the docs' umbrella wording, so don't read it as "order matters inside every rounding point".
6. GPU probes. The folding is attributed by the lab to "the compiler behind both stacks", and "only Apple's Metal compiler was tested" ([S8] L127, L176). So it was not shown to be wgpu or Dawn themselves. Clarified.
7. comparison.test.ts. It is the native-JS check for comparison *bits*. macro-ranges.test.ts also compares min/max with `Math.min`/`Math.max` (L104-149). Qualified in section 5 and section 8.
8. Boolean-atom citation. "[S2] L127" does not discuss the atom. Corrected to [S2] L24, L28, L126, L159 and [S3] L32.

**Notes for the script (not errors):**
- The test-suite time varies run to run: 2.13 s in R1, 2.05 s in this rerun. Don't put a two-decimal time on screen as if it were fixed; "about 2 seconds" is safe.
- "This is not a proof of all possible circuits or all JavaScript programs." is verbatim ([S4] L224). It is the closing paragraph of the "Correctness changes" section, after its bullet list, not the list's last bullet.
- The exactness-budget measurements are dated September 13, 2026, and were merged into the codegen README on September 16, 2026 ([S8] L197-199). They ran on programs from before September 15, so the 256-of-5,253 figure describes the old HandwiredOS. Those rounding points were recovered by pattern, not from builder records.
- In the exactness budget's float64-everywhere mode, the atom was evaluated as `score >= 0.5` ([S8] L201).

