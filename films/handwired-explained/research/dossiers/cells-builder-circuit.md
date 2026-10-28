# Dossier: Writing a Program: Cells, Wires, the Source Table and Builder Code Appending to a Circuit

- id: `cells-builder-circuit` · era: repo at `257856e` · as-of: 2026-10-27
- Primary source: the local clone `.orly-work/repos/handwired`, `main` at
  `257856e3b221140acb4cc4460626b850c0bd4ff1` (author date 2026-10-16 17:33:49 -0700; `git log -1`).
- Repo URL base: `B = https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1`.
  A citation written `R:path#Lx-Ly` means `B/path#Lx-Ly`. Commit URLs are
  `https://github.com/chenglou/handwired/commit/<hash>`. The base resolves: WebFetch of
  `B/template/README.md` on 2026-10-27 returned the template README.
- Method: every file below read in full at the pin with `cat -n` (line numbers are from that
  output); `git log --follow` / `git show -s` for dates and commit messages. **Repo code was not
  executed in this pass**: the sandbox refused `bun test template` and `bun test
  tests/runtime/cells.test.ts`. Numbers marked *derived* were worked by hand from the source, and
  two spring numbers were re-computed with standalone `node -e` arithmetic that imports nothing
  from the repo (command and output in 5.6). Numbers marked *the repo's own* are stated in the
  docs or asserted in tests. Re-run `bun test template` before putting a pass/fail count on screen.

---

## 1. Summary

A Handwired program is "a fixed list of operations over 32-bit floats, called FP32 here, mostly
weighted sums and products with a ReLU" (R:docs/tutorial.md#L13). The programmer never writes
that list by hand and no tool translates existing JavaScript into it: "No tool converts existing
JavaScript source into a program" (R:docs/README.md#L3). Instead you write **builder code**,
"ordinary JavaScript that runs once and appends operations to a `Circuit`, so nothing in the
program branches or loops at runtime" (R:docs/tutorial.md#L13).

