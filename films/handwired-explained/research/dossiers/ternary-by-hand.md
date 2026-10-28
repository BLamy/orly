# Dossier: Deep Dive 1 — `(a > 4) ? 10 : 12`, worked by hand in ReLU arithmetic

- Topic id: `ternary-by-hand`
- Era: repository `chenglou/handwired` pinned at `257856e3b221140acb4cc4460626b850c0bd4ff1` (author date 2026-10-16, pinned for the film 2026-10-27). Local clone: `/Users/blamy/Documents/Codex/orly-2/.orly-work/repos/handwired`.
- Source convention: `R:path#Lx-Ly` means `chenglou/handwired@257856e:path#Lx-Ly` (https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/path#Lx-Ly).
- Runs: Bun 1.4.3 on this machine, cwd = the clone. Scripts saved at `films/handwired-explained/research/runs/ternary.ts` and `multiway.ts`, and their full output is pasted below as the source of record.

---

## 1. Summary

The README opens with a single example: the JavaScript ternary `(a > 4) ? 10 : 12`, rewritten as ReLU arithmetic (R:README.md#L9-L24). `above4 = max(0, a-4) - max(0, a-5)` is a ramp that is 0 below a = 4 and 1 above a = 5, rising in a straight line in between. Every integer falls either on or below 4, or on or above 5, so for an integer `a` the ramp is always exactly 0 or 1. Then `result = above4*10 + (1-above4)*12` computes **both** branch values and uses the 0/1 bit to keep one of them. For a = 5, 4, 3, 6 and 100 the arithmetic gives 10, 12, 12, 10 and 10, the same as JavaScript (run below). The README says "For an integer a" for a reason: at a = 4.5 the ramp sits halfway, so above4 = 0.5 and the result is 11. JavaScript says 10, and 11 is neither branch.

The real library does not ship the README line literally. `emitCompare` (R:src/runtime/numeric-ui-core.ts#L2017-L2077) picks one of two constructions based on what the caller has *declared* about the operand:
- **Integer bits** apply when both operands lie on grids and every partial sum stays within 2^24 grid steps (R:docs/execution-model.md#L123). A constant threshold such as 4 gets a grid automatically (R:src/runtime/numeric-ui-core.ts#L2083-L2091), so declaring `assumeGrid(a, 1)` on `a` is enough here. `a > 4` becomes `relu(1 - relu(1 - D))` with `D = (a - 4)/grid = a - 4`. That is the same ramp in a "ReGLU product" form: 2 operations, 2 layers. It is exact *only if the grid promise is true*. At a = 4.5 under a false grid-1 declaration, the real library also outputs bit 0.5 and result 11 (run below; the same behaviour is pinned by a test, R:tests/runtime/comparison.test.ts#L557-L563). `validateGrids` catches that false promise in tests ("wire 0 must be a multiple of 1, got 4.5").
- **A sign cascade** is used when there is no grid. The difference `f(a - 4)` is kept as its own operation, then multiplied by powers of two and clamped in stages until any nonzero FP32 difference, down to 2^-149, reaches at least 1. This is exact for *every* FP32 value in the declared range, 4.5 included, and costs 16 operations in 15 layers for the bit alone (run below; doc table R:docs/execution-model.md#L130-L137).

The full ternary (bit + `emitSelect`) compiles to **8 live operations in 5 layers** on a grid, or **22 live operations in 18 layers** with the cascade (run below). Both branches always compute. A branch in a Handwired program costs the same on every evaluation, whichever side wins. The select itself is "4 in 3 layers per selected number" (R:docs/expressions.md#L11). There are two ways to make a multi-way choice. One nests selects (an else-if chain: 15 live ops / 7 layers for a 3-way choice in our run). The other turns monotone threshold bits into a **one-hot** and takes a masked sum, which the compiler lowers to a gather once the one-hot is declared (13 → 10 live ops, 5 → 4 layers in our run). For many candidates, `emitFirstActive`/`emitArgmax` build trees (R:docs/patterns.md#L100-L121).

---

## 2. Timeline (dated events)

| Date | Event | Source |
|---|---|---|
| Dec 1943 | McCulloch & Pitts publish "A logical calculus of the ideas immanent in nervous activity", *Bull. Math. Biophysics* 5:115–133. Its "all-or-none" threshold neurons are the old idea that neurons compute logic. It is brief framing only, not Handwired's lineage as the repo states it. | https://doi.org/10.1007/BF02478259 ; https://link.springer.com/doi/10.1007/BF02478259 |
| 12 Feb 2020 | Noam Shazeer posts "GLU Variants Improve Transformer" (arXiv 2002.05202), which names gated-linear-unit variants including ReGLU, defined as `max(0, xW + b) ⊗ (xV + c)` (Eq. 5). Handwired's instruction is named `reglu` and has the same shape, `f(left × max(0, gate))` (R:docs/execution-model.md#L23). The repo does not cite the paper, so this is a naming parallel, not a documented lineage. | https://arxiv.org/abs/2002.05202 ; https://ar5iv.labs.arxiv.org/html/2002.05202 |
| (lab era, dates in lab/) | The comparison constructions were ported from lab experiments: `lab/ui-exploration/guide/examples/comparisons/sign-cascade.ts` and `rewrites.ts`, and `lab/ui-exploration/numeric-library`. | R:src/runtime/numeric-ui-core.ts#L2094-L2097, #L2219-L2220, #L2255-L2256 ; R:tests/runtime/comparison.test.ts#L19-L22 |
| 2026-10-16 | Commit `257856e` (the pinned commit), message "lab: an experiment that trains a strict parser's unused table entries until it recovers from errors…" | `git -C .orly-work/repos/handwired log -1` |
| 2026-10-27 | Film's as-of date; the README example is unchanged on GitHub's `main` page (fetched 2026-10-27). | https://github.com/chenglou/handwired |

The repository says nothing about when the README example was first written. Do not date it.

---

## 3. People

- **Cheng Lou (`chenglou`)** is the author of the repository (copyright holder, R:LICENSE#L3; every one of the 825 commits up to 257856e is authored by "Cheng Lou", `git log --format=%an`) and the live demos are at https://chenglou.me/handwired/ (R:README.md#L40). Per the brief, the film says only what the repo says. The README states its goals in the first person plural and in a playful tone ("for fun", "funny use-cases", "what does that even do? Let's find out!", R:README.md#L26-L35). **No biography, motives, location, or appearance are sourced here.** For depiction, use a generic, anonymous silhouette of "the programmer at a desk", not a likeness. Do not invent his words.
- **Warren S. McCulloch and Walter Pitts** (framing only). In 1943 McCulloch was at the Department of Psychiatry, Illinois Neuropsychiatric Institute, University of Illinois College of Medicine, Chicago, and Pitts was at the University of Chicago (Springer record, https://link.springer.com/doi/10.1007/BF02478259). This dossier did not research their appearance. Defer to the film's history dossiers if they are depicted at all.

---

## 4. The belief of the age

What a programmer usually takes for granted: **a branch is free in the sense that only the taken side runs.** In JavaScript, `(a > 4) ? 10 : 12` evaluates the condition and then exactly one arm: MDN describes `exprIfTrue` as "An expression which is executed if the `condition` evaluates to a truthy value" and `exprIfFalse` as executed "if the `condition` is falsy" (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator). Another assumption the film may voice, that a neural network's ReLUs only approximate decisions softly so "exact" logic needs real control flow, is **unsourced framing**: no source here attributes it to any person or group, so present it as a plausible intuition, not as a documented belief.

Handwired works under a different set of assumptions, stated in its own docs:
- A program is "a fixed list of arithmetic operations over 32-bit floats … mostly weighted sums and products with a ReLU" (R:docs/README.md#L3).
- "The program runs every operation on every frame and can't stop early" (R:docs/patterns.md#L3; R:docs/README.md#L9).
- `emitSelect` "computes both sides and picks one, so an `if` that assigns a cell becomes a select on the cell's next value" (R:docs/tutorial.md#L93). In the expressions table: "Both sides always compute" (R:docs/expressions.md#L11).
- Exactness is possible on a stated contract. A ReLU ramp is an exact step *on integers*, and the general comparison is exact for every FP32 pair inside finite declared ranges (R:docs/execution-model.md#L116-L141).

That two ReLUs make an exact integer step is standard mathematics, not a Handwired invention. A 2026 arXiv paper on recurrent ReLU computation, for example, replaces threshold tests on integer-valued arguments with a fixed two-ReLU gadget, "Gate(t):=ReLU(t)−ReLU(t−1)" (Section 6, Lemma 20: "For every integer u, one has Gate(u)=0 if u≤0 and Gate(u)=1 if u≥1"), and states the same caveat: "whenever the arguments of the threshold tests are integer-valued, the threshold primitive can be replaced exactly" (Olivier Bournez, "Primitive Recursion without Composition: Dynamical Characterizations, from Neural Networks to Polynomial ODEs", arXiv 2604.24356v1, submitted 27 April 2026, https://arxiv.org/html/2604.24356v1; found by search, used here only as corroboration of the general idea, not as Handwired's lineage). The step that is specific to Handwired is the FP32-exact sign cascade for *non-grid* operands, together with the declaration machinery (ranges, grids, rounding points).

---

## 5. Experiments and results (the real numbers)

### 5.1 The README text, verbatim (R:README.md#L7-L26)

```
7   A program's made of if-else, loops, and state. Handwired transforms them into matrix multiplication + reglu over floats. For example:
9   ```ts
10  const a = 5
11  const result = (a > 4) ? 10 : 12
12  ```
14  The above can be expressed as basic arithmetic:
16  ```ts
17  const a = 5
18  // Math.max(0, x) is ReLU. For an integer a, above4 is 1 if a > 4, and 0 otherwise
19  const above4 = Math.max(0, a - 4) - Math.max(0, a - 5)
20  // Both branches compute, and above4 picks one
21  const result = above4 * 10 + (1 - above4) * 12
22  ```
24  You can calculate that by hand and see that both arrive at the same result.
26  We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun.
```
(The file at the pinned commit uses ```` ```ts ```` fences. The rendered README on GitHub's `main` page, fetched 2026-10-27, has the same wording; a rendered page does not reliably show a fence's language label, so make no claim about it.)

### 5.2 Hand-computed table, checked by running Bun

Command (cwd `.orly-work/repos/handwired`): `bun films/handwired-explained/research/runs/ternary.ts` (Bun 1.4.3). Section 1 of its output:

```
a     max(0,a-4)  max(0,a-5)  above4  result  ternary  match
5     1           0           1       10      10       true
4     0           0           0       12      12       true
3     0           0           0       12      12       true
6     2           1           1       10      10       true
100   96          95          1       10      10       true
4.5   0.5         0           0.5     11      10       false
4.25  0.25        0           0.25    11.5    10       false
0     0           0           0       12      12       true
-3    0           0           0       12      12       true
```

By hand, a = 5: max(0,1)=1, max(0,0)=0, above4 = 1, result = 1·10 + 0·12 = **10**. For a = 100, both ReLUs are large (96 and 95), but their *difference* is 1. The ramp has flattened out, and the bit stays 1 however large `a` gets, at least in float64 and FP32 up to the magnitude limits (see 8). For a = 4.5 the ramp is mid-climb: 0.5 − 0 = 0.5, and the result is 0.5·10 + 0.5·12 = **11**, a value neither branch produces.

Shape of `above4` as a function of real `a`: it equals `clamp(a − 4, 0, 1)`. It is flat at 0 up to 4, a straight 45° ramp from 4 to 5, and flat at 1 from 5 on. The integers 4 and 5 sit exactly at the two corners, so no integer ever lands on the slope. **That is the whole trick, and it is also the whole caveat.**

### 5.3 How the real builder emits this expression

Code path:
1. `emitCompare(circuit, a, '>', circuit.constant(4))` (R:src/runtime/numeric-ui-core.ts#L2017). The constant is a "constant wire, … which folds into the bias" (R:docs/execution-model.md#L118). Relation `>` maps to the sign test `'greater'` (L2027-L2029).
2. Both operands need finite declared ranges or the builder throws: "emitCompare needs finite declared ranges on both operands" (L2040).
3. `emitGridCompare` (L2100) is tried first. If `a` has a grid and every partial sum fits in 2^24 grid steps, it calls `emitIntegerBit` (L2197-L2209), where `D > 0 is relu(1 - relu(1 - D))` (comment L2188-L2196). Otherwise `emitCascadeCompare` (L2262) builds the sign cascade.
4. `emitSelect(circuit, gate, off, on)` (L1966) calls `Circuit.select` (L435-L443), which builds `complement = roundAffine(1 − gate)`, `selectedOn = multiply(gate, on)`, `selectedOff = multiply(complement, off)`, and their sum, tagged `macro: {kind: 'select'}`. Doc formula: `gate × on + (1 - gate) × off, with preserved rounding` (R:docs/execution-model.md#L264). Argument order: **off first, then on**. JS `c ? 10 : 12` is `emitSelect(circuit, c, 12, 10)`.

Why the library uses `relu(1 − relu(1 − D))` rather than the README's `relu(D) − relu(D − 1)`: the two agree at every integer (and in fact for all real D both equal clamp(D,0,1)). The library's version ends in a ReGLU *product*, "so readers can't copy large ReLU values into their own sums, the pitfall lab/ui-exploration/input and lists hit with the sum form" (R:src/runtime/numeric-ui-core.ts#L2193-L2196). The README's form is the teaching form. expressions.md still presents `relu(score) - relu(score - 1)` as an exact integer bit for counts (R:docs/expressions.md#L31).

Run output (same script, sections 2-5). Each op line reads `kind left=terms+bias gate=terms+bias`; `reglu` computes `f(left × max(0, gate))`, wire 0 is `a`:

**(A) `a` declared in −1000..1000 with `assumeGrid(a, 1)`: integer bits**
```
built operations: 9
bit alone: 2 live operations, 2 layers
bit + select: 8 live operations, 5 layers
  op 1: affine left=[]+4                       (the constant 4; folds away, not live)
  op 2: reglu left=[]+1 gate=[[0,-1]]+5         ramp  = relu(5 - a) = relu(1 - D)
  op 3: reglu left=[]+1 gate=[[2,-1]]+1         bit   = relu(1 - ramp)
  op 4: affine left=[]+12                      constant 12 (stays live: select reads it as written)
  op 5: affine left=[]+10                      constant 10 (stays live)
  op 6: affine left=[[3,-1]]+1                 complement = 1 - bit
  op 7: reglu left=[[3,1]]+0 gate=[[5,1]]+0 macro=multiply    bit × relu(10)
  op 8: reglu left=[[6,1]]+0 gate=[[4,1]]+0 macro=multiply    (1 - bit) × relu(12)
  op 9: affine left=[[7,1],[8,1]]+0 macro=select              result
  a=5: bit=1 result=10 tensor=10 js=10
  a=4: bit=0 result=12 tensor=12 js=12
  a=3: bit=0 result=12 tensor=12 js=12
  a=6: bit=1 result=10 tensor=10 js=10
  a=100: bit=1 result=10 tensor=10 js=10
  a=4.5: bit=0.5 result=11 tensor=11 js=10      <- false grid declaration
```
By hand at a = 5: ramp = relu(0) = 0, bit = relu(1) = 1, complement 0, 1·10 = 10, 0·12 = 0, sum **10**. At a = 4: ramp = relu(1) = 1, bit = relu(0) = 0, complement 1, 0 + 12 = **12**. At a = 3: ramp = relu(2) = 2, bit = relu(−1) = 0, giving **12**. At a = 4.5: ramp 0.5, bit 0.5, 5 + 6 = **11**.
Layers (dependency depth): ramp and the two constants (1), bit (2), complement and bit×10 (3), (1−bit)×12 (4), sum (5). `tensor` is the compiled matmul evaluator (`evaluateTensor`) and agrees with the reference evaluator everywhere.

**(B) the same, with no grid: sign cascade**
```
built operations: 23
bit alone: 16 live operations, 15 layers
bit + select: 22 live operations, 18 layers
  op 2: affine left=[[0,1]]+-4                         d = f(a - 4), kept as its own operation
  op 3/4: reglu gate=[[2,16384]]+0 / +-1               stage 1: ×2^14, then min(1, ·) = x - relu(x - 1)
  op 6..15: five stages with coefficient 16777216 (=2^24)
  op 16: reglu left=[]+1 gate=[[15,-32768]]+1          final: relu(1 - 2^15 · stage)
  op 17: reglu left=[]+1 gate=[[16,-1]]+1              bit
  ... select as in (A)
  a=4.5: bit=1 result=10 tensor=10 js=10               <- correct for a non-integer
```
The scales are 2^14 · (2^24)^5 · 2^15 = 2^149 (fact-check recomputed `planSignCascade` for bound 1004: [14, 24, 24, 24, 24, 24, 15]). The first six are clamp stages `min(1, scale × input)`; the last scale, 2^15, is not a clamp but the final ReGLU `relu(1 - 2^15 · stage)`, after which `bit = relu(1 - that)` (R:src/runtime/numeric-ui-core.ts#L2337-L2352). That is the "lifts every nonzero d, down to 2^-149, to at least 1" of R:src/runtime/numeric-ui-core.ts#L2009-L2012 and R:docs/execution-model.md#L124. (The doc's worked example uses operands within 0..16,384 and gets first scale 2^10. Our bound of 1004 allows a first scale of 2^14.) Our count of 16 ops / 15 layers matches the doc table's `a > b` sign-cascade row (R:docs/execution-model.md#L134).

**(C) grid 1 + `{endWithBoolean: true}`**: bit alone is **1 operation, 1 layer** (a single boolean atom, score `0.5 + (a−5)·2^-24`, op `boolean left=[[0,5.96e-8]]+0.49999970`). Bit + select is 7 live ops in 4 layers. Under the false grid at 4.5 the atom gives bit 0 → result 12, wrong the *other* way. A false declaration has no single "graceful" failure.

**(D) no grid + endWithBoolean**: 15 live ops / 13 layers for the bit, 21 / 16 with select. Correct at 4.5.

These match the doc cost table (R:docs/execution-model.md#L132-L137): integer bits 2 ops/2 layers for `>`, one atom 1/1, cascade 16/15, cascade+atom 15/13.

### 5.4 The integer caveat, stated honestly

- The README's own comment scopes the claim: "For an integer a" (R:README.md#L18). For a non-integer, `above4` interpolates and the "select" blends: a = 4.5 gives 11, and a = 4.25 gives 11.5 (run above).
- In the real library the scope is set by **declarations, which are promises, not proofs**: "Declarations are promises from the caller, not proofs … e.g. a false grid turns an integer bit into a fraction" (R:docs/execution-model.md#L60; also R:docs/expressions.md#L41).
- The test suite pins exactly this: with `a` declared on grid 1, `[a >= 5]` at 4.5 evaluates to 0.5 and has gradient 1 there (`[3, 4, 4.5, 5, 6] → gradients [0, 0, 1, 0, 0]`, `toBe(0.5)`) (R:tests/runtime/comparison.test.ts#L557-L563). The docs explain: "Integer bits give an operand a nonzero gradient only when D is a fraction strictly between -1 and 1 … That only happens when a grid declaration is false" (R:docs/execution-model.md#L143).
- Tests catch it: run (multiway.ts, section 1): `a=5: validateGrids ok, bit=1` / `a=4.5: validateGrids threw: wire 0 must be a multiple of 1, got 4.5`.
- Without a grid, `emitCompare` is exact for non-integers too: "For every pair of values within the declared ranges, the bit equals JavaScript's comparison of the two wires' FP32 values" (R:docs/execution-model.md#L118). This guarantee is about **FP32** values. A threshold that isn't an FP32 number (e.g. 5/24) must be picked as an FP32 value before building, and which one depends on the relation. For `x >= t`, the docs say: "store the smallest FP32 value at or above t" (R:docs/expressions.md#L9). That rule does **not** carry over to `x > t`: there the matching FP32 threshold is the largest FP32 value below t, which for 5/24 is `f(5/24)` itself (fact-check, node: `f(5/24)` = 0.20833332836…, the next FP32 up is 0.20833334326…, and at x = that next value JavaScript's `x > 5/24` is true while `x > next` is false). execution-model.md#L118 states the round-up rule without naming the relation, so do not put it on screen as a general rule. On GPUs that flush subnormals to zero, differences below 2^-126 can misreport (R:docs/execution-model.md#L141).
- Real-world grids: HandwiredOS's host rounds pointer coordinates to 1/64 px. Each window hit test compares 4 edge distances with 0.5 and gets integer bits; widening the pointer range to ±65,536 px (from ±32,768) means "each title bar's right edge distance spans more than 2^24 steps of its 1/128 px grid, and that comparison becomes a sign cascade, 13 more operations per window" (R:docs/execution-model.md#L147).

### 5.5 Why both branches run, and what it costs

- There is no jump instruction. The program has only four instruction kinds: `affine`, `reglu`, `boolean`, `index` (R:docs/execution-model.md#L21-L28). An evaluation runs the whole fixed list: "can't stop early" (R:docs/patterns.md#L3).
- Cost of a select: "4 in 3 layers per selected number when the condition's range is within 0..1 … and 8 in 4 for a condition with no declared range" (R:docs/expressions.md#L11). In our run: 8 live − 2 (bit) − 2 (constants kept live) = 4 ops for the select, adding 3 layers (2 → 5).
- In JS, the untaken branch costs nothing. Here it always costs its full work. Tutorial: "Each call of `insideTrack` appends a whole hit test, and the program computes both hit tests in every evaluation" (R:docs/tutorial.md#L93).
- The two-product expansion is deliberate: `off + gate × (on − off)` "can lose a small selected value, or overflow `on - off` even when both candidates are finite" (R:docs/execution-model.md#L276). At gate exactly 0 or 1, the select "returns the corresponding finite operand exactly, including extreme magnitude differences" (L264).
- The hazard is that an unselected side still multiplies: "An unselected `Infinity` still gives `NaN`, since `0 × Infinity` is `NaN`" (R:docs/expressions.md#L11; R:docs/execution-model.md#L278).
- What it buys: no data-dependent control flow, so the whole program is one fixed sequence of sparse matmul layers ("Independent instructions at the same dependency depth share a layer", R:docs/execution-model.md#L40). The select is also differentiable, with the macro record giving correct gradients through a gate of 0 (R:docs/execution-model.md#L34).

### 5.6 Multi-way branches: else-if and one-hot

Run: `bun films/handwired-explained/research/runs/multiway.ts`, for `a > 8 ? 30 : a > 4 ? 10 : 12`, `a` on grid 1:

```
else-if (nested selects): 15 live ops, 7 layers
  a=3: above4=0 above8=0 result=12 js=12
  a=4: above4=0 above8=0 result=12 js=12
  a=5: above4=1 above8=0 result=10 js=10
  a=8: above4=1 above8=0 result=10 js=10
  a=9: above4=1 above8=1 result=30 js=30
  a=100: above4=1 above8=1 result=30 js=30

one-hot masked sum (lowerGathers=false): 13 live ops, 5 layers
one-hot masked sum (lowerGathers=true): 10 live ops, 4 layers
  a=3: onehot=[1,0,0] result=12   a=5: onehot=[0,1,0] result=10   a=9: onehot=[0,0,1] result=30  (all match js)
```
- **Else-if as nested selects.** The inner select feeds the outer one's "off" side. Every level adds a select, and every arm is computed.
- **One-hot.** Monotone bits `[a>4], [a>8]` (they only go 0→1 as a grows) become a one-hot by **neighbor differences**: low = 1 − above4, mid = above4 − above8, high = above8. Exactly one of these is 1. The result is `Σ onehot[i] × value[i]`. Once declared with `circuit.assumeOneHot`, "a masked read of the selection … compiles to one gather" (R:docs/patterns.md#L119; R:docs/execution-model.md#L66-L76). The same neighbor-difference construction is the repo's "findIndex when the test flips once" pattern: 3n + 3 operations in 3 layers, "195 in 3 at 64 rows, against 447 in 34 for a tree built with `emitFirstActive`" (R:docs/patterns.md#L80-L81). A gather "only shortens the read after a selection exists: the selection and every candidate are still computed" (R:docs/execution-model.md#L76).
- **N overlapping options (first match wins, like an `if…else if` over hit tests).** `emitFirstActive(circuit, gate, hitBits)` is a balanced tree, "O(n) operations in O(log n) layers … At 64 candidates, `emitFirstActive` is 316 operations in 31 layers, against 127 in 127 for the chain, and `emitArgmax` is 437 in 33" (R:docs/patterns.md#L117-L118). For a few candidates the chain is cheaper: "at 4 candidates the chain is 7 operations and the tree 16" (L120).
- **Index instead of one-hot.** For reading a table at a computed integer, `circuit.indexRead` is 1 operation: "over 10,000 entries, a ReLU one-hot masked sum compiles to 30,002 live operations and 49,998 stored weights with gather lowering, while the index read compiles to 1 operation and 1 stored weight" (R:docs/execution-model.md#L114).

### 5.7 The test suite

`bun test tests/runtime/comparison.test.ts` at 257856e: **15 pass, 0 fail, 4402 expect() calls, 306 ms** (original research run 2026-10-27). Fact-check status: the file has exactly 15 `test(...)` blocks (static count, lines 257-635), so "15 tests" is confirmed; the pass/fail result, the 4402 expect() calls and the 306 ms were **not re-run** in the fact-check (code execution was not permitted in that pass) and rest on the original run alone. Re-run before putting 4,402 on screen. The suite checks every relation (`>, >=, <, <=, ===`) against native JavaScript comparisons, over thousands of random pairs and "every class of FP32 difference" (R:tests/runtime/comparison.test.ts#L256-L257, L381-L402). It also pins the costs `{operations: 2, layers: 2}` for grid bits and `{operations: 15, layers: 14}` for the cascade fallback (L404-L443), and checks that compiled tensor programs agree bit for bit with the reference (`checkTensorAgreement`, L238-L254).

### 5.8 Apparatus (for the art department)

There is no physical apparatus. It is all arithmetic. Suggested teaching machines, each faithful to the numbers above:
- **Two ramps, one subtraction.** Two paper-cut ReLU ramps (hinged boards: flat floor, then a 45° climb) with corners at 4 and 5. A marble at position `a` reads the height on each, and a lever arm shows their difference. Between 4 and 5 the difference is the slope itself, and the "half-way" marble at 4.5 must visibly read 0.5.
- **Both branches run.** Two conveyor arms carrying "10" and "12" tiles always run. A shutter driven by the bit opens one arm fully and closes the other: 1·10 + 0·12. At 4.5, both shutters stand half open and an "11" tile drops out, a coin with no face, shown honestly as a wrong answer.
- **Sign cascade.** A series of seven magnifying lenses (×2^14, then ×2^24 five times, then ×2^15). The first six are each followed by a stop at height 1 (the clamp). The seventh has no stop: it feeds `relu(1 − 2^15 · stage)`, which reads 0 for any lifted difference and 1 for none, and a last flip `relu(1 − ·)` gives the bit. A hairline difference becomes a full-height bar.
- **One-hot.** A row of three slots of which exactly one is lit, with a sliding selector that reads one tile (the gather).
Machines clack, never chime (brief).

---

## 6. Verified quotes (verbatim)

All from the repository at 257856e (the brief allows README and docs quotes verbatim). Speaker: the Handwired README/docs (author Cheng Lou); quote as "the README says", not as spoken words.

1. "A program's made of if-else, loops, and state. Handwired transforms them into matrix multiplication + reglu over floats." — R:README.md#L7. Context: opening of "How It Works".
2. "// Math.max(0, x) is ReLU. For an integer a, above4 is 1 if a > 4, and 0 otherwise" — R:README.md#L18.
3. "// Both branches compute, and above4 picks one" — R:README.md#L20.
4. "You can calculate that by hand and see that both arrive at the same result." — R:README.md#L24.
5. "We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun." — R:README.md#L26.
6. "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item." — R:docs/patterns.md#L3.
7. "`emitSelect(circuit, condition, off, on)` computes both sides and picks one, so an `if` that assigns a cell becomes a select on the cell's next value." — R:docs/tutorial.md#L93.
8. "Declarations are promises from the caller, not proofs." — R:docs/execution-model.md#L60.
9. "e.g. a false grid turns an integer bit into a fraction" — R:docs/execution-model.md#L60 (also R:docs/expressions.md#L41).
10. "For every pair of values within the declared ranges, the bit equals JavaScript's comparison of the two wires' FP32 values." — R:docs/execution-model.md#L118.
11. "No tool converts existing JavaScript source into a program." — R:docs/README.md#L3. Context: you write builder code by hand, and it appends operations to a `Circuit`.
12. "Gather lowering only shortens the read after a selection exists: the selection and every candidate are still computed." — R:docs/execution-model.md#L76.
13. "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" — R:README.md#L3 (tagline; pair it with quote 11 to avoid implying automatic conversion).

14. (External, framing only.) "ReGLU(x,W,V,b,c) = max(0,xW+b) ⊗ (xV+c)" — Noam Shazeer, "GLU Variants Improve Transformer", arXiv 2002.05202v1 (submitted 12 Feb 2020), Section 2, Eq. 5, introduced by "We can also define GLU variants using other activation functions:" (https://ar5iv.labs.arxiv.org/html/2002.05202). Verified in the fact-check; previously listed as unverified.

---

## 7. Debates and controversies

- **"Turn your regular JavaScript code into a neural net" vs. "No tool converts existing JavaScript source".** The tagline (R:README.md#L3) and the docs (R:docs/README.md#L3) say different-sounding things. The docs are precise: you rewrite the logic as builder code by hand, and nothing compiles your JS automatically. The film should say "rewritten by hand", not "converted".
- **Is the README example "exact"?** For integers, yes, and the README says so. For non-integers, no (4.5 → 11). The library's general answer is that it is exact under declared ranges/grids, and that a false grid declaration produces fractions. Both sides of this are sourced in 5.4. There is no external controversy, only a scope to state honestly.
- **Cost of "both branches".** A JS branch evaluates one side. Handwired evaluates both, every time. The repo presents the payoff as parallelism ("GPU-level of parallelism with JS code that was written in a traditional single-threaded way", R:README.md#L36) and differentiability. It also states the costs: CPU executor "pays per operation" (R:docs/patterns.md#L120); 2,367,454-op programs take ~3 s to build (R:docs/execution-model.md#L48). Present both.
- **Gradients through a decision.** Through a correct integer bit the gradient is 0 (a step). The docs call a soft comparison "a training choice, not an exact derivative of a hard decision" (R:docs/execution-model.md#L36). This is a design position, not a dispute.

---

## 8. Misconceptions to avoid

1. "ReLUs make an exact if for any number." No. `max(0,a−4) − max(0,a−5)` is exact only for integers (or other values that never land strictly between 4 and 5). At 4.5 it gives 0.5.
2. "The library uses the README formula." Not literally. For grid operands it uses `relu(1 − relu(1 − D))` (same values, product form). For non-grid operands it uses a 16-op sign cascade.
3. "Handwired checks that your integer is an integer." It does not check this at run time. The grid is a promise, checked only in tests by `validateGrids`.
4. "The untaken branch is skipped." Never. Both are computed, and an unselected `Infinity` even poisons the result into NaN.
5. "`emitSelect(c, cond, a, b)` means cond ? a : b." The argument order is `(gate, off, on)`, so `cond ? 10 : 12` is `emitSelect(c, cond, 12, 10)`.
6. "Exact = matches float64 JavaScript." The guarantee is against **FP32** values (`Math.fround`). A threshold like 5/24 must be picked as an FP32 value before building: for `>=`, the smallest FP32 value at or above it (R:docs/expressions.md#L9); for `>`, the largest FP32 value below it (see 5.4). Do not say "always round up".
7. "The select is 3 operations." It is 4 (complement, two products, sum) in 3 layers. Our full 8-op count also includes 2 live constant wires and the 2-op bit.
8. "`circuit.operations.length` is the program size." Built ops overstate it (9 built vs 8 live in our run). Count `program.valueCount − program.sourceSize` (R:docs/execution-model.md#L46).
9. "A one-hot gather skips the other options." The gather only shortens the *read*. All candidates are still computed (R:docs/execution-model.md#L76).
10. "a = 100 might break it because the ReLUs are huge." No. 96 − 95 = 1, exact in FP32. Clamp plateaus only break near 2^24 (R:docs/execution-model.md#L288).

---

## 9. Curiosity hooks

1. At a = 4.5 the README formula answers **11**, a number that appears in neither branch. The real library does the same if you lie to it about `a` being an integer (run; R:tests/runtime/comparison.test.ts#L563).
2. Tell the library the truth (no grid) and it builds a 16-step "magnifier" that blows up any nonzero difference, down to 2^-149, by a total factor of exactly 2^149 (run; R:docs/execution-model.md#L124).
3. One honest sentence about your input (`assumeGrid(a, 1)`) shrinks the comparison from 16 operations to 2 (run; R:docs/execution-model.md#L132-L136).
4. With `endWithBoolean`, the comparison is a single instruction that adds 8,388,609 and subtracts it again. FP32 rounding *is* the decision (R:docs/execution-model.md#L24; run op `boolean`).
5. For a = 100 the two ReLUs read 96 and 95, both big, yet their difference is exactly 1 (run).
6. The select avoids the "obvious" formula `off + gate·(on − off)` on purpose, because it can overflow even when both candidates are finite (R:docs/execution-model.md#L276).
7. An unchosen branch that holds Infinity still ruins the answer: 0 × Infinity is NaN (R:docs/expressions.md#L11).
8. Choosing among 64 overlapping click targets as a tree takes 31 layers, against 127 for an if-else chain (R:docs/patterns.md#L118).
9. Reading one of 10,000 table entries by one-hot arithmetic is 30,002 operations; the index-read instruction does it in 1 (R:docs/execution-model.md#L114).
10. The comparison tests make 4,402 checks against plain JavaScript in 0.3 s (run).

---

## 10. Visual and dramatic details

- The setting is a code example, not a place. For the paper-cut theatre: a single number `a` rides a marble along a ruler marked 3, 4, 4.5, 5, 6 … 100. The ruler is the stage floor.
- Two ramps are the "house" set, hinged boards whose corners sit exactly at 4 and 5. The 4.5 marble stops halfway up the slope and the machine jams on "11". Show it honestly as the failure case, then switch on the "grid" lamp (a ruler with notches only at integers, so the marble can't stop at 4.5), and show the cascade lens-train as the no-grid alternative.
- Show the numbers on screen exactly as run: 1, 0, 1, 10 (a=5); 0, 0, 0, 12 (a=4); 0, 0, 0, 12 (a=3); 2, 1, 1, 10 (a=6); 96, 95, 1, 10 (a=100); 0.5, 0, 0.5, 11 (a=4.5).
- Compiled program as a five-tier loom: tier 1 holds ramp, 10, 12; tier 2 the bit; tier 3 the complement and bit×10; tier 4 (1−bit)×12; tier 5 the sum. That is 8 shuttles, all moving every frame.
- Sound: relays clack at each layer; no chimes (brief).

---

## 11. Sources

1. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/README.md#L3-L42 (tagline, example, caveat, matmul, demos)
2. https://github.com/chenglou/handwired (rendered README on main, fetched 2026-10-27)
3. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/README.md#L3-L9
4. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/execution-model.md#L19-L165 (instructions, compilation, declarations, one-hot, index reads, Comparisons L116-L148, grids, rounding points)
5. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/execution-model.md#L255-L290 (macro contracts, Selection, Clamping)
6. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/expressions.md#L9-L48
7. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/tutorial.md#L80-L93
8. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/patterns.md#L3-L152
9. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/numeric-ui-core.ts#L435-L443 (Circuit.select)
10. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/numeric-ui-core.ts#L1966-L2077 (emitSelect, emitCompare)
11. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/numeric-ui-core.ts#L2100-L2209 (emitGridCompare, emitIntegerBit)
12. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/numeric-ui-core.ts#L2212-L2340 (sign cascade)
13. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/tests/runtime/comparison.test.ts#L19-L575
14. Run record: `bun films/handwired-explained/research/runs/ternary.ts` and `bun films/handwired-explained/research/runs/multiway.ts` in `.orly-work/repos/handwired` (Bun 1.4.3, 2026-10-27), output pasted in 5.2, 5.3, 5.4, 5.6
15. Run record: `bun test tests/runtime/comparison.test.ts` → 15 pass, 0 fail, 4402 expect() calls (2026-10-27)
16. https://doi.org/10.1007/BF02478259 (McCulloch & Pitts 1943, framing)
17. https://link.springer.com/doi/10.1007/BF02478259 (affiliations, issue)
18. https://arxiv.org/abs/2002.05202 (Shazeer 2020, GLU variants / ReGLU name)
19. https://arxiv.org/html/2604.24356v1 (Bournez 2026, two-ReLU integer Gate, Lemma 20; corroboration)
20. https://chenglou.me/handwired/ (live demos, per README L40)
21. https://ar5iv.labs.arxiv.org/html/2002.05202 (Shazeer 2020, Eq. 5 ReGLU, verified wording)
22. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator (only the selected arm executes)
23. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/LICENSE#L3 ("Copyright (c) 2026 Cheng Lou")
24. https://pubmed.ncbi.nlm.nih.gov/2185863/ (McCulloch & Pitts 1943, reprint record)

---

## 12. Fact-check log (adversarial pass, 2026-10-27)

Method: every repo claim re-read at `257856e` in the local clone (`git log -1` confirms `257856e3b221140acb4cc4460626b850c0bd4ff1`, 2026-10-16). The fact-check was **not permitted to execute repository code** (running `bun` on the run scripts and `bun test` was blocked), so library run outputs were re-derived by tracing the source by hand (`emitCompare`, `emitGridCompare`, `emitIntegerBit`, `planSignCascade`, `emitCascadeCompare`, `Circuit.select`, `Circuit.multiply`), and the README arithmetic, the cascade plan and the FP32 threshold case were recomputed with standalone `node -e` arithmetic that imports nothing from the repo. External claims were checked on the web.

Confirmed without change (20 key claims, summarized):
- README L3, L7-L26 verbatim (local file and GitHub `main` page, fetched 2026-10-27).
- Hand table a = 5, 4, 3, 6, 100, 4.5, 4.25 (node: 1/0/1/10; 0/0/0/12; 0/0/0/12; 2/1/1/10; 96/95/1/10; 0.5/0/0.5/11; 0.25/0/0.25/11.5). `above4 = clamp(a-4, 0, 1)` holds for all real a.
- Grid path: ramp `relu(5 - a)` (gate coefficient -1, bias 5) and bit `relu(1 - ramp)`, 2 ops / 2 layers; full ternary 8 live / 5 layers (traced: ramp, 10, 12 at depth 1; bit 2; complement and bit×10 at 3; (1-bit)×12 at 4; sum at 5). Built ops 9.
- No-grid cascade: plan [2^14, 2^24 ×5, 2^15] for bound 1004 (product 2^149); 1 + 3 + 5×2 + 2 = 16 ops, 15 layers; with select 22 / 18; at 4.5 the cascade gives bit 1. Matches docs table R:docs/execution-model.md#L134.
- endWithBoolean on grid: one atom, score 0.5 + (a-5)·2^-24 (bias f(0.5 - 5·2^-24) = 0.49999970, coefficient 5.96e-8), rounding `f(f(f(score) + 8_388_609) - 8_388_609)` (R:docs/execution-model.md#L24). No-grid + atom: plan [14, 24, 24, 24, 18] gives 15 ops / 13 layers.
- False-grid behaviour: test pins `toBe(0.5)` at 4.5 (R:tests/runtime/comparison.test.ts#L563); the `validateGrids` message template is `wire ${wire} must be a multiple of ${grid}, got ${value}` (R:src/runtime/numeric-ui-core.ts#L3258).
- Four instruction kinds, "can't stop early", select cost "4 in 3 layers", `off + gate × (on - off)` hazard, `0 × Infinity` NaN, gather "only shortens the read", `emitFirstActive` 316/31 vs 127/127 and `emitArgmax` 437/33, "No tool converts existing JavaScript source into a program". All verbatim at the cited lines.
- Else-if 15 live / 7 layers and one-hot 13 / 5, 10 / 4 with gathers: traced by hand from multiway.ts and the gather rules (R:docs/execution-model.md#L42, #L72).
- McCulloch & Pitts, Bull. Math. Biophysics 5(4):115-133, issue date December 1943, DOI 10.1007/BF02478259; abstract opens "Because of the 'all-or-none' character of nervous activity…" (https://link.springer.com/doi/10.1007/BF02478259 ; https://pubmed.ncbi.nlm.nih.gov/2185863/).
- Shazeer, arXiv 2002.05202, submitted 12 Feb 2020 (https://arxiv.org/abs/2002.05202).

Changes made:
1. **Corrected (threshold rounding scope).** "A non-FP32 threshold such as 5/24 must be pre-rounded up" was stated as general (sections 5.4 and misconception 6). The docs scope the rule to `x >= t` (R:docs/expressions.md#L9). For `x > t` rounding up gives the wrong bit at x = the rounded-up value (node check). Both passages rewritten; L118's unscoped wording flagged.
2. **Corrected (grid condition).** "Integer bits apply when the operand is declared on a grid" now reads "when both operands lie on grids within 2^24 grid steps", with a note that a constant threshold gets a grid automatically (R:docs/execution-model.md#L123; R:src/runtime/numeric-ui-core.ts#L2083-L2091, #L2109).
3. **Corrected (cascade stage labels).** The ×2^15 stage is not a clamp. It is the final `relu(1 - 2^15·stage)` followed by the bit flip (R:src/runtime/numeric-ui-core.ts#L2337-L2352). Fixed in 5.3(B) and in the art-department lens train (5.8), which had "each followed by a stop at height 1".
4. **Corrected (unreliable observation).** Removed the claim that GitHub's rendered page uses `js` fences. That came from a WebFetch summarizer and isn't checkable from rendered HTML. The pinned file uses `ts`.
5. **Tightened (HandwiredOS).** The ±65,536 px case is specifically "each title bar's right edge distance" on its 1/128 px grid; quoted verbatim (R:docs/execution-model.md#L147).
6. **Upgraded (quote).** The ReGLU equation wording is now verified verbatim from ar5iv, Eq. 5: "ReGLU(x,W,V,b,c) = max(0,xW+b) ⊗ (xV+c)" (https://ar5iv.labs.arxiv.org/html/2002.05202). Added as quote 14 (external, framing only). The timeline row now says the repo does not cite the paper, so this is a naming parallel, not lineage.
7. **Verified and specified (corroboration paper).** arXiv 2604.24356 is Olivier Bournez, "Primitive Recursion without Composition…", submitted 27 April 2026. Its Gate is "Gate(t):=ReLU(t)−ReLU(t−1)" (Section 6, Lemma 20), exact on integers (https://arxiv.org/html/2604.24356v1). Citation and quotes added.
8. **Marked unsourced (belief of the age).** "ReLUs approximate decisions softly, so exact logic needs control flow" has no attributable holder. It is now labeled unsourced framing. The JS one-arm semantics are now sourced to MDN.
9. **Marked unverifiable in this pass (test run).** 15 `test()` blocks confirmed statically. "15 pass, 0 fail, 4402 expect() calls, 306 ms" was not re-run (execution blocked) and rests on the original run only. Re-run before showing 4,402 on screen.
10. **Line-reference fixes.** patterns.md L77-L82 → L80-L81. numeric-ui-core.ts L2011-L2012 → L2009-L2012. Port-history lines L2093-L2097 → L2094-L2097, L2219-L2220, L2255-L2256. Added an author source (R:LICENSE#L3).

Note on the run outputs pasted in 5.2, 5.3, 5.6: they agree with the hand trace in every op count, layer count and value. They were not regenerated by the fact-check.
