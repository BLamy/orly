# Dossier: The Primitives — FP32 Weighted Sums, ReLU/ReGLU, Booleans, One-Hot Groups and indexRead

- Topic id: `primitives-instruction-set`
- Era: the repo at `chenglou/handwired@257856e` (commit `257856e3b221140acb4cc4460626b850c0bd4ff1`, 2026-10-16 17:33 -0700; 825 commits on `main`)
- As of: 2026-10-27
- Researcher method: read the pinned files in the local clone `.orly-work/repos/handwired`. The public pinned page loads at https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md (checked by fetch 2026-10-27). I checked the FP32 arithmetic with my own standalone script (`Math.fround` only, no repo code). Its output is quoted in section 5 as "[researcher script]". Running the repo's own `bun test` was **not permitted** in this session (the sandbox denied it), so test outcomes are cited from the test source (what the assertions demand), **not** from a run. A later stage should run `bun test tests/runtime/index-read.test.ts tests/runtime/gather-lowering.test.ts` in the clone before the film puts a test result on screen.
- Source notation: `R:path#Lx-Ly` means `https://github.com/chenglou/handwired/blob/257856e/path#Lx-Ly`. Every R: link is listed in full in section 11.

---

## 1. Summary

Every Handwired program is an ordered list of **instructions** that append one FP32 number each after a fixed `Float32Array` of **source cells**. A **wire** is the position of a source cell or of an instruction's output (R:docs/execution-model.md#L3-L5). There are exactly **four instruction kinds** in the runtime type `AtomKind = 'affine' | 'reglu' | 'boolean' | 'index'` (R:src/runtime/numeric-ui-core.ts#L30-L31). The file's own header calls them "Three runtime atoms and one index read instruction, plus compile-time expansions that lower into those" (R:src/runtime/numeric-ui-core.ts#L1-L2).

The four instructions, as the docs give them (R:docs/execution-model.md#L21-L26):

```txt
affine(left)      = left
reglu(left, gate) = f(left * max(0, gate))
boolean(score)   = f(f(f(score) + 8_388_609) - 8_388_609)
index(form, candidates, below, above) = values[candidates[floor(form)]], with a rule outside the table
```

Here `f(x)` is `Math.fround(x)`. `left`, `gate` and `form` are affine forms: a bias plus a sum of wires times coefficients.

- **The true primitives** are `affine` (the weighted sum, i.e. the matmul row) and `reglu` (a product of an affine form with the ReLU of another). These are what the README calls "matrix multiplication + reglu over floats" and "these 2 primitives" (R:README.md#L7, #L28).
- **The boolean atom** is a one-instruction FP32 rounding shortcut. The docs say it is "a one-operation shortcut for this construction, not a necessity" (R:docs/expressions.md#L33).
- **The index read** (added to the runtime in the 2026-09-15 commit `17c2318`) is a copy, not arithmetic: one instruction reads `candidates[floor(index)]` at any table size.
- **Everything else is a macro**, a builder function that expands into those instructions while the program is built: `emitRelu`, `emitMultiply`/`circuit.multiply`, `emitSelect`/`circuit.select`, `emitMinimum`, `emitMaximum`, `emitCompare`, `emitMinimumExact`, `emitMaximumExact`, `emitClampExact`, `emitArgmax`, `emitFirstActive`, springs (R:docs/execution-model.md#L30, #L34; R:lab/ui-exploration/guide/sections/model.md#L273-L275).

Logic is arithmetic on exact 0/1 bits: NOT is `1 - bit`, AND of N bits is `relu(sum - (N - 1))`, and OR is `1 - relu(1 - sum)` (R:docs/expressions.md#L10). A ternary is `condition × on + (1 - condition) × off`, so **both branches always run** (R:docs/expressions.md#L11).

- **min and max** are `a - relu(a - b)` and `b + relu(a - b)`. They are exact only for integers below 2^23, and fractions drift.
- **The clamp to 0..1** is `relu(v) - relu(v - 1)`.
- **The exact min, max and clamp** compare first, then select (R:docs/execution-model.md#L259-L268).

**Declarations** are promises the builder trusts and the tests check: `assumeRange`, `assumeGrid` (a power-of-two step), `assumeOneHot` and `assumeBit`. They let the builder pick cheap, exact constructions. For example, a comparison on a grid is 2 operations instead of 15 (R:docs/execution-model.md#L52-L64). That figure is for `>=`; `>` is 2 against 16 and `===` is 3 against 28, see 5.4 [FC4].

**One-hot groups** let the compiler lower a masked sum `Σ selected[j] × value[j]` to a single **gather**. A runtime-integer **index read** replaces a 10,000-entry one-hot construction: 30,002 live operations and 49,998 stored weights become 1 operation and 1 stored weight (R:docs/execution-model.md#L114).

---

## 2. Timeline (dated, sourced)

| Date | Event | Source |
|---|---|---|
| Dec 1943 | McCulloch & Pitts, "A logical calculus of the ideas immanent in nervous activity", *Bull. Math. Biophysics* 5:115–133. All-or-none neurons treated with propositional logic. This is the old idea that neurons compute logic. **Brief framing only**: Handwired never cites it. | https://doi.org/10.1007/BF02478259 ; https://en.wikipedia.org/wiki/A_Logical_Calculus_of_the_Ideas_Immanent_in_Nervous_Activity |
| Jun 2010 | Nair & Hinton, "Rectified Linear Units Improve Restricted Boltzmann Machines", ICML 2010 (Haifa), pp. 807–814. A landmark paper for ReLU in deep learning. Framing only. | https://mlanthology.org/icml/2010/nair2010icml-rectified/ |
| 23 Dec 2016 | Dauphin, Fan, Auli, Grangier, "Language Modeling with Gated Convolutional Networks" (arXiv 1612.08083) introduces the gated linear unit (GLU). | https://arxiv.org/abs/1612.08083 |
| 12 Feb 2020 | Shazeer, "GLU Variants Improve Transformer" (arXiv 2002.05202) defines `ReGLU(x,W,V,b,c) = max(0,xW+b) ⊗ (xV+c)`. Handwired's `reglu` has the same shape, a product of a ReLU'd affine form and another affine form. **The repo never cites Shazeer or GLU** (a repo-wide grep for "Shazeer", "gated linear", "SwiGLU" and "2002.05202" returns nothing), so the film must not claim a lineage. | https://arxiv.org/abs/2002.05202 ; https://arxiv.org/html/2002.05202 |
| 12 Jan 2023 | Lindner et al., "Tracr: Compiled Transformers as a Laboratory for Interpretability" (arXiv 2301.05062; NeurIPS 2023 spotlight) compiles human-readable programs into transformer weights. This is the "modern work compiling programs into networks" context. | https://arxiv.org/abs/2301.05062 |
| 2026-06-03 | First commit of Handwired, `3d2c717` "Create numeric UI atom lab" (Cheng Lou). `reglu(` already appears in it. | `git log --reverse` in the clone; https://github.com/chenglou/handwired/commit/3d2c717 |
| 2026-06-07 | `fd8f0a3` "Add exact boolean state decisions": the first commit containing the `8_388_609` boolean atom. | `git log -S'8_388_609'`; https://github.com/chenglou/handwired/commit/fd8f0a3 |
| 2026-07-08 | `a137ccd` "Land lab round one: four verified experiments, two demos, gather lowering": `assumeOneHot` and gather lowering arrive. | `git log -S'assumeOneHot'`; https://github.com/chenglou/handwired/commit/a137ccd |
| 2026-09-14/15 | The index read instruction and `emitCompare`. The guide says "Since September 14, 2026, numeric-ui-core.ts also has an instruction that reads a table at a computed position". The commit that brought them to `main` is `17c2318` (2026-09-15), "Add the UI exploration lab, index reads, exact comparisons and host-timed springs". The repo doesn't explain the one-day gap. `17c2318` is a single commit with one parent, not a merge, and its author and commit dates are both 2026-09-15 08:47 -0700. The earlier note that the gap was "a lab date versus a merge date" was the researcher's guess and is **UNVERIFIED**. Say "mid-September 2026". [Fact-check FC5] | R:lab/ui-exploration/guide/sections/model.md#L264 ; https://github.com/chenglou/handwired/commit/17c2318 |
| 2026-09-17 | `bf719fa` moves the runtime into `src/runtime/` and the tests into `tests/` (the current paths). | `git log` in the clone |
| 2026-10-13 | HandwiredOS's window stack drops to 3 windows, and its frontmost-window selection sums stop lowering to gathers ("With four windows, until October 13, 2026, they lowered to 12 gather reads"). | R:tests/runtime/gather-lowering.test.ts#L1220-L1242 |
| 2026-10-16 | The pinned commit `257856e`. | `git log -1` |

---

## 3. People

**Cheng Lou (`chenglou`)**: the author of every commit inspected (`git log`). The README presents him only as the author of the repo and of the live demos at https://chenglou.me/handwired/.

- **What the repo says he believes** (README, verbatim, see section 6): programs can be expressed as "matrix multiplication + reglu over floats". Using only two primitives keeps the program differentiable, the weights need no training, and GPU techniques "have a great time optimizing such minimal primitives".
- **Depiction:** the brief forbids invented biography, so there is no verified physical description in the sources. Use a **generic, non-likeness silhouette**: a programmer at a desk or bench, era-neutral contemporary clothing, no distinguishing features. Don't name him on a silhouette that implies a likeness.

**Framing-only figures** (only if the story uses the 1943 / GLU framing; one line each at most):

- **Warren S. McCulloch and Walter Pitts.** The publisher's record for the 1943 article (Springer, doi 10.1007/BF02478259) gives two affiliations: "College of Medicine, Department of Psychiatry at the Illinois Neuropsychiatric Institute, University of Illinois" and "The University of Chicago, Chicago". The earlier "1990 reprint" attribution wasn't checked, so cite the Springer record instead. [FC7] They held that because nervous activity is "all-or-none", neural events can be treated with propositional logic. In widely circulated photographs McCulloch has a full beard and Pitts is a young man. That comes from Wikipedia images and is low confidence for art. Prefer a generic 1940s lab silhouette (suit, tie) to a likeness. Source: https://en.wikipedia.org/wiki/A_Logical_Calculus_of_the_Ideas_Immanent_in_Nervous_Activity
- **Noam Shazeer** (Google, 2020 paper): proposed GLU variants, including ReGLU, for Transformer feed-forward layers. No depiction recommended.

---

## 4. The belief of the age

There are two "beliefs" here, and the film should keep them apart.

1. **The field's working belief** (2010s–2026): neural networks are trained, not written. Their weights come from gradient descent, and ReLU and gated variants (GLU, ReGLU, SwiGLU) won because they train well empirically. Shazeer said plainly that nobody quite knew why: "We offer no explanation as to why these architectures seem to work; we attribute their success, as all else, to divine benevolence." (https://arxiv.org/html/2002.05202, the closing sentence of the Conclusions.) Compiled networks (Tracr, 2023) were mainly built as interpretability testbeds, "models with known structure" (https://arxiv.org/abs/2301.05062).
2. **Handwired's counter-claim** (2026): the same two building blocks, a weighted sum and a ReLU-gated product, can be **written by hand** to reproduce ordinary JavaScript UI code **exactly**, at the level of FP32 bits, "no training, exact, yet also fully differentiable" (R:README.md#L3).
   - Handwired's own qualification: exactness is "equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic" (R:docs/execution-model.md#L257).
   - Exactness also depends on declarations that are promises, not proofs (R:docs/execution-model.md#L60).

"Dissent" inside the repo is honest self-limitation, not a rival camp:

- `emitMinimum`/`emitMaximum` drift on fractions.
- The boolean atom only works in FP32 and blocks plain backprop.
- Division, square root and sine are **not exact** (relative error ~2.5e-7), and they live in a lab library, not the runtime (R:docs/expressions.md#L16-L17).

---

## 5. Experiments and results (numbers the film may show)

The "apparatus" is software. Art-department metaphors are listed in section 10 and must stay faithful to these mechanics.

### 5.1 FP32 accumulation, the ground rule

```txt
value = f(bias)
for (wire, coefficient) in terms:
  value = f(value + f(f(coefficient) * values[wire]))
```

R:docs/execution-model.md#L9-L15; implemented in `evaluateTerms` (R:src/runtime/numeric-ui-core.ts#L1888-L1900).

- Term order matters. Ordinary builder sums sort by ascending wire, while `roundAffine` keeps the caller's order and is never copied into readers (R:docs/execution-model.md#L17, #L32).
- FP32 holds every integer exactly only up to 2^24 = 16,777,216 (R:docs/expressions.md#L41).

### 5.2 Instruction kinds in `numeric-ui-core.ts` (exact names and lines)

| Item | Line(s) |
|---|---|
| Header comment "Three runtime atoms and one index read instruction, plus compile-time expansions that lower into those." | L1–2 |
| `type AtomKind = 'affine' \| 'reglu' \| 'boolean' \| 'index'`, with the comment "'index' is the index read instruction, built only by indexReadAffine." | L30–31 |
| `type Macro = {kind: 'multiply', left, right} \| {kind: 'select', gate, off, on}`: the macro records, which are **not** instructions | L33–35 |
| `type OutOfRange = 'clamp' \| 'zero'` | L39 |
| `type RoundingPointKind = 'boolean' \| 'integer bit' \| 'sign cascade' \| 'marked'` | L92 |
| `type Operation {kind, leftTerms, leftBias, gateTerms, gateBias, depth, preserveRounding?, macro?, indexRead?, roundingPoint?, comparisonBit?}` | L94–111 |
| `const indexMagnitudeLimit = 2 ** 24` | L235 |
| `class Circuit` | L237 |
| `assumeRange` L286, `assumeOneHot` L324, `assumeGrid` L347, `assumeBit` L368, `markRoundingPoint` L376, `roundingPoints()` L385 | — |
| `source` L399, `constant` L406, `affine` L410, `roundAffine` L418, `multiply` L422, `select` L435, `reglu` L445, `boolean` L449, `indexRead` L467, `indexReadAffine` L480, `append` L557 | — |
| `evaluateReference` L649 → `evaluateOperationStream` L1673; the reglu evaluation `Math.fround(value * Math.max(0, gate))` at L1683–1689 | — |
| `resolveIndexPosition` L1844, `readIndexedValue` L1859, `evaluateTerms` L1888, `evaluateBoolean` L1914 (`const base = 8_388_609` at L1916, with the comment "the odd base makes 0.5 round up") | — |
| `emitRelu` L1934 (`circuit.reglu([], 1, [[value, 1]], 0)`), `emitMultiply` L1938, `emitMaximum` L1942, `emitMinimum` L1955, `emitSelect` L1966, `emitCompare` L2017, `emitMinimumExact` L2370, `emitMaximumExact` L2385, `emitClampExact` L2401, `emitSelectOperand` L2410, `emitArgmax` L2710, `emitFirstActive` L2781 | — |
| `validateOneHotGroups` L3194, `validateIndexReads` L3221, `validateGrids` L3247, `validateNoNaN` L3273 | — |

How the macros lower (R:src/runtime/numeric-ui-core.ts#L422-L447):

- `multiply(a, b)` becomes one `reglu` when an operand is declared nonnegative. That operand goes in the gate, where `max(0, b)` is just `b`. Otherwise it becomes `a × relu(b) − a × relu(−b)`: 3 operations in 2 layers.
- `select(gate, off, on)` becomes `roundAffine(1 − gate)`, two `multiply` products and one affine sum.
- The docs' exact words are "the program itself still contains only the four instructions above", which describes the built program and not only the compiled one. [FC10] The `macro` record exists for backprop, for rounding preservation and for gather recognition (R:docs/execution-model.md#L34).

### 5.3 Gated ReLU / ReGLU, and why two primitives suffice

- Definition: `circuit.reglu(leftTerms, leftBias, gateTerms, gateBias)` appends `(leftTerms + leftBias) × max(0, gateTerms + gateBias)`, so `circuit.reglu([], 1, terms, bias)` is a plain ReLU (R:docs/tutorial.md#L74).
- The docs say "a ReGLU, which is a ReLU of `gate` when `left` is the constant 1" (R:docs/execution-model.md#L28).
- Why it's enough, from the guide (R:lab/ui-exploration/guide/sections/model.md#L244-L252): "Two uses cover almost everything." One is a lone ReLU (left = 1). The other is a product of two runtime values, with a nonnegative operand in the gate. "Multiplying a value by a bit keeps the value or zeroes it, and every conditional in a program is built from such products."
- Affine sums carry every constant for free: "Any number known while building ... becomes a coefficient or a bias, which is free at runtime" (model.md#L240).

### 5.4 Booleans and decision bits (R:docs/expressions.md#L10, #L25-L37)

- NOT is `1 − bit`. AND of N bits is `relu(sum − (N − 1))`, and OR is `1 − relu(1 − sum)`, "or just the sum when at most one of the bits can be 1". Exact when every operand is an exact bit. In code: `const all = ... circuit.reglu([], 1, bits..., 1 - bits.length)` and `const not = ... circuit.affine([[bit, -1]], 1)` (R:docs/tutorial.md#L80-L82).
- Truth table [researcher script]:

  | a, b | AND | OR | NOT a |
  |---|---|---|---|
  | 0, 0 | 0 | 0 | 1 |
  | 0, 1 | 0 | 1 | 1 |
  | 1, 0 | 0 | 1 | 0 |
  | 1, 1 | 1 | 1 | 0 |

- "A score isn't automatically a decision." For example, a score of 0.3 stored as `open` "would give a partly maximized window". Make the bit exact at the moment a score becomes a decision, and keep positions, sizes, opacity and springs at full precision (expressions.md#L27).
- Three bit-making forms, cheapest first:
  1. **Integer bits.** `relu(score) − relu(score − 1)` for an integer score. On a grid, `a ≥ b` is `relu(1 − relu(−D))` with `D = (a − b)/grid`, `a > b` is `relu(1 − relu(1 − D))`, and `a === b` is `relu(1 − relu(D) − relu(−D))` (execution-model.md#L123).
     - [researcher script] For D = −2..2: `>=` → 0,0,1,1,1; `>` → 0,0,0,1,1; `===` → 0,0,1,0,0.
  2. **The boolean atom.** `f(f(score + 8,388,609) − 8,388,609)`, with 8,388,609 = 2^23 + 1. Between 2^23 and 2^24, FP32 values are whole numbers 1 apart. A tie at 0.5 rounds to even, which is the upper neighbour because 8,388,609 is odd. So 0.5 gives 1 (model.md#L256).
     - [researcher script] 0 → 0, 0.25 → 0, 0.49999997 → 0, 0.5 → 1, 0.75 → 1, 1 → 1.
     - The builder throws if the score's range isn't inside 0..1 (R:src/runtime/numeric-ui-core.ts#L449-L453).
     - `backpropagateReference` throws on the atom unless `{booleanGradient: 'straight-through'}` (execution-model.md#L36).
  3. **The sign cascade.** Keep `d = f(a − b)`, then alternate power-of-two scaling and clamping until every nonzero d down to 2^−149 reaches at least 1. For operands within 0..16,384 the scales are 2^10, 2^24 ×5, 2^19, and "any finite bound needs at most 12 stages" (execution-model.md#L124).
- Comparison costs for operands within 0..16,384, or within ±8,192 on a 1/64 grid, which is the docs' own heading (execution-model.md#L130-L137). [FC4]
  - The well-known "2 operations instead of 15" (#L54) holds for `>=` only. For `>` it is 2 against 16, and for `===` it is 3 against 28.
  - The grid rows need both operands on grids, with every partial sum within 2^24 grid steps.

  | Construction | `>` | `>=` | `===` |
  |---|---|---|---|
  | sign cascade | 16 ops / 15 layers | 15 / 14 | 28 / 14 |
  | integer bits on a 1/64 grid | 2 / 2 | 2 / 2 | 3 / 2 |
  | one atom on a grid | 1 / 1 | 1 / 1 | 3 / 2 |

- The README example, done by hand [researcher script, matches README#L9-L22]: `above4 = max(0, a−4) − max(0, a−5)`, then `result = above4 × 10 + (1 − above4) × 12`.

  | a | above4 | result |
  |---|---|---|
  | 3 | 0 | 12 |
  | 4 | 0 | 12 |
  | 5 | 1 | 10 |
  | 7 | 1 | 10 |

### 5.5 Macro contracts: select, min, max, clamp (R:docs/execution-model.md#L255-L290)

**Exact formulas, as relu arithmetic:**

| Macro | Formula | Contract | Cost |
|---|---|---|---|
| `emitSelect(gate, off, on)` | `gate × on + (1 − gate) × off` | Exact at a gate of exactly 0 or 1, for finite operands at any magnitude | 4 ops in 3 layers (with a 0..1 gate range) |
| `emitMultiply(a, b)` | one ReGLU, or `a × relu(b) − a × relu(−b)` | equals `f(f(a) × f(b))` | — |
| `emitMaximum(a, b)` | `b + relu(a − b)` | integers below 2^23 | 3 ops / 3 layers |
| `emitMinimum(a, b)` | `a − relu(a − b)` | integers below 2^23 | 3 ops / 3 layers |
| clamp to 0..1 | `relu(v) − relu(v − 1)` | `v ≤ 2^24` if v is its own operation | 3 ops / 2 layers (model.md) |
| abs | `relu(x) + relu(−x)` | (expressions.md#L12) | — |
| `emitMinimumExact` / `emitMaximumExact` / `emitClampExact` | comparison bit, then `on × relu(bit) + off × relu(1 − bit)` (`emitSelectOperand`, R:src/runtime/numeric-ui-core.ts#L2405-L2423) | returns exactly one operand; ties return the first | `emitMinimumExact`: 18 ops / 16 layers within 0..16,384, or 5 / 4 on a 1/64 grid |
| clamp between runtime bounds | `emitClampExact = emitMinimumExact(emitMaximumExact(value, min), max)` (L2401-L2403) | — | the non-exact `Math.min(Math.max(windowLeft, 0), maxLeft)` is 7 ops in 7 layers |

**Failure values:**

- **Why not lerp?** `off + gate × (on − off)` "can lose a small selected value, or overflow `on − off` even when both candidates are finite" (execution-model.md#L276).
  - [researcher script] At gate 1, on = 1e−8, off = 1e8: lerp → 0, select → 1e−8.
  - [researcher script] At gate 1, on = 3e38, off = −3e38: lerp → Infinity, select → 3e38.
- **Unselected Infinity.** `0 × Infinity = NaN` still poisons a select (expressions.md#L11).
- **Drift and wrap** [researcher script confirms each doc value]:
  - `emitMinimum(f(1000.37), f(0.3))` → 0.29998779296875 (f(0.3) = 0.30000001192092896).
  - `emitMaximum(2^24, −1)` → 16,777,215, and the minimum → 0.
  - clamp01(2^24 + 2) → 2, and clamp01(2^25) → 0.
  - For `v = x − 0.5` copied into both ReLUs at `x = 2^23 + 1`, the clamp returns 0.5 (execution-model.md#L282, #L288-L290).

### 5.6 Declarations and grids (R:docs/execution-model.md#L52-L64, #L149-L153)

- `assumeRange(wire, min, max)`, `assumeGrid(wire, step)` (a power of two, e.g. 1/64 px for pointer coordinates), `assumeOneHot(members[, allowAllZero])` and `assumeBit(wire)`.
- The usual route is `cells.ts`. The source table declares each cell once, e.g. `viewportWidth: input([0, 16_384], {grid: 1})` or `on: stateBit()`. The cell functions are `constant`, `input`, `state` and `event` (plus `inputBit` and `stateBit`), and `list`, `oneHot` and `permutation` declare groups. `table.createCircuit()` makes the assume calls "before any operation exists".
- "Declarations are promises from the caller, not proofs." For example, "a false grid turns an integer bit into a fraction". Tests check them with `validateGrids`, `validateIndexReads` and `validateOneHotGroups`.
- A declaration after a reader exists throws, unless `{allowExistingReaders: true}`.
- Inferred grids: each term contributes its wire's grid times the largest power of two dividing its coefficient. For example, `0.5 × pointerX` lies on a 1/128 grid, while `pointerX / 3` has no grid. Boolean atoms and comparison bits have grid 1. Index reads and `circuit.constant(0)` get no grid.
- Gotcha: `roundAffine([[constant(0),1],[count,1]])` compared with 3 builds a 15-operation sign cascade, but starting from `count` builds a 2-operation integer bit. The repo's advice: "start a running total from its first item rather than from `circuit.constant(0)`".

### 5.7 One-hot groups and gathers (R:docs/execution-model.md#L66-L76)

- A masked sum covering each group member exactly once becomes one gather when every candidate has finite FP32 bounds. The executor resolves the index `Σ j × member[j]` once.
- A sum stays dense when it has any other term, a scaled term, a missing member, or products from two groups.
- **Corrected [FC3]:** fewer than 4 members does **not** keep a sum dense on its own terms. The docs say "with 3 members, a masked sum requested as an output lowers to one gather" (#L72). A small sum stays dense only when another operation reads it, because the builder copies its fewer-than-4 terms into that reader, e.g. `2 × sum + offset` keeps the 3 products live. HandwiredOS's frontmost-window sums are read this way, which is why they stay dense (gather-lowering.test.ts#L1224-L1229).
- "Gather lowering only shortens the read after a selection exists: the selection and every candidate are still computed."
- `gather-lowering.test.ts` assertions (read from the source, not run):
  - **"a one-hot-masked sum lowers to one gather and drops its products"** (L136–158). With 8 slots, the dense form stores `3 × slotCount` weights. Lowered, it stores 0 weights, and `valueCount = sourceSize + 1`.
  - **"stored weights per read drop from 3N to zero under lowering"** (L809–840), for N = 64 and 256 and 1 or 4 reads.
  - **HandwiredOS** (L1220–1242): 6 one-hot groups (3 stack rows and 3 stack columns, via `permutation`), and **0 gather reads**. A sum over a group of 3 has 3 terms, and the builder copies them into each operation that reads the sum, so the frontmost-window selection sums stay dense. "With four windows, until October 13, 2026, they lowered to 12 gather reads."
  - Other tests: "a violated one-hot contract diverges and validation catches it" (L699), "extreme candidates gather bit-for-bit" (L735), "a result that is exactly zero may carry the other sign of zero" (L593).
- Who declares groups: `emitArgmax` always does. `emitFirstActive` does only over proven bits (execution-model.md#L68).

### 5.8 Index reads (R:docs/execution-model.md#L78-L114; tests/runtime/index-read.test.ts)

```txt
index = f(form)
position = floor(index)          in float64, so nothing rounds
read = values[candidates[position]]          0 <= position <= count-1
     = values[candidates[0]] or +0           position < 0  (below rule)
     = values[candidates[count-1]] or +0     position > count-1 (above rule)
     = NaN                                   NaN index
```

**Contract:**

- The declared index range must be strictly inside ±2^24, and the builder refuses an endpoint that FP32 rounds onto 2^24 (f(2^24 + 1) = 2^24 [researcher script]).
- The index must hold an integer, which `validateIndexReads` checks. For example, `scrollTop / 28` fails at 14.
- The copied value isn't rounded, so −0, ±Infinity and NaN pass through.
- The candidates array is frozen, and identical arrays share one table.

**Cost:** 1 operation at any table size. Evenly spaced tables are stored as base + stride. "Over 10,000 entries, a ReLU one-hot masked sum compiles to 30,002 live operations and 49,998 stored weights with gather lowering, while the index read compiles to 1 operation and 1 stored weight" (#L114).

**Three ways it differs from the masked sum** (execution-model.md#L104-L108, tested in index-read.test.ts):

1. **"fractional indices: the read floors, while the ReLU one-hot interpolates"** (L309–326). At index 2.5 over `[28, 44, 28, 60]` the read returns 28 and the masked sum returns **44**.
   - [researcher script] The ≥-bits are [1, 1, 1, 0.5], the one-hot is [0, 0, 0.5, 0.5], and the masked sum is 0.5×28 + 0.5×60 = 44.
   - So the 44 is **not** entry [1]. It is the average of entries 2 and 3, and the match with entry [1] is a coincidence. Good for screen; be careful how it's narrated.
   - [FC9] The 4-entry table comes from the docs (#L106). The test itself uses the 8-entry `[28, 44, 28, 60, 36, 28, 52, 40]` and also checks indices 2.25, 0.5 and 6.75 (index-read.test.ts#L309-L326). The 2.5 → 44 result is the same either way.
2. **"infinite candidates: the read returns the selected value; the masked sum turns into NaN and stays dense"** (L293–307).
   - **Corrected [FC2]:** the NaN comes from an **unselected** infinite candidate (`0 × Infinity`).
   - When Infinity is the selected candidate and every other candidate is finite, the masked sum also returns Infinity: the test asserts it, with the comment "A selected infinity survives the masked sum when every other candidate is finite" (L305-L306).
   - So don't say "the masked sum turns a selected Infinity into NaN".
3. **"signed zero: a selected -0 comes through the read, while the masked sum returns +0"** (L282–291).

**Gradients** (execution-model.md#L112):

- The selected candidate gets the output gradient.
- The index gets nothing by default: `backpropagateReference` throws.
- `{indexGradient: 'zero'}` gives the index no gradient.
- `{indexGradient: 'backward-difference'}` gives `read(i) − read(i−1)`.

The composed form is `condition ? table[i] : 0` = one read at `row + count × (1 − isOpen)` with the `'zero'` rule (expressions.md#L19).

### 5.9 Program sizes (for scale)

- HandwiredOS: 5,028 built operations for 4,646 live ones (execution-model.md#L46).
- Rounding points: 59 boolean atoms, 707 integer-bit operations and 33 marked operations (#L164).

---

## 6. Verified quotes

| # | Quote (verbatim) | Speaker / source | Date | URL | Context |
|---|---|---|---|---|---|
| Q1 | "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" | Cheng Lou, README tagline | at 257856e (2026-10-16) | R:README.md#L3 (also verified on https://github.com/chenglou/handwired) | Opening line |
| Q2 | "A program's made of if-else, loops, and state. Handwired transforms them into matrix multiplication + reglu over floats." | README | same | R:README.md#L7 | How It Works |
| Q3 | "// Both branches compute, and above4 picks one" | README code comment | same | R:README.md#L20 | `(a > 4) ? 10 : 12` example |
| Q4 | "You can calculate that by hand and see that both arrive at the same result." | README | same | R:README.md#L24 | after the example |
| Q5 | "We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun." | README | same | R:README.md#L26 | — |
| Q6 | "Because we basically only use these 2 primitives:" | README | same | R:README.md#L28 | followed by: differentiable; no training; GPU techniques "have a great time optimizing such minimal primitives" |
| Q7 | "Three runtime atoms and one index read instruction, plus compile-time expansions that lower into those." | numeric-ui-core.ts header comment | same | R:src/runtime/numeric-ui-core.ts#L1-L2 | file header |
| Q8 | "A score isn't automatically a decision." | docs/expressions.md | same | R:docs/expressions.md#L27 | Decision bits |
| Q9 | "The boolean atom is a one-operation shortcut for this construction, not a necessity." | docs/expressions.md | same | R:docs/expressions.md#L33 | Sign cascade |
| Q10 | "Declarations are promises from the caller, not proofs." | docs/execution-model.md | same | R:docs/execution-model.md#L60 | Declarations |
| Q11 | "Gather lowering only shortens the read after a selection exists: the selection and every candidate are still computed." | docs/execution-model.md | same | R:docs/execution-model.md#L76 | One-hot groups |
| Q12 | "Multiplying a value by a bit keeps the value or zeroes it, and every conditional in a program is built from such products." | lab guide model.md | same | R:lab/ui-exploration/guide/sections/model.md#L252 | ReLU-gated products |
| Q13 | "Two uses cover almost everything." | lab guide model.md | same | R:lab/ui-exploration/guide/sections/model.md#L246 | reglu's two uses |
| Q14 | "Exactness means equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic." | docs/execution-model.md | same | R:docs/execution-model.md#L257 | Macro contracts |
| Q15 | "ReGLU(x,W,V,b,c) = max(0,xW+b) ⊗ (xV+c)" (an equation, not speech) | Noam Shazeer, "GLU Variants Improve Transformer" | 12 Feb 2020 | https://arxiv.org/html/2002.05202 | Section 2 definition |
| Q16 | "We offer no explanation as to why these architectures seem to work; we attribute their success, as all else, to divine benevolence." | Noam Shazeer | 12 Feb 2020 | https://arxiv.org/html/2002.05202 | The Conclusions' last sentence. The fact-check fetched the raw arXiv HTML and confirmed the whole sentence character for character. |
| Q17 | "Our compiler, Tracr, generates models with known structure." | Lindner et al. | 12 Jan 2023 | https://arxiv.org/abs/2301.05062 | abstract |
| Q18 | "all-or-none" (fragment) | McCulloch & Pitts 1943, abstract | Dec 1943 | https://en.wikipedia.org/wiki/A_Logical_Calculus_of_the_Ideas_Immanent_in_Nervous_Activity ; https://doi.org/10.1007/BF02478259 | **Verified by fact-check [FC6]:** the abstract's full first sentence on the publisher's page, https://link.springer.com/article/10.1007/BF02478259, reads "Because of the “all-or-none” character of nervous activity, neural events and the relations among them can be treated by means of propositional logic." It may be quoted, with Springer as the source. |

---

## 7. Debates and controversies

1. **"2 primitives" vs "four instructions".**
   - The README says "these 2 primitives" (matmul + reglu). The core says three atoms plus an index read, and execution-model lists four instructions.
   - Reconciliation, all from sources:
     - `affine` is the matmul.
     - `reglu` is the nonlinearity.
     - The boolean atom is an optional FP32 shortcut that integer bits and the sign cascade can replace (Q9).
     - The index read is a copy that a ReLU one-hot masked sum can replace for integer indices (#L104). It was a September 2026 addition for cost.
   - Both framings are true at different levels. The film should present the README's two as the conceptual core and the four as the shipping instruction set.
2. **Exact vs approximate.**
   - Exactness is to FP32, not to the float64 JavaScript it replaces. A column count computed as `f(f(1732 − 24) × f(1/244))` = 6.9999995 gives `columns >= 7` = 0, where float64 gives 1 (expressions.md#L37; [researcher script] gave 6.999999523162842).
     - The 6.9999995 comes from multiplying by the rounded reciprocal `f(1/244)`.
     - A plain FP32 division `f(1708 / 244)` gives exactly 7 [fact-check script].
     - So don't put "(1732 − 24) / 244 = 6.9999995 in FP32" on screen; show the reciprocal step. [FC1]
   - Division, square root, sine and cosine are not exact (expressions.md#L16-L17).
   - `emitMinimum` and `emitMaximum` drift (5.5).
   - Don't narrate "Handwired is exact" without the FP32/declaration caveat.
3. **The boolean atom and differentiability.**
   - The README claims "fully differentiable". The atom has no real gradient: backprop throws unless straight-through is requested (execution-model.md#L36), and index reads throw on index gradients by default (#L112).
   - The docs frame this as: "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding" (#L36).
   - Both sides come from the same repo. Present it as a stated limit.
4. **Is Handwired's reglu "the" ReGLU?** The shapes match Shazeer's (ReLU of one affine form times another), but the repo never cites GLU or Shazeer. Say "the same shape as the ReGLU used in some Transformers", not "borrowed from".
5. **Declarations as trust.** A false declaration silently yields wrong values: a false grid, or a 0.5 on an exact-bit wire, makes the GPU and CPU disagree (execution-model.md#L60). The repo's mitigation is validators in tests, not proofs.

---

## 8. Misconceptions to avoid

- **"An if-else skips the other branch."** No. Both branches always compute, and a select multiplies the unchosen side by 0 (README#L20; expressions.md#L11). An unselected Infinity still gives NaN.
- **"`boolean` rounds at 0.5 down."** No. 0.5 → 1, because 8,388,609 is odd and the tie rounds to even.
- **"`emitMinimum` returns one of its operands."** Only `emitMinimumExact` does. `emitMinimum(1000.37, 0.3)` → 0.29998779.
- **"The clamp 0..1 always plateaus at 1."** Not past 2^24 (2^24 + 2 → 2, 2^25 → 0), and not for small affine sums near 2^23.
- **"Gathers skip computing the unselected candidates."** No (Q11).
- **"A masked sum turns a selected Infinity into NaN."** No. The NaN comes from an unselected infinite candidate. A selected Infinity with finite rivals comes through the masked sum too (index-read.test.ts#L305-L306) [FC2].
- **"A one-hot group of fewer than 4 members can never become a gather."** No. Requested as an output, a 3-member masked sum lowers to one gather. It stays dense only when another operation reads it and copies its terms (execution-model.md#L72) [FC3].
- **"An index read interpolates at fractional indices."** It floors. The ReLU one-hot interpolates.
- **"The masked sum's 44 at index 2.5 is the second table entry."** It is the average of entries 2 and 3 (28 and 60), and the match with entry [1] is coincidental.
- **"Declarations are checked by the builder."** They are promises. Source-cell ranges are checked per evaluation by the table validator, and computed-wire declarations only by test validators.
- **"'Tensor' means GPU."** In src/runtime, "Tensor" means a program packed into layers of sparse matrices on the CPU (execution-model.md#L298).
- **"circuit.operations.length is the program size."** Count live operations (`program.valueCount − program.sourceSize`). HandwiredOS has 5,028 built but 4,646 live.
- **"multiply/select are instructions."** They are macro records over `reglu` and `affine`.
- **Don't say** Handwired descends from McCulloch–Pitts or Shazeer. There is no such claim in the repo.

---

## 9. Curiosity hooks (true, sourced)

1. **The odd number.** The boolean atom adds 8,388,609 (2^23 + 1) and subtracts it again, and the oddness is what makes exactly 0.5 round up to 1 (model.md#L256; numeric-ui-core.ts#L1916 comment "the odd base makes 0.5 round up").
2. **A fake 44.** At index 2.5 over row heights `[28, 44, 28, 60]`, the ReLU one-hot answers 44. That looks like a real table entry, but it is the halfway blend of 28 and 60. The index read answers 28 (execution-model.md#L106; index-read.test.ts L309–326).
3. **10,000 rows, one weight.** A one-hot read of a 10,000-entry table is 30,002 live operations and 49,998 weights. The index read is 1 operation and 1 weight (#L114).
4. **Min isn't min.** `Math.min(1000.37, 0.3)` rebuilt with ReLUs gives 0.29998779, off by 1.2e−5, less than one FP32 step at 1,000 (model.md#L295; the line number was corrected from L293 [FC8]).
5. **Max of 2^24 and −1 is 16,777,215**, and the matching min is 0 instead of −1 (execution-model.md#L282).
6. **A clamp that collapses.** `relu(v) − relu(v − 1)` at v = 2^25 returns 0, not 1 (#L288).
7. **Logic in one line.** AND of N bits is one ReLU: `relu(sum − (N−1))`. HandwiredOS's hit test ANDs 4 edge comparisons as `relu(sum of bits − 3)` (#L147).
8. **Why not lerp.** The textbook `off + g × (on − off)` loses a tiny chosen value or overflows to Infinity. Handwired's select uses two products instead (#L276; researcher script: 1e−8 vs 1e8 → lerp gives 0).
9. **Start from the first item, not zero.** Adding a `constant(0)` to a running total turns a 2-operation comparison into a 15-operation sign cascade (#L153).
10. **The numbers JavaScript gets "wrong".** A column count computed as `(1732 − 24) × f(1/244)` is 6.9999995 in FP32 but `(1732 − 24) / 244` is exactly 7 in float64, so an exact FP32 bit of `columns >= 7` disagrees with JavaScript (expressions.md#L37). **Corrected [FC1]:** the error comes from the reciprocal rounding before the multiply ("the reciprocal rounds before any comparison runs"). A direct FP32 division `f(1708/244)` is exactly 7.
11. **"Divine benevolence."** The 2020 paper that named ReGLU admitted, "We offer no explanation as to why these architectures seem to work" (Q16). Handwired uses a same-shaped product by hand, with every weight explained.

---

## 10. Visual and dramatic details (for the art department)

There is no physical setting; the "room" is a program. Faithful paper-cut translations:

- **Wires as a long strip of numbered pigeonholes.** Source cells first, then one slot appended per instruction, left to right. Instructions may read only slots to their left (execution-model.md#L28: "never later ones").
- **The affine / weighted sum.** A balance beam or adding loom. Weights are coefficient tokens on threads from earlier slots, plus a bias weight, and the sum is rounded at **every** step (an f() stamp after each term). Order matters, so terms enter in sequence, not all at once.
- **The reglu.** A ramp with a hinge at 0: a gate lever that passes nothing below 0 and passes the gate value above. The left value rides through, scaled by it. With left = 1 it is a plain ramp.
- **The boolean atom.** A ruler that is fine near zero, and a giant ruler starting at 8,388,609 whose ticks are 1 apart. The score is slid onto the coarse ruler, snaps to the nearest tick (0.5 snaps up because the start mark is odd), and is slid back, leaving exactly 0 or 1. Machines **clack**: a detent ratchet.
- **Select.** Two conveyor lanes, both always running (10 and 12). A 0/1 shutter multiplies one lane by 0 and the other by 1, and the outputs merge.
- **One-hot group.** A row of N lamps, exactly one lit. The gather is a single pointer arm that swings to the lit lamp's index (`Σ j × member[j]`) and lifts one value. Every candidate is still made: show all the trays filled.
- **Index read.** A card catalogue drawer, or a rotary selector switch with N detents. The index is floored (a ratchet that only drops to the lower detent), and out-of-range either clamps to the end card or yields an empty (+0) card.
- **Declarations.** Tags hung on wires: "0..16,384", "grid 1/64", "one-hot". They are labelled promises; a false tag leads to a wrong answer with no alarm, except in the test bench.
- **Numbers to put on screen** (all verified above): 8,388,609; 2^24 = 16,777,216; 0.29998779; 16,777,215; `[28, 44, 28, 60]` @ 2.5 → 28 vs 44; 30,002 ops / 49,998 weights vs 1 / 1; comparison 15 ops vs 2 ops; HandwiredOS 5,028 built / 4,646 live.
- **Period framing (if used).** A 1940s Chicago lab for McCulloch–Pitts (generic, no likeness), then a 2020 Transformer diagram, then a 2026 laptop. Keep it to seconds; the film is about Handwired.

---

## 11. Sources

Repo files at the pinned commit (https://github.com/chenglou/handwired/blob/257856e/…):

1. https://github.com/chenglou/handwired/blob/257856e/README.md#L1-L37
2. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L1-L17 (FP32)
3. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L19-L36 (Instructions and macros)
4. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L38-L50 (Compilation)
5. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L52-L64 (Declarations)
6. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L66-L76 (One-hot groups and gathers)
7. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L78-L114 (Index reads)
8. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L116-L147 (Comparisons)
9. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L149-L153 (Grids)
10. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L155-L164 (Rounding points)
11. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L255-L290 (Macro contracts, Selection, Minimum and maximum, Clamping)
12. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L296-L298 (Backends)
13. https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L5-L23 (Familiar expressions)
14. https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L25-L37 (Decision bits)
15. https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L39-L41 (Magnitude safety)
16. https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L74-L84
17. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L1-L39 (header, AtomKind, Macro, OutOfRange)
18. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L92-L111 (RoundingPointKind, Operation)
19. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L235-L237 (indexMagnitudeLimit, Circuit)
20. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L286-L385 (declarations, rounding points)
21. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L399-L555 (source/constant/affine/roundAffine/multiply/select/reglu/boolean/indexRead/indexReadAffine)
22. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L649-L745 (evaluateReference, backpropagateReference)
23. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L1673-L1700 (evaluateOperationStream)
24. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L1844-L1920 (resolveIndexPosition, readIndexedValue, evaluateTerms, evaluateBoolean)
25. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L1934-L1968 (emitRelu, emitMultiply, emitMaximum, emitMinimum, emitSelect)
26. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L2370-L2423 (exact min/max/clamp, emitSelectOperand)
27. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L3194-L3280 (validators)
28. https://github.com/chenglou/handwired/blob/257856e/tests/runtime/index-read.test.ts#L172-L330
29. https://github.com/chenglou/handwired/blob/257856e/tests/runtime/gather-lowering.test.ts#L136-L160
30. https://github.com/chenglou/handwired/blob/257856e/tests/runtime/gather-lowering.test.ts#L809-L842
31. https://github.com/chenglou/handwired/blob/257856e/tests/runtime/gather-lowering.test.ts#L1220-L1243
32. https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/model.md#L228-L326 (three operations, index reads, first macros, decision bits)
33. https://github.com/chenglou/handwired (repo landing page: tagline, 825 commits)
34. https://github.com/chenglou/handwired/commit/3d2c717 (first commit, 2026-06-03)
35. https://github.com/chenglou/handwired/commit/fd8f0a3 (boolean atom, 2026-06-07)
36. https://github.com/chenglou/handwired/commit/a137ccd (gather lowering / assumeOneHot, 2026-07-08)
37. https://github.com/chenglou/handwired/commit/17c2318 (index reads, emitCompare, 2026-09-15)
38. https://chenglou.me/handwired/ (live demos)

Commands run (the researcher's own script, no repo code): `node scratchpad/fp32.mjs`, using `Math.fround` only. It reproduced the boolean-atom table, emitMinimum drift, emitMaximum(2^24, −1), the clamp failures, the AND/OR/NOT truth table, the grid compare bits, the README example, the index 2.5 interpolation, f(5/24) < 5/24, and the column count 6.999999523162842. `bun test` in the clone was denied by the sandbox and is still to do.

External:

39. https://arxiv.org/abs/2002.05202 — Shazeer, "GLU Variants Improve Transformer", 12 Feb 2020
40. https://arxiv.org/html/2002.05202 — the ReGLU equation and the "divine benevolence" conclusion
41. https://arxiv.org/abs/1612.08083 — Dauphin et al., "Language Modeling with Gated Convolutional Networks", 23 Dec 2016
42. https://doi.org/10.1007/BF02478259 — McCulloch & Pitts 1943, Bull. Math. Biophysics 5:115–133
43. https://en.wikipedia.org/wiki/A_Logical_Calculus_of_the_Ideas_Immanent_in_Nervous_Activity
44. https://mlanthology.org/icml/2010/nair2010icml-rectified/ — Nair & Hinton, ICML 2010, pp. 807–814
45. https://arxiv.org/abs/2301.05062 — Lindner et al., "Tracr", 12 Jan 2023

---

## Fact-check log (adversarial pass, 2026-10-27)

**Method.**

- I re-read every cited repo line in the local clone at `257856e3b221140acb4cc4460626b850c0bd4ff1`, with `git log -1` and `git rev-list --count HEAD` = 825.
- I re-ran the pickaxe searches for the commit dates: `git log -S'8_388_609'`, `-S'assumeOneHot'`, `-S'indexReadAffine'` and `-S'emitCompare'`, plus `git show 3d2c717 | grep -c 'reglu('` = 6.
- I wrote a fresh FP32 script (`Math.fround` only) to recompute every number.
- I fetched the external sources: the arXiv abs and HTML pages for 2002.05202, 1612.08083 and 2301.05062, Springer's page for BF02478259, the ML Anthology page for Nair & Hinton, and icml.cc for the ICML 2010 venue.
- `git grep -i "shazeer|gated linear|swiglu|2002.05202|GLU"` at 257856e returns nothing.
- Running `bun test` was denied again in this session (sandbox), so test outcomes are still read from the assertions, not from a run.

**Confirmed unchanged:**

- **The instruction set:** AtomKind at L30-31, the header comment at L1-2, the four instruction formulas, and that instructions read only earlier wires.
- **reglu and ReLU:** reglu/emitRelu, and the README's "matrix multiplication + reglu over floats" and "these 2 primitives" (L28 in full: "Because we basically only use these 2 primitives:").
- **The boolean atom:** 8,388,609, with 0.5 → 1 and 0.49999997 → 0. The builder throws outside 0..1, and backprop throws unless straight-through is requested.
- **NOT, AND and OR.**
- **The README ternary:** a = 3, 4, 5, 7 give 12, 12, 10, 10.
- **emitSelect:** 4 operations in 3 layers (expressions.md#L11, and the code at L435-L443), the finite-operand contract, and the lerp failures (1e8/1e−8 → 0; ±3e38 → Infinity).
- **min, max and clamp:** emitMinimum gives 0.29998779296875, emitMaximum(2^24, −1) gives 16,777,215 and min gives 0, and clamp01 gives 2 at 2^24+2 and 0 at 2^25. The copied `x − 0.5` case gives 0.5. The exact-select form `on × relu(bit) + off × relu(1 − bit)` is confirmed.
- **Grid bits** for D = −2..2.
- **Declarations:** the quote "promises from the caller, not proofs" and the three validators.
- **Gathers:** 3N → 0 stored weights, and HandwiredOS's 6 groups with 0 gather reads.
- **Index reads:** the read contract (±2^24, floor, clamp/+0, 1 operation), and 30,002 / 49,998 vs 1 / 1.
- **Index 2.5:** the read gives 28 and the masked sum 44, through bits [1, 1, 1, 0.5].
- **FP32 accumulation order.**
- **Shazeer:** the ReGLU equation, the arXiv v1 date of 12 Feb 2020, and the "divine benevolence" sentence, verbatim from the raw HTML.
- **Other external sources:** Dauphin et al., 23 Dec 2016, with all 4 authors. Tracr, 12 Jan 2023, NeurIPS 2023 Spotlight, with the quote verbatim. Nair & Hinton, pp. 807–814, ICML 2010, Haifa, 21–24 June 2010. McCulloch & Pitts, Bull. Math. Biophys. 5:115–133, cover date 1943-12-01.
- **Commits:** 3d2c717 (2026-06-03), fd8f0a3 (2026-06-07), a137ccd (2026-07-08), 17c2318 (2026-09-15) and bf719fa (2026-09-17).
- **Program sizes:** 5,028 / 4,646, and 59 / 707 / 33 rounding points.

**Changes:**

- **FC1 (corrected):** `(1732 − 24)/244` is **not** 6.9999995 as a plain FP32 division. `f(1708/244)` is exactly 7. The 6.9999995 is `f(f(1732−24) × f(1/244))`: the reciprocal rounds first (expressions.md#L37). Fixed in hook 10 and in debate 2. Source: R:docs/expressions.md#L37 and the fact-check script.
- **FC2 (corrected):** the claim "the read passes a selected Infinity through where the masked sum gives NaN" was wrong for a selected Infinity. The masked sum turns into NaN only when an **unselected** candidate is infinite (`0 × Infinity`). A selected Infinity with finite rivals survives the masked sum too. Source: R:tests/runtime/index-read.test.ts#L293-L306 and R:docs/execution-model.md#L107. Fixed in 5.8 and in the misconceptions.
- **FC3 (corrected):** "groups of fewer than 4 members stay dense" overgeneralized. A 3-member masked sum requested as an output lowers to one gather. It stays dense only when a reader copies its terms, as HandwiredOS's frontmost-window sums are. Source: R:docs/execution-model.md#L72 and R:tests/runtime/gather-lowering.test.ts#L1224-L1229. Fixed in 5.7 and in the misconceptions.
- **FC4 (corrected and qualified):** "2 operations instead of a 15-operation sign cascade for operands within 0..16,384" is only true for `>=`. `>` is 2 vs 16 and `===` is 3 vs 28. The grid figures are stated for operands on a 1/64 grid (within ±8,192, or any operands within 2^24 grid steps), and the cascade figures are for 0..16,384. Source: R:docs/execution-model.md#L54, #L130-L137 and R:docs/expressions.md#L9. Fixed in the summary and in 5.4.
- **FC5 (unverifiable):** the explanation of the Sept 14 (guide) vs Sept 15 (commit) gap as "a lab date versus a merge date" isn't supported. `17c2318` has one parent, so it isn't a merge, and its author and commit dates are both 2026-09-15 08:47 -0700. Marked UNVERIFIED. Keep "mid-September 2026".
- **FC6 (upgraded):** the McCulloch & Pitts abstract's first sentence is now verified verbatim on Springer (https://link.springer.com/article/10.1007/BF02478259). Q18 can be quoted in full.
- **FC7 (source corrected):** the McCulloch & Pitts affiliations now cite Springer's metadata for the 1943 article (College of Medicine, Department of Psychiatry at the Illinois Neuropsychiatric Institute, University of Illinois; The University of Chicago). The unchecked "1990 reprint" attribution was removed.
- **FC8 (citation fix):** the emitMinimum drift line in the lab guide is model.md#L295, not #L293.
- **FC9 (precision):** index-read.test.ts's fractional test uses an 8-entry table `[28, 44, 28, 60, 36, 28, 52, 40]`. The 4-entry `[28, 44, 28, 60]` is the docs' excerpt. The 2.5 → 28 / 44 result holds for both.
- **FC10 (wording):** the docs say "the program itself still contains only the four instructions above", not "the compiled program …".
- **Note (not an error):** the boolean atom's docs formula is `f(f(f(score) + 8_388_609) - 8_388_609)` (execution-model.md#L24), and the guide writes `f(f(score + 8,388,609) - 8,388,609)` (model.md#L256). Both describe `evaluateBoolean`, L1914-L1919.
- **Note (not an error):** the 2026-10-13 timeline row ("drops to 3 windows") is inferred from the test comment "With four windows, until October 13, 2026, they lowered to 12 gather reads". I didn't find the window-count commit itself. Treat the exact day as the test comment's claim.