The vocabulary, as `docs/README.md` defines it (R:docs/README.md#L13-L21):

- **Source table**: the `Float32Array` that a program reads.
- **Cell**: one number of the source table: a constant, an input, an event bit or state.
- **Wire**: the position of a number, either a cell or the result of an operation.
- **Operation**: a weighted sum (`circuit.affine`), a product with a ReLU (`circuit.reglu`), a
  score rounded to 0 or 1 (`circuit.boolean`), or a table read (`circuit.indexRead`).
- **Builder function**: a function that appends several operations, e.g. `emitCompare`.
- **Evaluation**: one run of the program over the source table.
- **Host**: the JavaScript around the program; it writes inputs into cells, evaluates, copies
  next-state values back into the table, and writes the DOM.

`src/runtime/cells.ts` (384 lines) is where cells are declared. Six declaration functions say
"what happens to the cell around an evaluation": `constant`, `input`, `inputBit`, `event`,
`state`, `stateBit`, plus the grouping helpers `list`, `oneHot`, `permutation` and the rule
`table.atMostOne` (R:src/runtime/cells.ts#L27-L99, R:docs/tutorial.md#L42-L51). Building has
**two phases** "since a `Circuit` needs the number of cells before the first operation exists"
(R:docs/tutorial.md#L57): `createSourceTable()` → `table.declare(spec)` (returns the cells'
wires in the declaration's own shape) → `table.createCircuit()` (declares every range, grid, exact
bit and one-hot group on a `new Circuit(cells.length)`; strictly, only one-hot groups with
`declareToCircuit` set, the default, while `table.atMostOne` rules are checked only by the
validator, R:src/runtime/cells.ts#L167-L173, L191-L193) → builder code → `table.next(stored,
next)` for every state cell → `table.finish()`, which returns `{circuit, nextSource,
initialSource, validate}` (R:src/runtime/cells.ts#L125-L239).

The `Circuit` class lives in `src/runtime/numeric-ui-core.ts` (3,434 lines, class at L237). A
wire is a branded number, `export type Wire = number & WireBrand` (R:src/runtime/numeric-ui-core.ts#L13),
"a position in the array an evaluation fills: source cells first, then one position per
operation" (L6-L7). The builder methods `affine`, `constant` (via `affine`), `roundAffine`,
`reglu`, `boolean`, `multiply` and `select` end in `Circuit.append(kind, leftTerms, leftBias,
gateTerms, gateBias, options)` (L557), which pushes one `Operation` onto `circuit.operations` and
returns its wire, `sourceSize + operations.length` before the push (L615-L619). Two caveats
(fact-check, 2026-10-27): `multiply` with operands of unknown sign appends three operations
(L430-L432) and `select` appends up to four (complement, two multiplies, the sum; L435-L443), so
"one call, one operation" holds only for `affine`/`reglu`/`boolean`; and **`indexRead` does not go
through `append`** (whose `kind` excludes `'index'`, L558): it calls `indexReadAffine` (L480-L555),
which pushes its own `'index'` operation and returns `sourceSize + operations.length` the same
way, or returns a candidate wire directly for a constant index. The exact public
names: `source(index)` L399, `constant(value)` L406 (which is just `affine([], value)`),
`affine(terms, bias = 0)` L410, `roundAffine` L418, `multiply` L422, `select(gate, off, on)` L435,
`reglu(leftTerms, leftBias, gateTerms, gateBias)` L445, `boolean(value)` L449,
`indexRead(index, candidates, options)` L467, and the declarations `assumeRange` L286,
`assumeOneHot` L324, `assumeGrid` L347, `assumeBit` L368, plus `roundingPoints()` L385,
`createTensorEvaluator(roots)` L757 and `compileTensorProgram` L796. The free builder functions the
template uses are `emitCompare` (L2017), `emitSelect` (L1966, a one-line wrapper over
`circuit.select`) and `emitAnimatedObject` (L2610).

The worked example is `template/`: a toggle switch that acts on release. A press on the track
arms it; a release on the track while armed flips it; the thumb springs to its new side
(R:docs/tutorial.md#L3, R:template/toggle.ts#L1-L4). Five files:
`toggle.ts` (170 lines: cells, builder code, host loop, DOM writes), `toggle-reference.ts`
(58 lines: the same switch in plain JavaScript, float64), `toggle.test.ts` (95 lines: runs both
over a scripted trace and compares every frame), `index.html` (21 lines) and `main.ts` (3 lines,
`mountToggle()`) (R:template/README.md#L13-L16). The toggle has **20 cells**
(R:docs/tutorial.md#L145; derived count in 5.1). The test checks the `on` and `armed` bits and the
track position **exactly**, the thumb **within 1e-5 px**, and whether the clock runs; it pins
**38 animating frames** and a rest position of **20 px** (R:template/toggle.test.ts#L51-L62,
R:docs/tutorial.md#L167-L169). This "reference-vs-circuit" pattern is the repo's standard way of
showing a handwritten program does what the JavaScript it replaces does; it is a form of what
software testing calls differential testing (McKeeman 1998; context only, the repo does not use
the term).

The tutorial's two extension sections: **"A program without state or animation"**
(R:docs/tutorial.md#L171-L190) drops `advanceFrame`, the spring cells and `emitAnimatedObject`,
calls `table.finish()` with no `table.next`, and evaluates output wires alone with
`createTensorEvaluator`, shown for a hypothetical progress bar (`buildProgressBar` is a snippet in
the tutorial, **not** a file in the repo). **"Adding a second switch"** (L192-L227) turns the
switch into a component (`switchCells` + `buildSwitch(circuit, table, switchWires, page, left,
top)`) and declares `switches: list(2, () => switchCells)`; HandwiredOS's Photos window
(`photoCells`, `buildPhotos`) is the real component of that form. **"A new app folder"**
(L229-L239) says to copy `template/` to a sibling folder at the repo root and register it in
three places: `tsconfig.json`'s `include`, `scripts/check.ts`'s oxlint command, and
`package.json`'s `test` script.

History: cells.ts, cells.test.ts, the template and the tutorial all arrived in one commit,
`7452dd9` "Brand wires, declare cells, and add a template app" (2026-09-15), which replaced
"hand-kept table positions" with declarations; the tutorial was then revised twice by outside
readers (`259c5d2`, 2026-10-14; `4ea7fcb`, 2026-10-15).

---

## 2. Timeline

| date | event | source |
|---|---|---|
| 1998 | William M. McKeeman publishes "Differential testing for software", *Digital Technical Journal* 10(1):100-107: run two implementations on the same inputs and compare. Context only for the reference-vs-circuit pattern. | https://dblp.org/pid/40/4856 ; https://patents.google.com/patent/US5754860 |
| 2026-06-03 | First commits of the repo by Cheng Lou: `3d2c717` "Create numeric UI atom lab" (20:24 -0700, the first by `git log --reverse`), then `592f296` "Set up minimal Bun TypeScript project" (20:38 -0700). | `git log --reverse` in clone; https://github.com/chenglou/handwired/commit/3d2c717 |
| 2026-09-15 21:27 -0700 | `7452dd9` "Brand wires, declare cells, and add a template app": `Wire` becomes a branded number; `assumeRange`/`assumeGrid` throw on late declarations; `cells.ts` (380 lines) and `cells.test.ts` (256 lines) added; template/ toggle app and tutorial.md added. Commit message: window-manager.ts "went from 2,180 to 1,759 lines, and source table validation from 257 lines to 9"; "Every compiled program is identical to 6ace584, e.g. IndirectOS stays at 3,654 operations in 124 layers, and all 12,043 lab fingerprints match." | https://github.com/chenglou/handwired/commit/7452dd90c12a1faf36c73f083316e4403fbbc294 |
| 2026-09-15 | `62417d1` "Prepare the docs for open source: fold macro-ranges.md, rewrite the README, remove todo.md and local paths" (touches tutorial.md). | https://github.com/chenglou/handwired/commit/62417d1 |
| 2026-09-17 | `bf719fa` moves the runtime into `src/` (cells.ts → `src/runtime/cells.ts`); `b02baf8` moves the five root docs into `docs/`. | https://github.com/chenglou/handwired/commit/bf719fa ; https://github.com/chenglou/handwired/commit/b02baf8 |
| 2026-09-17 | `7c1018d`: cells.ts's validator stores grid and bit checks in typed arrays; commit subject: "in Chrome the validator takes 7.3 µs per hover frame instead of 85 µs and 9.7 µs per drag frame instead of 202 µs, because V8 no longer deoptimizes it". The comment survives at R:src/runtime/cells.ts#L355-L357. | https://github.com/chenglou/handwired/commit/7c1018d |
| 2026-10-06 | The repo, named Indirect (desktop: IndirectOS), becomes Handwired / HandwiredOS: "The repo was named Indirect, and its desktop IndirectOS, until October 6, 2026." | R:lab/status.md#L287 |
| 2026-10-14 22:43 -0700 | `259c5d2` "Tutorial and README: what a reader who follows them from a clean copy tripped on". One reviewer followed the tutorial "from a clean copy, first line to last"; "Every command and every stated number held." Fixes four gaps in "Adding a second switch" (`layout.gap` didn't exist; missing imports; `trackTop`; one clock for two thumbs). | https://github.com/chenglou/handwired/commit/259c5d2 |
| 2026-10-15 00:35 -0700 | `4ea7fcb` "Entry docs: what four readers without any background tripped on": template/ gets its README; tutorial explains wire, grid, settle check, snap, host and clock at first use, and moves "Testing against JavaScript" before the program without state. | https://github.com/chenglou/handwired/commit/4ea7fcb |
| 2026-10-16 17:33 -0700 | `257856e`, the pinned commit (a lab experiment; template/, docs/, src/runtime unchanged since 4ea7fcb per `git log` of those paths). | https://github.com/chenglou/handwired/commit/257856e3b221140acb4cc4460626b850c0bd4ff1 |

---

## 3. People

**Cheng Lou (`chenglou`)**, the sole git author: `git log --format='%an' | sort | uniq -c` gives
825 commits, all "Cheng Lou". What the repo itself shows about his role in this subsystem:

- He approved the open-source preparation that produced cells.ts and the template. The commit
  message of `7452dd9` says: "On September 16, 2026, Cheng approved preparing the repo for open
  source with IndirectOS as the focus, including fixes for API traps, cell declarations instead of
  hand-kept table positions, and a small template app with a tutorial." (The commit's own author
  date is Sept 15, 21:27 -0700, i.e. Sept 16 UTC.)
- He named the tutorial and templates as the entry point: quoted in `259c5d2` and in
  lab/status.md (see section 6).
- Commits in this subsystem carry the trailer `Co-Authored-By: Claude Code
  <noreply@anthropic.com>` (7452dd9, 259c5d2, 4ea7fcb), i.e. the repo records AI-assisted
  authorship. The film may say so plainly; it should not speculate about the split of work.
- The reviewers of 259c5d2 ("One reviewer ... a second reviewer") and 4ea7fcb ("Four readers who
  had seen none of the work") are anonymous in the repo. Do not name or characterize them.

Depiction: the brief limits biography to what the repo says, and the repo gives **no physical
description**. For silhouette work use a generic, unidentifiable figure at a desk (no likeness, no
signature clothing); better still, carry this chapter with hands and objects (a hand pinning
cards into a numbered rack, a hand drawing a wire) rather than a person.

---

## 4. The belief of the age

What a programmer ordinarily believes, and what this chapter overturns (all as stated by the repo;
no field-wide claim needed):

- **"A program branches and loops while it runs."** The tutorial's counter-statement: builder code
  runs once, "so nothing in the program branches or loops at runtime" (R:docs/tutorial.md#L13);
  "A program can't loop a number of times that is only known at runtime" (L106). An `if` "that
  assigns a cell becomes a select on the cell's next value", and the select "computes both sides
  and picks one" (L93).
- **"A variable is a box you reassign."** Here: "Where JavaScript would reassign a variable,
  builder code makes a new wire: `armedAfterDown` holds the value after the press, while
  `cells.armed` still holds the previous evaluation's value" (L93). State persists only through
  the source table, by pairing each state cell with exactly one next value (`table.next`), which
  the host copies back (L64, L68, R:src/runtime/cells.ts#L197-L220).
- **"Table positions are kept by hand."** That was the repo's own earlier practice: `7452dd9`
  replaced "hand-kept table positions" with declarations, and its message reports source-table
  validation falling "from 257 lines to 9" in IndirectOS. Who held it: the repo itself, before
  2026-09-15. What ended it: cells.ts.
- **"A wire is a number."** Until `7452dd9`, a plain number type-checked as a wire, so
  `emitMinimum(circuit, width, 1)` "read wire 1 instead of the number 1" (commit message). Branding
  ended that in typed code; lab folders opt out via `lab/types/loose-wires.d.ts`
  (R:src/runtime/numeric-ui-core.ts#L15-L19). It is a partial fix: "The type doesn't catch the
  opposite mistake, a wire where a number is expected" (R:docs/tutorial.md#L70).

Precedent (context, sourced, not claimed by the repo): "run ordinary code once to record a fixed
sequence of operations" is how JAX's `jit` works: "By executing the function with traced values,
JAX can determine the sequence of operations encoded by the function", and a jaxpr is "a simple
representation of a functional program, comprising a sequence of primitive operations"
(https://docs.jax.dev/en/latest/key-concepts.html). Builder code is the same idea done explicitly:
there is no tracer, the code calls `circuit.affine(...)` directly. If the film draws the parallel,
present it as an analogy, not as lineage.

---

## 5. Experiments and results

### 5.1 The toggle's source table, cell by cell (derived)

`table.declare` gives "each cell a position in declaration order" (R:docs/tutorial.md#L68;
R:src/runtime/cells.ts#L131-L158, a cell is pushed and gets `asWire(cells.length - 1)`). Walking
`toggleCells` (R:template/toggle.ts#L18-L38) in order gives these wires (derived by counting; the
test for cells.ts confirms the rule on its own table, R:tests/runtime/cells.test.ts#L39-L43):

| wire | cell | declaration | range | initial |
|---|---|---|---|---|
| 0 | viewportWidth | `input([0, 16_384], {initial: 1280, grid: 1})` | 0..16,384 | 1280 |
| 1 | viewportHeight | `input([0, 16_384], {initial: 800, grid: 1})` | 0..16,384 | 800 |
| 2 | down.active | `event()` | exact bit | 0 |
| 3 | down.x | `input([-16_384, 16_384], {grid: 1/64})` | ±16,384, 1/64 grid | 0 |
| 4 | down.y | same | | 0 |
| 5 | up.active | `event()` | | 0 |
| 6 | up.x | coordinate | | 0 |
| 7 | up.y | coordinate | | 0 |
| 8 | cancel | `event()` | | 0 |
| 9 | on | `stateBit()` | | 0 |
| 10 | armed | `stateBit()` | | 0 |
| 11-14 | springMatrix[0..3] | `input([-matrixBound, matrixBound])` | ±`springMatrixBound(springConstants)` | 0 |
| 15 | settleCheck | `inputBit()` | | 0 |
| 16 | snap | `inputBit()` | | 0 |
| 17 | thumb.displacement | `state([-40, 40])` (±2 × travel) | | 0 |
| 18 | thumb.velocity | `state([-1280, 1280])` (±64 × travel) | | 0 |
| 19 | thumb.destination | `state([0, 20])` | | 0 |

Total 20, matching "the toggle's 20 cells" (R:docs/tutorial.md#L145). Layout constants:
`trackWidth 52, trackHeight 32, thumbInset 4, travel 20`; spring `stiffness 650, damping 45`
(R:template/toggle.ts#L9-L10). `matrixBound`'s numeric value was not computed in this pass; show
it as a symbol or run `springMatrixBound` first.

The six cell kinds (R:docs/tutorial.md#L42-L49; R:src/runtime/cells.ts#L27-L66):

| declaration | around an evaluation | policy / exact bit |
|---|---|---|
| `constant(value, range)` | set once in the initial table, kept | 'constant' |
| `input(range, {initial, grid})` | written by JavaScript before the evaluation, kept | 'input' |
| `inputBit(initial)` | an input that is exactly 0 or 1 | 'input', exactBit |
| `event()` | JavaScript sets it to 1; the program resets it to 0 | 'event', exactBit |
| `state(range, {initial, grid})` | computed by the program | 'state' |
| `stateBit(initial)` | state that is exactly 0 or 1 | 'state', exactBit |

Under the hood a `CellSpec` is `{kind: 'cell', policy, range, initial, exactBit, grid}`
(R:src/runtime/cells.ts#L35-L46); there are only four policies (`'constant' | 'input' | 'event' |
'state'`, L33); the "Bit" variants are the same policies with `exactBit: true`.

What the table derives from declarations (R:docs/tutorial.md#L68; R:src/runtime/cells.ts#L221-L237):
the **initial table** (`Float32Array.from(cells, ({spec}) => spec.initial)`), a **validator**,
and **`nextSource`**, "which lists the wire that holds each cell's next value: a constant or an
input holds itself, and an event holds 0". The event's 0 is a real operation: `finish()` builds
`built.constant(0)` once if any event cell exists (L231), and the test checks it is an affine
with no terms and bias 0 (R:tests/runtime/cells.test.ts#L61-L63).

### 5.2 The two build phases and their guard rails (the repo's own tests)

`tests/runtime/cells.test.ts` (321 lines, 15 `test(...)` blocks by static count) pins each rule.
Error strings below are verbatim from the test expectations:

- Declaring after `createCircuit` throws `'declare every cell before createCircuit'`;
  `table.next` before it throws `'call createCircuit before table.next'` (L137-L139).
- A state cell with no next value: `'count never received a next value'` (L135); two next values:
  `'count already has a next value'` (L141); pairing a non-state cell: `'width is not a state
  cell'` (L142); a next value that isn't a wire of the circuit: `'the next value of open is not a
  wire of the circuit'` (L143).
- `table.next` pairs by field name in any order; a mismatched shape throws `'next state has fields
  position, speed but the stored struct has position, velocity'` (L146-L157).
- The validator names the cell: `'width must be finite and within 0..100, got 101'`, `'width must
  be a multiple of 1, got 40.5'`, `'click must be exactly 0 or 1, got 0.5'`, `'choice breaks its
  oneHot rule with mass 2'`, `'the table holds 3 numbers, but 19 cells are declared'`
  (L159-L178).
- `createEvaluator` returns next values in cell order and outputs in the output's shape; the
  third evaluation of `speed *= 2` from 2 throws `'speed must be finite and within 0..8, got 16'`
  (L180-L200).
- **Both sides of a select always compute**: a test builds `pressed ? 7 : width * 2` and at width
  3e38 the unpicked side overflows, giving a NaN output and an error that names "the first NaN"
  inside `select(gate wire 0 = 1 ...` (L202-L213). Comment, verbatim: "Both sides of a select
  always compute, and width * 2 overflows to Infinity at 3e38." (L207)
- Declaring a bit changes no operation: the same builder code over `inputBit()` cells and over
  `input([0, 1])` cells yields equal `operations`, `grids` and compiled program (L84-L104).
- A component: `counterCells = {count: state([0, 1000])}` and `buildCounter(circuit, table,
  counter, press)`, declared nested (`list(2, () => counterCells)`) and in a second call
  (`table.declare(counterCells, 'extra')`); with press = 1 and counts 5, 0, 7 the outputs are
  `[{count: 6}, {count: 1}, {count: 8}]` (L304-L321).
- The type checker refuses plain numbers where wires are expected (`@ts-expect-error` lines),
  while at runtime those calls build without error: "`bun run check` is what refuses them"
  (L271-L302).

### 5.3 How builder code appends (numeric-ui-core.ts)

- `affine(terms, bias)` → `append('affine', terms, bias, [], 0)` (L410-L412).
  `reglu(l, lb, g, gb)` → `append('reglu', l, lb, g, gb)`, computing `(l + lb) × max(0, g + gb)`
  (L445-L447; R:docs/tutorial.md#L74). `constant(v)` = `affine([], v)` (L406-L408).
- `append` (L557-L647), in order: normalizes terms and **folds constant wires into the bias**; if
  the result is just an existing wire (e.g. `affine([[x, 1]], 0)`), it **returns that wire and
  appends nothing** (`identityWire`, L580-L581); it copies small affine producers into the new
  sum (`composeAffineTerms`); it simplifies a ReLU gate with no terms into a plain affine; it
  **returns the existing wire for an identical expression** (`expressionWires`, L611-L614); only
  then does it push the operation, record its depth (one more than its deepest input), constant,
  inferred grid, range and readers, and return `sourceSize + operations.length` (L615-L645).
  So "appends" is literally true but deduplicated: calling the same expression twice yields one
  operation.
- Every arithmetic step "rounds to FP32, like `Math.fround`" (R:docs/tutorial.md#L74).
- `select(gate, off, on)` = `gate × on + (1 − gate) × off`, built from `roundAffine` of the
  complement and two `multiply` macros, each of which is a `reglu` when the gate is nonnegative
  (L422-L443).

### 5.4 The toggle's builder code, worked with real numbers (derived)

From R:template/toggle.ts#L45-L83 (tutorial L76-L104 shows the same lines with their JavaScript
comments):

- `trackLeft = affine([[viewportWidth, 0.5]], -26)`: at 1280 → **614**. `trackTop =
  affine([[viewportHeight, 0.5]], -16)`: at 800 → **384**. The test confirms "the track spans x
  614..666 and y 384..416" (R:template/toggle.test.ts#L9).
- `all(...bits) = reglu([], 1, bits.map(b => [b, 1]), 1 − count)` = `max(0, Σbits − (count − 1))`:
  with four bits all 1, `max(0, 4 − 3) = 1`; with one bit 0, `max(0, 3 − 3) = 0`.
- `not(bit) = affine([[bit, −1]], 1)` = `1 − bit`.
- `insideTrack(point)` = `all` of four `emitCompare` bits: `x >= trackLeft`, `x < trackLeft + 52`,
  `y >= trackTop`, `y < trackTop + 32`.
- On grids, `emitCompare` builds `[a >= b]` as `relu(1 − relu(−D))` on the integer
  `D = (a − b) / grid` (R:src/runtime/numeric-ui-core.ts#L2006-L2008). The pointer is on 1/64 px
  and `trackLeft` on 1/2 px (R:docs/tutorial.md#L53), so the shared grid is 1/64:
  - press at x = 640: D = (640 − 614) × 64 = 1664 → relu(−1664) = 0 → relu(1 − 0) = **1**.
  - press at x = 613.984375 (1/64 px left): D = −1 → relu(1) = 1 → relu(1 − 1) = **0**; the test
    expects this press not to arm (R:template/toggle.test.ts#L28).
  - press at x = 614 (exactly on the edge): D = 0 → **1**; armed (L29).
  - release at x = 666: `x < 666` is false → outside, "so it only disarms" (L30).
  Grid comparison costs 2 operations; without grids, operands within 0..16,384 take 15
  (R:docs/tutorial.md#L53; R:src/runtime/numeric-ui-core.ts#L2006-L2012).
- `armedAfterDown = emitSelect(down.active, armed, insideTrack(down))` (JS: `if (down) armed =
  insideTrack(down)`); `on = emitSelect(all(up.active, armedAfterDown, insideTrack(up)), on,
  not(on))` (JS: `if (up && armed && insideTrack(up)) on = !on`); `armed = all(armedAfterDown,
  not(up.active), not(cancel))` (JS: `if (up || cancel) armed = false`). Order fixed: down, then
  up, then cancel (R:template/toggle.ts#L60-L65). Worked: armed = 1, a release at (640, 400):
  flip bit = max(0, 1 + 1 + 1 − 2) = 1; on' = 1 × (1 − 0) + 0 × 0 = **1**; armed' = max(0, 1 + 0
  + 1 − 2) = **0**.
- "Each call of `insideTrack` appends a whole hit test, and the program computes both hit tests in
  every evaluation" (R:docs/tutorial.md#L93), even in a frame with no pointer event at all.
- Animation: `destination = affine([[on, 20]])`; `emitAnimatedObject` applies the host-written
  spring matrix once; `table.next(cells.thumb, {displacement, velocity, destination})`; output
  `{trackLeft, trackTop, thumbOffset, on, armed, active}` (R:template/toggle.ts#L67-L83).
- Total operation count of the toggle program: **not stated in the docs and not measured** here.
  To show one, run in the clone: `bun -e "import {buildToggle} from './template/toggle.ts'; const
  b = buildToggle(); console.log(b.circuit.operations.length)"` and record the output.

### 5.5 Reference vs circuit: the test (the repo's own)

- `toggle-reference.ts` keeps `{on, armed, thumbOffset, velocity, animatedUntilMs,
  checkOriginMs}` in float64; steps the spring in fixed 4 ms semi-implicit Euler steps
  (`velocity += (−650 × (offset − destination) − 45 × velocity) × 0.004; offset += velocity ×
  0.004`), settles only at a check every 64 ms of simulated time when within 0.01 px and
  0.01 px/s, and applies same-timestamp events as last down, then last up, then any cancel
  (R:template/toggle-reference.ts#L1-L55). It "never snaps", so traces keep stalls below about
  1,140 ms (R:docs/tutorial.md#L165; reference comment L5-L6).
- `toggle.test.ts`'s scripted trace: frames 16 ms apart at 1280 × 800 starting at 1000 ms, each
  event 3 ms before its frame; a press and release flip on; a click while the thumb moves flips
  back; 60 idle frames; edge presses (1/64 px left, exactly on the left/top edges, exactly on the
  right edge); a pointercancel that disarms; a corner press 1/64 px inside the bottom right; a
  500 ms stall while moving; 60 idle frames (R:template/toggle.test.ts#L11-L39).
- Assertions per frame: `[on, armed, trackLeft, trackTop]` **equal** to the reference; scripted
  expectations met; clock running iff the reference is animating; then `animatingFrames` **= 38**,
  `largestThumbError < 1e-5`, final `thumbOffset` **= 20**, clock stopped (L41-L63).
- Two more tests: a pointer x of 640.001 throws `'down.x must be a multiple of 0.015625'`
  (L65-L69); same-timestamp orderings (release+press, cancel+press, and release and press 1/64 ms
  apart) match the reference (L71-L95).
- Why decisions match exactly: "`emitCompare`'s bits equal JavaScript's comparisons for every
  declared value" (R:docs/tutorial.md#L167). Positions differ from float64 "by 1.3e-6 px at most
  over this 20 px travel", growing to "up to 1.4e-4 px in traces whose destinations move by
  hundreds of pixels"; "Scale the tolerance with the travel" (L167).
- Test design rule: "Each scripted step states what it must do ... so a step that silently does
  nothing fails the test. Put presses exactly on edges, e.g. `x === trackLeft`, since an inexact
  decision shows there first" (L169).
- The same pattern recurs in the big demos: for HandwiredOS windows, "a test can compare stored and
  drawn rectangles with a plain JavaScript reference over random viewports"
  (R:docs/behavior-choices.md#L118; verbatim, corrected in fact-check).

### 5.6 The spring numbers the tutorial states, re-computed

Tutorial: "Released from rest 20 px from its destination, a spring with stiffness 650 and damping
45 peaks at 207 px/s, about 10 × the travel, and overshoots by 0.009 px" (R:docs/tutorial.md#L55).
Re-computed 2026-10-27 with plain float64 arithmetic mirroring the reference's step (no repo code):

```
node -e 'let x=-20,v=0,peak=0,over=0;const k=650,c=45,h=0.004;
for(let i=0;i<2000;i++){v+=(-k*x-c*v)*h;x+=v*h;peak=Math.max(peak,Math.abs(v));over=Math.max(over,x)}
console.log(peak,over)'
→ peak px/s 207.210, overshoot px 8.904e-3
```

Both match. Ranges follow: ±2 × travel (±40 px) for displacement, ±64 × travel (±1,280 px/s) for
velocity (L55, R:template/toggle.ts#L33-L37).

### 5.7 "A program without state or animation" (R:docs/tutorial.md#L171-L190)

Step by step: (1) declare only input and constant cells; (2) leave out `advanceFrame`, the spring
matrix, settle check and snap cells and `emitAnimatedObject`; (3) call `table.finish()` with no
`table.next`; (4) once per frame in which an input changed (e.g. a `requestAnimationFrame` that
an input event schedules), write inputs, evaluate once, write the DOM; (5) nothing needs writing
back, since an input's next value is itself (but event cells still need resetting to 0); (6) to
skip `createEvaluator`'s redundant second check, call `built.validate(source)` and evaluate
output wires alone with `built.circuit.createTensorEvaluator(outputWires)`, whose result array
"the next call overwrites". Example error: `"loadedFiles must be finite and within 0..320, got
321"` (L185). Cost note: the checks "visit every cell twice per evaluation", which doesn't matter
for 20 cells, "while 100,000 cells take about 90 µs per check in Bun" (L145).

### 5.8 "Adding a second switch" (R:docs/tutorial.md#L192-L227)

Step by step: (1) split out `switchCells = {on, armed, thumb}`; (2) `toggleCells` keeps the
viewport, pointer, cancel and spring cells and adds `switches: list(2, () => switchCells)`;
(3) write `buildSwitch(circuit, table, switchWires, page, left, top)` containing the hit test,
selects and spring, ending in its own `table.next(switchWires, ...)`; (4) in `buildToggle`, add
`gap: 16` to `layout` and place switch `index` at `top = viewportHeight/2 − trackHeight − gap/2 +
index × (trackHeight + gap)`; (5) the clock's `active` output is the **sum** of the switches'
exact active bits (JS `some`). What else changes: both thumbs share one `springMatrix` (same
constants); each `emitAnimatedObject` call settles alone; the page gets a second `.track`; the
reference gets a second switch, each thumb settling alone and the clock stopping when both have.
Component rules: cells come first (`table.declare(switchCells, 'extraSwitch')` before
`createCircuit`); a build function declares ranges for the parent's wires first (e.g.
`circuit.assumeRange(host.viewportWidth, 0, 16_384)` in `buildPhotos`,
R:src/handwiredos/photo-gallery.ts#L334), and `assumeRange` throws "when it narrows a wire that
operations already read". Real instance: `photoCells` (R:src/handwiredos/photo-gallery.ts#L114),
`buildPhotos` (L326), declared as `photos: photoCells` in window-manager.ts (L253) with
`table.atMostOne('photos events', ...)` (L416).

### 5.9 "A new app folder" (R:docs/tutorial.md#L229-L239)

Copy `template/` to a sibling at the repo root, e.g. `counter/`, "so that its imports from
`../src/runtime/` still resolve", then register it: tsconfig.json `include` (current list:
`"*.ts", "src/**/*.ts", "tests/**/*.ts", "scripts/*.ts", "template/*.ts",
"lab/ui-exploration/*.ts"`, verified in clone); scripts/check.ts's oxlint command (template is at
R:scripts/check.ts#L21); package.json's `test` script (currently `bun test --timeout 30000 ./tests
./template ./lab`), plus optionally `"start:counter": "bun ./counter/index.html"` next to
`"start:template": "bun ./template/index.html"`. Optional knip coverage: add `counter/main.ts`
and `counter/toggle-reference.ts` to `entry` ("the second because only the test imports it") and
`counter/*.ts` to `project` (template's entries at R:knip.config.ts#L15-L20). Timings stated:
`bunx tsc -p .` "in under a second"; `bun run check` "in about 3 s" (L237). The three demos use a
different layout (src/<demo>/, assets/, tests/<demo>/) (L239).

---

## 6. Verified quotes (verbatim, from the repo at 257856e)

| # | quote | speaker / document | date | source | context |
|---|---|---|---|---|---|
| Q1 | "A numeric program is a fixed list of operations over 32-bit floats, called FP32 here, mostly weighted sums and products with a ReLU." | docs/tutorial.md | at pin | R:docs/tutorial.md#L13 | opening definition |
| Q2 | "You don't write the list itself: you write builder code, i.e. ordinary JavaScript that runs once and appends operations to a `Circuit`, so nothing in the program branches or loops at runtime." | docs/tutorial.md | at pin | R:docs/tutorial.md#L13 | |
| Q3 | "No tool converts existing JavaScript source into a program." | docs/README.md | at pin | R:docs/README.md#L3 | contrasts with the README tagline (section 7) |
| Q4 | "Every number the program reads, or keeps from one evaluation to the next, is a cell of the source table." | docs/tutorial.md | at pin | R:docs/tutorial.md#L17 | opens "Cells" |
| Q5 | "A wire is the position of a number, either a cell or the result of an operation." | docs/tutorial.md | at pin | R:docs/tutorial.md#L68 | |
| Q6 | "A range is a promise that builder functions rely on and every evaluation checks." | docs/tutorial.md | at pin | R:docs/tutorial.md#L53 | |
| Q7 | "Building has two phases, since a `Circuit` needs the number of cells before the first operation exists" | docs/tutorial.md | at pin | R:docs/tutorial.md#L57 | sentence continues with a colon |
| Q8 | "`emitSelect(circuit, condition, off, on)` computes both sides and picks one, so an `if` that assigns a cell becomes a select on the cell's next value." | docs/tutorial.md | at pin | R:docs/tutorial.md#L93 | |
| Q9 | "Where JavaScript would reassign a variable, builder code makes a new wire" | docs/tutorial.md | at pin | R:docs/tutorial.md#L93 | sentence continues with `armedAfterDown` |
| Q10 | "A program can't loop a number of times that is only known at runtime" | docs/tutorial.md | at pin | R:docs/tutorial.md#L106 | leads into the spring matrix power |
| Q11 | "Decisions match exactly, since `emitCompare`'s bits equal JavaScript's comparisons for every declared value." | docs/tutorial.md | at pin | R:docs/tutorial.md#L167 | Testing against JavaScript |
| Q12 | "A toggle switch written as one numeric program and checked against the same switch in plain JavaScript, to copy as the start of a new app." | template/README.md | at pin (added 2026-10-15) | R:template/README.md#L3 | |
| Q13 | "Both sides of a select always compute, and width * 2 overflows to Infinity at 3e38." | tests/runtime/cells.test.ts (comment) | at pin | R:tests/runtime/cells.test.ts#L207 | |
| Q14 | "the program and plain JavaScript agree on every frame, and every scripted step takes effect" | test name, template/toggle.test.ts | at pin | R:template/toggle.test.ts#L41 | |
| Q15 | "Those and the tutorial and templates are the entrypoint for ppl when we release." | Cheng Lou, as quoted in commit 259c5d2 (dated there "October 14, 2026"); a longer form, "go. Make sure btw that the docs are without legacy crufts. Those and the tutorial and templates are the entrypoint for ppl when we release.", is quoted in lab/status.md | Oct 2026 | https://github.com/chenglou/handwired/commit/259c5d2 ; R:lab/status.md#L127 | Cheng's informal spelling ("ppl", "crufts") is verbatim; keep it if quoted. Indirect: a quote recorded in the repo, not a published statement |
| Q16 | "Every command and every stated number held." | commit 259c5d2 message | 2026-10-14 | https://github.com/chenglou/handwired/commit/259c5d2 | after a reviewer followed the tutorial from a clean copy; the commit's own claim, not independently re-run here |
| Q17 | "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" | README.md (Cheng's opening) | at pin | B/README.md | see section 7; quoted and verified in dossier the-project-and-its-claim [S1] |

External context quote: "By executing the function with traced values, JAX can determine the
sequence of operations encoded by the function" (JAX docs, "Key concepts", section "Tracing",
https://docs.jax.dev/en/latest/key-concepts.html, fetched 2026-10-27).

No quote in this dossier is unverified; anything attributed to Cheng beyond Q15/Q17 would be
**UNVERIFIED — do not use**.

---

## 7. Debates and controversies

1. **"Turn your regular JavaScript code into a neural net" vs "No tool converts existing
   JavaScript source."** The README tagline (Q17) can be read as an automatic transpiler. The
   docs say the opposite plainly (Q3), and the tutorial's builder code is new code written against
   the `Circuit` API, with the replaced JavaScript kept only in comments ("the comments in
   toggle.ts show the JavaScript that each line replaces", R:docs/tutorial.md#L74). Both are
   sourced; the honest framing is: you *rewrite* the JavaScript, by hand, into builder code that
   appends arithmetic. Not a public dispute, a wording gap the film should resolve on screen.
2. **"Exact" vs "within 1e-5 px."** Decisions (`on`, `armed`, track position) match the float64
   reference exactly; the thumb's position does not, because FP32 spring arithmetic differs from
   float64 by up to 1.3e-6 px here and up to 1.4e-4 px for long travels (R:docs/tutorial.md#L167).
   The film must not say the whole program equals JavaScript bit for bit.
3. **What the type system catches.** Branding refuses a number where a wire is expected, but not a
   wire where a number is expected: `circuit.affine([[cells.viewportWidth, 0.5]],
   cells.viewportHeight)` "adds the height cell's position as a bias" (R:docs/tutorial.md#L70).
   And a folder missing from tsconfig's `include` gets no check at all (L233). A safety design
   with stated holes, documented by the author.
4. **Write-back policy.** The template passes `'events and settle checks'` so stored state doesn't
   depend on frame rate; `advanceFrame`'s default is `'every evaluation'` (R:docs/tutorial.md#L143;
   R:template/toggle.ts#L92). A deliberate choice, explained in behavior-choices.md; belongs to the
   host-loop dossier.
5. **Validation cost.** `createEvaluator`'s full checks scale with cell count (about 90 µs per
   check at 100,000 cells in Bun); the tutorial recommends `createTensorEvaluator` for big hosts
   but keeping `createEvaluator` in tests "since its errors name the cell or the operation that
   broke a declaration" (R:docs/tutorial.md#L145). Trade-off, not controversy.

---

## 8. Misconceptions to avoid

- A **wire is not a physical wire or a connection**; it is an integer index into the array an
  evaluation fills (cells first, then one per operation). A paper-cut "wire" is a fine metaphor
  only if the film also shows the number on its tag.
- **Builder code does not run per frame.** It runs once to build; the per-frame work is
  evaluating the fixed operation list.
- **Not every builder call appends a new operation**: `append` returns an existing wire for an
  identity sum or an identical expression (R:src/runtime/numeric-ui-core.ts#L580-L614).
- **`circuit.constant(614)` is not a `constant` cell.** It has no table position and folds into a
  bias; changing it means rebuilding. A `constant(...)` cell lives in the table and can change
  without rebuilding, e.g. tuned by gradients (R:docs/tutorial.md#L51, L70).
- **The "Bit" declarations are not extra kinds**: `inputBit`/`stateBit` are input/state with
  `exactBit: true`; declaring a bit changes no operation (R:tests/runtime/cells.test.ts#L84-L104).
- **An `if` does not skip work.** Both branches and both hit tests run every evaluation (Q8, L93).
- **`buildProgressBar` and `counter/` do not exist in the repo**; they are tutorial snippets and
  example names. `switchCells`/`buildSwitch` are likewise snippets, not files.
- **The toggle is not in `src/`**; it is `template/` at the repo root, and it is not one of the
  three demos.
- **The reference is not "the same arithmetic"**: it is float64 and never snaps; the test
  tolerates thumb differences below 1e-5 px.
- **Do not state an operation count for the toggle**; none is documented (run it first, 5.4).
- **Do not say the tutorial uses `circuit.select` directly**; it uses `emitSelect`, which wraps it.
- Repo naming: before 2026-10-06 the project was "Indirect" and the desktop "IndirectOS"; commit
  7452dd9 uses the old name. Use "HandwiredOS" in narration.

---

## 9. Curiosity hooks

1. **The whole toggle is 20 numbers.** Viewport, two pointer events, a cancel, two bits of state,
   four spring-matrix entries, two host bits and three thumb numbers (5.1; R:docs/tutorial.md#L145).
2. **An `if` becomes arithmetic that does both.** `if (up && armed && insideTrack(up)) on = !on`
   becomes `flip × (1 − on) + (1 − flip) × on`, and the hit test for the release runs even when
   nobody touched the screen (R:docs/tutorial.md#L93).
3. **"All of these are true" is one ReLU:** `max(0, sum of bits − (count − 1))`
   (R:template/toggle.ts#L48-L49).
4. **A press 1/64 px left of the track does nothing, and the test checks exactly that**, because
   an inexact decision "shows there first" (R:template/toggle.test.ts#L28; R:docs/tutorial.md#L169).
5. **A pointer at 640.001 px is refused**: the host must round to the 1/64 px grid, and the
   evaluator throws `down.x must be a multiple of 0.015625` (R:template/toggle.test.ts#L65-L69).
6. **The type trap the tutorial warns about is concrete in the toggle**: in toggle.ts's cell order,
   position 3 is `down.x` itself (derived, 5.1), so the untyped mistake
   `emitCompare(circuit, cells.down.x, '>=', 3)` that the tutorial describes (L233) would compare
   the pointer with itself. Mark as derived if narrated.
7. **The cells refactor shrank code**: IndirectOS's source-table validation went "from 257 lines to
   9" and window-manager.ts "from 2,180 to 1,759 lines", while every compiled program stayed
   identical (3,654 operations in 124 layers) (commit 7452dd9).
8. **A tiny data-layout change, an 11× speedup**: storing grid steps in typed arrays stopped V8
   deoptimizing the validator, from 85 µs to 7.3 µs per hover frame in Chrome (commit 7c1018d;
   comment at R:src/runtime/cells.ts#L355-L357).
9. **The tutorial was tested on strangers**: one reviewer built the second switch from the text,
   and their reference "passed its test against the program at the first run" (commit 259c5d2).
10. **The spring numbers in the prose check out**: 207 px/s peak and 0.009 px overshoot, re-computed
    independently (5.6).

---

## 10. Visual and dramatic details

- **The source table as an object**: a horizontal paper strip of 20 numbered pigeonholes (0-19),
  grouped by kind with distinct cut-out shapes: inputs (written by a hand from outside the
  frame), event bits (small flags that pop up to 1 and fall back to 0), state (cards the program
  replaces), the 4-slot spring-matrix rack. Initial values: 1280 and 800 in slots 0-1, zeros
  elsewhere.
- **A wire as a numbered tag on a string**: positions 0-19 are cells; tags 20, 21, ... are results
  appended one by one to the end of a growing paper ribbon (`circuit.operations`). Each new tag is
  pinned one layer to the right of its deepest input (depth rule, R:src/runtime/numeric-ui-core.ts#L616-L618).
- **Two phases as two stage acts**: Act 1, the rack is built and nailed shut (`createCircuit`;
  any late card is refused with "declare every cell before createCircuit"); Act 2, the ribbon of
  operations is strung; curtain: `finish()` checks every state slot has exactly one string back.
- **The toggle itself** (R:template/index.html#L9-L14): page background `#f5f5f7`; track 52 × 32
  px, radius 16, color mixing gray `#d1d1d6` toward green `#34c759` by `--fill`, dimming 10% when
  armed (`brightness(1 − armed × 0.1)`); a white 24 × 24 thumb with radius 12 and a soft shadow,
  inset 4 px, travelling 20 px. In a 1280 × 800 window the track sits at x 614-666, y 384-416.
  In silhouette, render it as a cut-out rocker in a backlit slot, the thumb on a spring.
- **Reference vs circuit**: two machines side by side on one stage, a plain clockwork (float64
  JavaScript) and the paper-cut circuit, fed the same scripted card of events every 16 ms; a
  judge's needle compares `on`/`armed` (must align exactly) and a magnifier reads the thumb gap
  (under 1e-5 px). End card: "38 frames moving; rests at 20".
- **Edge presses**: a fingertip landing exactly on the track's left edge, then 1/64 px outside it,
  shown on a magnified 1/64 grid with D = 0 and D = −1 marked.
- **Two switches**: the same cut-out rocker duplicated, stacked 16 px apart, both thumbs pulled by
  one shared spring-matrix rack; one settles while the other still moves.
- **New app folder**: a hand copying the template folder and pinning three registration slips:
  tsconfig, check, test.
- Period details: Bun, TypeScript, `bun test`; the repo is tested with Bun 1.4.3
  (R:docs/README.md#L25). No physical rooms are described in the repo; invent no workplace.

---

## 11. Sources

1. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/tutorial.md (L3-L243; sections: Cells L15, Builder code L72, The host loop L108, DOM writes L149, Testing against JavaScript L163, A program without state or animation L171, Adding a second switch L192, A new app folder L229, More L241)
2. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/cells.ts (L1-L384)
3. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/tests/runtime/cells.test.ts (L1-L321)
4. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/numeric-ui-core.ts (L6-L28 Wire/Terms; L237 Circuit; L286-L470 declarations and builder methods; L557-L647 append; L757 createTensorEvaluator; L1966 emitSelect; L2000-L2017 emitCompare; L2610 emitAnimatedObject)
5. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/README.md
6. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/toggle.ts
7. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/toggle-reference.ts
8. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/toggle.test.ts
9. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/main.ts
10. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/index.html
11. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/README.md (L3, L13-L21, L25-L37)
12. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/expressions.md#L25 (Decision bits)
13. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/host-timing.ts#L20-L39 (defaultSpringClockConfig: timeGrid 64, stepMs 4, maxStepsPerFrame 300, settleCheckSteps 16)
14. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/handwiredos/photo-gallery.ts (L114, L326, L334)
15. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/handwiredos/window-manager.ts (L253, L416)
16. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/behavior-choices.md#L118-L122
17. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/status.md (L127, L287)
18. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/package.json ; .../tsconfig.json ; .../scripts/check.ts#L21 ; .../knip.config.ts#L15-L20
19. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/README.md
20. https://github.com/chenglou/handwired/commit/7452dd90c12a1faf36c73f083316e4403fbbc294 (2026-09-15)
21. https://github.com/chenglou/handwired/commit/62417d1 (2026-09-15)
22. https://github.com/chenglou/handwired/commit/bf719fa (2026-09-17)
23. https://github.com/chenglou/handwired/commit/b02baf8 (2026-09-17)
24. https://github.com/chenglou/handwired/commit/7c1018d (2026-09-17)
25. https://github.com/chenglou/handwired/commit/259c5d2 (2026-10-14)
26. https://github.com/chenglou/handwired/commit/4ea7fcb (2026-10-15)
27. https://github.com/chenglou/handwired/commit/257856e3b221140acb4cc4460626b850c0bd4ff1 (pin, 2026-10-16)
28. https://dblp.org/pid/40/4856 (McKeeman, "Differential testing for software", Digit. Tech. J. 10(1):100-107, 1998)
29. https://patents.google.com/patent/US5754860 (DEC differential-testing patent, McKeeman, Reinig, Payne; granted 1998-05-19)
30. https://docs.jax.dev/en/latest/key-concepts.html (JAX "Tracing" and "Jaxprs", fetched 2026-10-27)
31. Run record: `node -e` spring re-computation (5.6), 2026-10-27, output `207.210`, `8.904e-3`.
32. Run record (not executed; blocked by sandbox): `bun test template`, `bun test tests/runtime/cells.test.ts`. Re-run before on-screen pass counts.

---

## Fact-check log (adversarial pass, 2026-10-27)

Method: every cited file re-read at `257856e` in the local clone (`git log -1` = 257856e3b221…,
author date 2026-10-16 17:33:49 -0700); `git show -s` for every commit cited; `git log
4ea7fcb..257856e -- template docs src/runtime` is empty (those paths unchanged since 4ea7fcb).
Repo code was again **not executed** (running `bun test` was refused in this session too); the
spring numbers were re-computed with standalone `node -e` arithmetic (no repo imports):
`207.210 8.904e-3`. Web checks: GitHub commit pages 7452dd9 and 259c5d2 (messages match the clone
verbatim); docs/tutorial.md at the pin on GitHub (L53, L145, L167 sentences match verbatim); JAX
key-concepts page (both quoted fragments match); dblp / Google Patents for McKeeman.

Changes made:

1. **Corrected (section 1): "Every builder method ends in `Circuit.append`, which pushes one
   Operation."** `indexRead` → `indexReadAffine` pushes its own `'index'` operation and never calls
   `append` (`append`'s `kind: Exclude<AtomKind, 'index'>`, R:src/runtime/numeric-ui-core.ts#L557-L558,
   L467-L555); `multiply` with unknown signs appends 3 operations (L430-L432) and `select` up to 4
   (L435-L443). Text now lists the methods that end in `append` and states both caveats.
2. **Corrected (Timeline): order of the first two commits.** `git log --reverse` gives `3d2c717`
   "Create numeric UI atom lab" (2026-06-03 20:24 -0700) before `592f296` "Set up minimal Bun
   TypeScript project" (20:38 -0700).
3. **Corrected (5.5): a paraphrase in quotation marks.** behavior-choices.md L118 reads "a test can
   compare stored and drawn rectangles with a plain JavaScript reference over random viewports",
   not "stored and drawn rectangles equal a plain JavaScript reference". Replaced with verbatim text.
4. **Clarified (section 1): what `createCircuit` declares.** One-hot groups are declared to the
   circuit only when `declareToCircuit` (default true); `table.atMostOne` rules are validator-only
   (R:src/runtime/cells.ts#L167-L173, L191-L193).

Confirmed without change (all at the pin unless noted): Q1-Q17 verbatim; tutorial L13, L17, L53,
L55, L57, L68, L70, L74, L93, L106, L145, L165, L167, L169, L173-L190, L192-L227, L231-L239;
docs/README.md L3, L15-L21, L25; template/README.md L3; cells.ts L27-L99 (six declarations, four
policies), L125-L239 (two phases, `finish()` returns `{circuit, nextSource, initialSource,
validate}`); numeric-ui-core.ts L6-L19 (branded `Wire`), method lines (L237, L286, L324, L347,
L368, L385, L399-L470, L557, L580-L581, L611-L619, L757, L796, L1966, L2004-L2012, L2017, L2610);
toggle.ts (20 cells, layout and spring constants), toggle-reference.ts (4 ms, 64 ms, down/up/cancel,
never snaps, ~1,140 ms), toggle.test.ts L9, L28-L30, L58-L62, L65-L69; cells.test.ts (15 tests,
error strings L135-L143, L207 comment, L304-L321 component); photo-gallery.ts L114/L326/L334;
window-manager.ts L253/L416; tsconfig include, scripts/check.ts L21, package.json test script,
knip.config.ts L15-L20; lab/status.md L127 and L287; commit messages and dates of 7452dd9 (file
sizes 380/256 lines, "257 lines to 9", "3,654 operations in 124 layers", "12,043 lab
fingerprints"), 62417d1, bf719fa, b02baf8, 7c1018d, 259c5d2 (Cheng quote dated "October 14, 2026";
"passed its test against the program at the first run"), 4ea7fcb (four readers, template README);
825 commits all by Cheng Lou; Co-Authored-By trailers on 7452dd9, 259c5d2, 4ea7fcb. External:
McKeeman, Digital Technical Journal 10(1):100-107 (1998) (https://dblp.org/pid/40/4856);
US 5,754,860, McKeeman, Reinig, Payne, DEC, filed 1996-07-23, granted 1998-05-19
(https://patents.google.com/patent/US5754860); JAX quotes
(https://docs.jax.dev/en/latest/key-concepts.html).

Notes for the script: the "257 lines to 9" figure sits in the commit's "IndirectOS and Photos"
bullet, so "IndirectOS's source-table validation" is a fair reading but not the commit's exact
subject; say "source-table validation" if in doubt. Still unmeasured: the toggle's operation count
and any `bun test` pass count (run before showing on screen).
