# Dossier: One Big Matmul — Compilation, Layers, Fusion, Sparsity and the CPU / WebGPU Backends

- Topic id: `compilation-matmul-backends`
- Subject pinned at: `chenglou/handwired@257856e` (257856e3b221140acb4cc4460626b850c0bd4ff1, committed 2026-10-16 17:33 -0700). Local clone `.orly-work/repos/handwired`, 825 commits on main (the same count GitHub shows).
- As-of date: 2026-10-27
- Citation style: a repo path with line numbers at the pinned commit, e.g. `chenglou/handwired@257856e:docs/execution-model.md#L38-L50`, resolvable as `https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L38-L50`. Numbers marked **[RUN 2026-10-27]** come from commands this researcher ran in the clone; the command and output are recorded in section 5.

---

## 1. Summary

The README's pitch is that Handwired "collect[s] the + and * and relu into a giant matmul, and either run[s] it on JS or WebGPU". The code at 257856e does something more precise than that, and in one way more modest:

1. **Builder code appends instructions** to a `Circuit`. There are four: `affine`, `reglu`, `boolean` and `index`. Each instruction appends one number after the source cells, and it may read only sources and earlier instructions.
2. **Compilation (`compileTensorProgram`) makes layers, not one matrix.** "Independent instructions at the same dependency depth share a layer." An instruction's layer is its build-time depth: one more than the depth of the deepest wire it reads. Each layer is a **sparse matrix stored in CSR form** (`rowOffsets`, `columns`, `weights`) plus a bias. Running a layer takes these steps:
   - gather the layer's inputs;
   - do one sparse matrix-vector product with the bias added;
   - apply gather reads and index reads;
   - multiply the ReGLU rows by `max(0, gate)`;
   - round the boolean rows;
   - append the outputs.

   Compilation also **removes dead operations** (those that cannot reach a requested root) and **may reorder values in packed storage** (`wireOrder`).
3. **HandwiredOS today [RUN 2026-10-27]:**
   - 234 source cells and 727 roots;
   - 5,028 built operations, of which 4,646 are live;
   - 130 layers and 9,909 stored weights.

   By kind, the live operations are 1,811 sums, 2,776 ReGLU and 59 boolean, with no gather reads or index reads. The cells, live operations, layers and weights match the HandwiredOS README (L13) and the live demo site's stat panel (weights 9,909 · layers 130 · training 0; `assets/demos.html#L142-L144`). The 727 roots, the per-kind split and the byte size come only from this dossier's probe and were not reproduced by the fact-check (see Fact-check log). One evaluation takes about 41–44 µs on the reusable CPU evaluator, against 162–167 µs for the literal reference evaluator. That run was in Bun 1.4.3 on an Apple M4 Max at load average ~10.
4. **Size history.** HandwiredOS was "5,253 operations in 192 layers" on 2026-09-14. On 2026-10-13 it peaked at 21,229 live operations in 230 layers, when Notes' text layout and the Files window were inside the program. The same day, merging Files into Monitor brought it to 19,851 in 217 layers, and that evening the text layout left the program (Notes became a native `<textarea>`): 4,251 live operations in 123 layers, 8,959 weights. On 2026-10-14 Monitor's 64-slot row rule added 3 operations: 4,254 in 123 layers, 8,965 weights. It then grew to 4,646 in 130 (status L167: "4,646 since October 14").
5. **Backends.** "All of src/runtime's execution is JavaScript on the CPU. 'Tensor' in its names means a program packed into layers of sparse matrices, not a GPU." HandwiredOS, the learned gallery and the template all run on the CPU. **Only src/json-search uses WebGPU**: `navigator.gpu` appears only in `src/json-search/demo.ts` and `src/json-search/gpu/host.ts`. Even there, the GPU does not run "one big matmul". The program is a *loop program*: a small compiled step, written once into a WGSL `for` loop over a document's 512 positions. One thread runs per document. Two code writers exist:
   - `loop-emit.ts` writes one f32 statement per operation;
   - `bit-emit.ts` rewrites provably-integer or provably-bit values as `i32` or as bits of `u32` words.
6. **The README's GPU-technique claim, checked against the code:**
   - **Sparsity:** implemented. The CPU executor stores each layer as CSR. HandwiredOS stores 9,909 weights where dense per-layer matrices would need 623,442 entries, about 1.6% (derived [RUN]).
   - **Fusion:** partly implemented. The builder copies small affine sums into their readers. A ReGLU's left and gate rows come out of the same sparse product. json-search compiles a whole per-position step into one shader loop. A backend may fuse sums *except at recorded rounding points*.
   - **Reordering:** the compiler reorders packed storage. The rounding-point records state where a backend may reorder sums. Layer scheduling is **parked**, and `recomputeDepths` is off by default.
   - **GPU execution of HandwiredOS:** an experiment only. On 2026-09-16 one HandwiredOS evaluation took 2.2 ms on WebGPU against 81 µs on the CPU. The 6.4 MB single shader did not finish compiling in Metal in 28 minutes. The run used scratch files outside the repo.
7. **Buffer lifetime.** `evaluateReference` and `evaluateTensor` return fresh full arrays. `createTensorEvaluator(roots)` reuses its work buffers and returns only the roots, in an array that the next call overwrites ("Copy it when retaining a frame").

---

## 2. Timeline

| Date | Event | Source |
|---|---|---|
| 2026-06-03 | First commit of the repo (`3d2c717`). | `git log --reverse` in the clone; https://github.com/chenglou/handwired |
| 2026-09-14 | Cheng picks the recommended option for runtime decisions 1–3. "Every existing circuit compiled to the same program with the same values, e.g. HandwiredOS stayed at 5,253 operations in 192 layers until the changes below." | [S3] `lab/status.md#L7` |
| 2026-09-15 | Layer scheduling moved from the README TODO to the parked list: "latest-legal scheduling increased gathered inputs." | [S3] `lab/status.md#L256` |
| 2026-09-16 | **HandwiredOS on WebGPU.** Scratch files, headless Chrome 153 through Metal, Bun 1.4.0, Apple M5 Max:<br>• one evaluation took 2.2 ms on WebGPU (compute pass alone about 1.9 ms), against 81 µs in Bun and about 140 µs in Chrome on the CPU;<br>• all 177,154 outputs of 202 recorded tables matched;<br>• the result arrived 5–7 ms after the frame callback started;<br>• the 6.4 MB shader did not finish compiling in 28 minutes, and split into 24 shaders it compiled in 8.1 s. | [S3] `lab/status.md#L38-L40` |
| 2026-09-16 | Same day, from the real page: dragging Files over Notes kept the main thread busy about 2.0 ms of each 16.7 ms frame. `machine.step` took 1.1 ms of that and the program about 0.75 ms. No frame was dropped. | [S3] `lab/status.md#L40` |
| 2026-09-17 | Engineering guide pass. One change made `compileTensorProgram` allocate one array per compile instead of one per layer: compile 38.54 → 30.71 ms, and a 2.4M-wide probe with 8,000 layers went from 1,123 → 14.4 ms (commit a1b3b7b). | [S3] `lab/status.md#L58` |
| 2026-10-13 | HandwiredOS peak:<br>• 794 source cells, 2,134 roots;<br>• 21,229 live operations (5,786 sums, 60 gather reads, 2,320 index reads, 11,779 ReGLU, 1,284 boolean) in 230 layers;<br>• 46,930 stored weights, from 23,685 built operations;<br>• one evaluation 119–131 µs (Bun 1.4.3). | [S3] `lab/status.md#L22` |
| 2026-10-13 (later) | Files and Monitor merged into one window, so HandwiredOS has three windows: 19,851 live operations in 217 layers, 43,180 weights. That evening Notes became a native `<textarea>` and "the text layout left the program". | [S3] `lab/status.md#L24-L26` |
| 2026-10-14 | After Monitor's 64-slot row rule: 241 source cells, 722 roots, 4,254 live operations (1,670 sums, 2,527 ReGLU, 57 boolean) in 123 layers, 8,965 weights, from 4,630 built. One evaluation alone 25.2–25.3 µs. | [S3] `lab/status.md#L28` |
| 2026-10-14 | `lab/runtime-cost/layers.ts` committed: about 10 µs per 1,000 layers. bit-emit.ts brings a 32-state search of 100,000 docs from 945 ms to 5.2 ms. README "Cleanup" commit `59b12cd` adds the line "existing gpu techniques, such as fusion, sparsity, reordering…". Commit `efed114` adds "5,028 built operations for its 4,646 live ones" to execution-model.md. | [S5] `lab/runtime-cost/README.md#L13`; [S6] `src/json-search/README.md#L185-L189`; `git log -S` in the clone |
| 2026-10-16 | Pinned commit `257856e`. | clone |
| 2026-10-27 | This dossier re-runs `bun lab/runtime-cost/report.ts` and `layers.ts`, and counts HandwiredOS by operation kind. | section 5 |

---

## 3. People

- **Cheng Lou (`chenglou`)**, the author of Handwired, owner of https://github.com/chenglou/handwired, and host of the demo site https://chenglou.me/handwired/.
  - **What the repo records:** lab/status.md shows him making the project's decisions ("Cheng chose the recommended option for three runtime questions", L7). He also asks the questions the lab answers: "Cheng asked whether pretext's layout, with lots of paragraphs, is faster on the GPU than on the CPU" (L239), and lab/json-search's "Is the GPU clearly faster?" is "The short answer to Cheng's question".
  - **What he believed:** the README's own framing is that the GPU path is "for fun" and that GPU techniques "have a great time optimizing such minimal primitives" (README L26, L31).
  - **Depiction:** the brief forbids invented biography, so no physical description is sourced here. Recommendation for the art department: do not attempt a likeness. If a figure is needed, use a generic, anonymous silhouette at a desk with a laptop (contemporary 2026 clothing). Better, show only hands and screens.
- **"Agents"**: the docs refer to agents copying guide examples ("agents copy it", status L176). The repo does not say who or what these are in detail. Do not personify.

---

## 4. The belief of the age

This topic covers a 2026 codebase, so "belief" here means the project's own working assumptions, and how its measurements revised them.

- **The pitch (README, Oct 2026):** program → "a giant matmul", run "on JS or WebGPU, for fun". Because of the minimal primitives, "existing gpu techniques, such as fusion, sparsity, reordering, have a great time optimizing" it.
- **What the lab found:** a GPU does not speed up one program run once. In the docs' words: "One table of a program with nothing repeated doesn't get faster: one evaluation of HandwiredOS took about 2 ms on WebGPU … and takes under 0.1 ms on the CPU executor." [S2 `docs/patterns.md#L58`]
  - The GPU wins when **one program runs over many source tables that stay on the GPU**: 100,000 JSON documents, about 5 ms on the GPU against 13–14 s on the CPU as generated JS (patterns.md L58). The 13–14 s is the smallest search program (patterns up to 8 states); lab/json-search says a 17–32-state pattern takes about 3 minutes as generated JS and an 8-state one 3.2 minutes on the executor [S9 L118].
  - The GPU also wins on **tree-shaped programs**, where each level is one dispatch.
- **Depth is a floor:** "A backend that runs one large kernel per layer can't run fewer kernels than the program's longest chain of gates … HandwiredOS's program has 130 layers, and its longest chain of ReGLU and boolean operations is 71." [S2 `docs/patterns.md#L57`]
- **The CPU's time follows operations more than layers:** "about 10 µs per 1,000 layers", and "removing operations by adding layers doesn't always save time." [S2 `docs/patterns.md#L7`]
- **Who dissents?** Nobody in the repo. The open question is decision 6, "Whether to optimize depth now". The recommendation is "to measure one per-layer GPU pass first, and meanwhile accept only changes that remove layers while adding few operations." [S3 `lab/status.md#L185`]

---

## 5. Experiments and results

### 5a. `bun lab/runtime-cost/report.ts` [RUN 2026-10-27]

- **Machine:** Apple M4 Max (`sysctl machdep.cpu.brand_string`). Note that the author's docs use an **Apple M5 Max**.
- **Software and load:** Bun 1.4.3, load average 10.5–10.75 (busy machine).
- **Command, from the clone root:** `bun lab/runtime-cost/report.ts`. Wall time about 2.1 s.
- **What it measures** (per its README):
  - the median of seven samples, with method order rotated and each method warmed;
  - checksums must agree across all methods;
  - "steady-state CPU execution on an unchanged input, not event processing, GPU execution, compilation, or a browser frame benchmark";
  - three circuits in one process, which can distort later timings. The README warns about polymorphic typed-array reads.
- **The four methods:**
  - **direct scalar JS:** only for the 2-operation coordinate transform;
  - **reference:** `evaluateReference`, the literal per-instruction evaluator;
  - **tensor full array:** `evaluateTensor`, which returns every wire;
  - **tensor reusable roots:** `createTensorEvaluator(roots)`, which reuses buffers and returns only the roots.

Fact-check status: not reproduced by the fact-check (execution not permitted); the machine (Apple M4 Max) is confirmed by `sysctl`. Treat these timings as this dossier's single-session record.

First run (full JSON excerpt):

| circuit | sources | built ops | live ops | layers | stored weights | roots | iterations | direct JS µs | reference µs | tensor full µs | tensor reusable µs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| coordinate transform | 3 | 4 | 4 | 3 | 8 | 1 | 100,000 | 0.034 | 0.117 | 0.163 | 0.111 |
| candidate gallery | 27 | 463 | 417 | 60 | 848 | 87 | 2,000 | — | 19.21 | 4.26 | 3.07 |
| window manager (= HandwiredOS) | 234 | 5,028 | 4,646 | 130 | 9,909 | 727 | 500 | — | 162.07 | 48.22 | 40.92 |

Two more runs, same session (µs):

- **coordinate transform:**
  - direct 0.027 / 0.030
  - reference 0.089 / 0.099
  - full 0.116 / 0.125
  - reusable 0.076 / 0.078
- **candidate gallery:**
  - reference 19.45 / 19.00
  - full 4.62 / 4.56
  - reusable 3.15 / 3.15
- **window manager:**
  - reference 163.22 / 167.36
  - full 56.93 / 52.08
  - reusable 42.13 / 44.20

What the runs show:

- **Speedup of the layered executor over the reference evaluator, on HandwiredOS:** about 3.7–4× (162–167 µs → 41–44 µs).
- **For a 2-op program, the tensor machinery costs more than it saves:** full-array tensor (0.12–0.16 µs) is slower than the reference (0.09–0.12 µs). Plain JS is about 3–4× faster than any of them.
- The "window manager" entry *is* HandwiredOS: the HandwiredOS README says to run `bun lab/runtime-cost/report.ts` for "the program's current sizes and µs per evaluation in Bun, in the entry named 'window manager'" [S7 `src/handwiredos/README.md#L10`].

Comparable author numbers, M5 Max:

| Date | HandwiredOS size | One evaluation |
|---|---|---|
| 2026-10-14 | 4,254 live | 25.2–25.3 µs |
| 2026-10-13 | 4,251 live | about 25 µs |
| 2026-09-16 | — | 81 µs (Bun, CPU) |

Sources: [S3] L28, L167, L38. The faster 25 µs figures came on a different chip at load ~4. Do not compare the 41 µs and 25 µs figures directly. The docs themselves warn: "only times measured together compare" (status L22).

### 5b. `bun lab/runtime-cost/layers.ts` [RUN 2026-10-27, same machine]

```
16384 operations in 64 layers: 64.5 µs per evaluation, median of 9 (57.8 to 87.5)
16384 operations in 1024 layers: 72.1 µs per evaluation, median of 9 (68.6 to 102.2)
16384 operations in 16384 layers: 218.1 µs per evaluation, median of 9 (206.1 to 329.5)
```

The author's figures, M5 Max at load ~4, were 54–55, 64–65 and 210–214 µs: "about 10 µs per 1,000 layers" [S5 `lab/runtime-cost/README.md#L13`; S2 `docs/patterns.md#L7`]. This run reproduces the slope: (218 − 64.5) / 16,320 layers ≈ 9.4 µs per 1,000 layers.

### 5c. HandwiredOS by operation kind [RUN 2026-10-27]

- **Method:** a read-only scratch probe, kept outside the repo, that calls the following and prints counts:
  - `createWindowManagerMachine()` from `src/handwiredos/window-manager.ts`;
  - `measureProgram` from `src/handwiredos/monitor-footer.ts`, the same function Monitor's footer uses;
  - `circuit.roundingPoints()`.
- **Fact-check status:** the fact-check could not re-run this probe (code execution was not permitted). Cells 234, built 5,028, live 4,646, layers 130, weights 9,909 and the rounding-point counts are confirmed by the docs; roots 727, the per-kind split, widest layer and 114,476 bytes rest on this probe alone (internally consistent: 1,811 + 2,776 + 59 = 4,646; 59 boolean ops = 59 boolean atoms).
- **Result:**

| Measure | Value |
|---|---|
| Build time | 23–24 ms |
| Source cells | 234 |
| Built operations | 5,028 |
| Live operations | 4,646 |
| Layers | 130 |
| Roots | 727 |
| ReGLU | 2,776 |
| Boolean | 59 |
| Gather reads | 0 |
| Index reads | 0 |
| Sums (affine) | 1,811 |
| Widest layer | 401 outputs |
| Stored weights | 9,909 |
| Program size | 114,476 bytes |
| Rounding points | 707 integer bit, 59 boolean, 33 marked |

- **Agreement with the docs:** the rounding-point counts match execution-model.md L164 exactly: "HandwiredOS records 59 boolean atoms, 707 integer bit operations and 33 marked operations".
- **Sparsity (derived):**
  - The 130 layers would hold Σ inputSize × (outputSize + gateRows) = **623,442** dense entries.
  - The program stores **9,909** weights, about **1.6%**.
  - The sparse matrices have 7,422 rows: 4,646 outputs plus 2,776 gate rows.
  - A single dense square over every live value would be (234 + 4,646)² ≈ 23.8 million entries. Use this only as an illustration, and label it as derived.

### 5d. The CPU executor, as code (for the "matmul loom" machine)

`executeTensorProgram` [S8 `src/runtime/numeric-ui-core.ts#L1733-L1775`] does the following:

1. Copies the source table into `packedValues`.
2. For each layer:
   - copies the layer's `inputIndices` into `input`;
   - calls `sparseMatmulAddBias`;
   - applies gathers and index reads;
   - for each gate row: `projection[row] = fround(projection[row] * max(0, projection[outputSize + gateRow]))`;
   - rounds the boolean rows;
   - appends the outputs after the values already computed.

`sparseMatmulAddBias` [S8 L1870-L1884] starts each row from its bias and adds `fround(weight * input[column])` term by term, rounding after every addition. That is CSR order, exactly the reference's FP32 order.

### 5e. HandwiredOS on WebGPU (2026-09-16)

- **Setup:** headless Chrome 153 through Metal, Bun 1.4.0, Apple M5 Max, load average 4–6.
- **Time:**
  - **2.2 ms on WebGPU** (compute pass about 1.9 ms), against 81 µs on the CPU in Bun and about 140 µs in Chrome;
  - the reason given: "one table's statements run one after another in a shader".
- **Correctness:** with codegen's guards against Metal regrouping sums, all **177,154 outputs of 202 recorded tables matched** the CPU.
- **Latency:** the result arrived 5–7 ms after the frame callback, so it could only be drawn a frame later.
- **Shader compile:** the **6.4 MB shader** did not compile in 28 minutes; **split into 24 shaders** it compiled in **8.1 s**.
- **Batching:** many independent tables win from about 16–28 tables, e.g. 4.8 ms against 335 ms at 4,096 tables. A frame's 1–5 evaluations, though, each read the state the previous one wrote, so they can't be batched.
- **Caveat:** "These numbers predate the engineering guide pass … and they weren't measured again."

[S3 `lab/status.md#L38-L40`]

### 5f. JSON search on WebGPU (the one production GPU backend)

Setup:

- **Documents:** 100,000 generated JSON documents, each 512 code points + length = 513 float32 cells = 2,052 bytes, for 205.2 MB of cells.
- **GPU memory:** 410 MB including display kinds.
- **Loop form:** the step is compiled once and wrapped in a WGSL `for` loop, so "a shader's length is the work of one position, whatever the capacity". The four shaders compile in 0.02–0.05 s each.
- **Without the loop form:** the search at 8 states and 256 positions would be 91,774 statements, taking 107–130 s to compile.

[S6 `src/json-search/README.md#L1`, L104-L126]

Two writers of GPU code:

| The search's shader at 8 / 16 / 32 states | loop-emit.ts | bit-emit.ts |
|---|---|---|
| Statements | 503 / 1,375 / 4,655 | 147 / 171 / 219 |
| One search of 100,000 docs, back to back | 7.8 / 69 / 945 ms | 4.6 / 4.7 / 5.2 ms |
| After a 200 ms pause | 16.5 / 70 / 948 ms | 11.3 / 11.9 / 13.2 ms |

[S6 L185-L189]

Page costs (M5 Max, Chrome 155):

- documents ready 0.54 s after navigation;
- a search 11–15 ms per keystroke;
- RegExp 8–28 ms for ordinary patterns, and 2.1 s for `([a-z]+)+x`;
- on the CPU, a search on the smallest program takes 13 s.

[S6 L53]

Against JS in 8 workers: "no". 8 workers with RegExp take 1.9–6.7 ms, comparable to the GPU's 4.5–5.2 ms back to back; after a pause the GPU's 11–16 ms "is 2 to 8 times as long" (workers were not timed after a pause) [S9 `lab/json-search/README.md#L126`]. So "about even" holds only for back-to-back searches.

### 5g. Big-program compile costs (from the docs)

Bun 1.4.3, Apple M5 Max 36 GB:

- 2,367,454 built operations: built in about 3 s, compiled in 1.3–1.8 s, at 4–5 GB.
- 6.9 million built operations: about 10 s to build, 5.5 s to compile, 9–11 GB.
- `wireOrder.indexOf` per root: 8,001 roots over 400,002 values add about 100 ms.

[S1 `docs/execution-model.md#L48`]

---

## 6. Verified quotes

All quotes are verbatim from the repo at 257856e. The speaker is the repo text (README/docs), written in the project of Cheng Lou. Quote them as "the Handwired README / docs", not as spoken words.

1. "We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun." README.md L26. Also confirmed on https://github.com/chenglou/handwired (fetched 2026-10-27).
2. "existing gpu techniques, such as fusion, sparsity, reordering, have a great time optimizing such minimal primitives". README.md L31. This is a bullet under "Because we basically only use these 2 primitives:".
3. "achieving GPU-level of parallelism with JS code that was written in a traditional single-threaded way (see the JSON search demo that runs in milliseconds over 100k documents)". README.md L36.
4. "Independent instructions at the same dependency depth share a layer." docs/execution-model.md L40.
5. "A layer gathers its earlier inputs, evaluates its sparse affine projection, applies gather reads, index reads, ReGLU gates and boolean rounding, and appends outputs." docs/execution-model.md L40.
6. "Compilation removes operations that cannot reach a requested output and may reorder independent values in packed storage." docs/execution-model.md L44.
7. "HandwiredOS's circuit holds 5,028 built operations for its 4,646 live ones." docs/execution-model.md L46. This is a fragment of the sentence beginning "E.g. `sum = …`".
8. "All of src/runtime's execution is JavaScript on the CPU. "Tensor" in its names means a program packed into layers of sparse matrices, not a GPU." docs/execution-model.md L298.
9. "A compiled program says what each operation computes, and not how a backend has to hold its values." docs/execution-model.md L298.
10. "Copy it when retaining a frame." docs/execution-model.md L294, under Buffer lifetime.
11. "A backend that runs one large kernel per layer can't run fewer kernels than the program's longest chain of gates." docs/patterns.md L57.
12. "Two multiplications in a row can merge into one … but nothing merges across a gate." docs/patterns.md L57. The ellipsis removes a parenthetical link.
13. "HandwiredOS's program has 130 layers, and its longest chain of ReGLU and boolean operations is 71." docs/patterns.md L57.
14. "One table of a program with nothing repeated doesn't get faster" docs/patterns.md L58.
15. "So removing operations by adding layers doesn't always save time." docs/patterns.md L7.
16. "HandwiredOS stayed at 5,253 operations in 192 layers until the changes below." lab/status.md L7, dated September 14, 2026.
17. "HandwiredOS's 6.4 MB shader didn't finish compiling in Metal in 28 minutes" lab/status.md L40.
18. "A GPU is of no use for one document, since a round trip to the GPU alone takes 0.6 ms or more." src/json-search/README.md L3.
19. "The regex matching, JSON parsing & highlighting are all written in JS, then turned into WebGPU kernels for massive parallelism." The demo site, https://chenglou.me/handwired/ (fetched 2026-10-27), whose source is `assets/demos.html#L204` and `assets/json-search.html#L45` at 257856e (`&amp;` in the HTML renders as `&`). Verified verbatim, full sentence, by the fact-check.

UNVERIFIED: none attributed to people. Do not put any of these sentences in Cheng Lou's mouth as speech.

---

## 7. Debates and controversies

- **"Giant matmul" vs. layers.**
  - The README says "a giant matmul".
  - The docs and code say: a stack of **130 sparse matrices**, one per dependency layer, each followed by elementwise gates. "Nothing merges across a gate." [S1 L40; S2 L57]
  - The two are compatible only loosely: the whole program is a sequence of matmul + ReGLU layers.
  - Film framing: "one big matmul, sliced into 130 thin layers".
- **Is the GPU faster?** It depends.
  - **Yes,** for one program over 100,000 documents: about 5 ms against 13–14 s on the CPU as generated JS.
  - **Yes,** for trees with one dispatch per level: Knuth-Plass 0.47 ms on WebGPU against 3.4 ms on the CPU.
  - **No,** for a single HandwiredOS evaluation: 2.2 ms against 81 µs.
  - **No,** against 8 JS workers: about even back to back, and the GPU 2–8× slower after a keystroke pause [S9 L126].
  - **No,** for small batches: under about 1,000 documents, JS wins for the highlighter.
  - Sources: [S2 L57-L59; S3 L38-L40; S9 L118-L126].
- **Fusion and reordering vs. exactness.** Reordering FP32 sums changes results. So the builder records **rounding points**:
  - boolean atoms;
  - `emitCompare`'s integer bits and sign cascade;
  - marked round chains.

  "A backend may reorder or fuse every other sum." The rule has an exception: in six of seven UIs measured, strict order mattered only at rounding points, and the gallery's settle test was the exception. [S1 L155-L164; S3 L11; S10 `lab/ui-exploration/README.md#L41`]
- **Depth optimization.** Open decision 6 recommends measuring a per-layer GPU pass first. Layer scheduling is parked because "latest-legal scheduling increased gathered inputs" (the parked item names Percepta's mixed-integer formulation as the reference approach; not verified further here). [S3 L185, L256]
- **The codegen emitter gap.** `flattenProgram` in lab/ui-exploration/codegen/codegen.ts ignores index reads. It would silently write those rows as 0. It is not production code, and json-search has its own emitter. [S3 L177]
- **NaN range bug.** Range propagation doesn't track NaN. The probe found 10 source tables over 200 random circuits where the executor and the reference differ. The demos can't reach the case. [S3 L169]

---

## 8. Misconceptions to avoid

1. **"Handwired runs on the GPU."** Only the JSON search demo does. HandwiredOS, the learned gallery (including its training) and the template run in JavaScript on the CPU. "Tensor" in the names does not mean GPU.
2. **"It's literally one matrix."** It is one sparse matmul + gates *per layer*: 130 layers for HandwiredOS, and gates can't be merged across.
3. **"The GPU path runs the layered matrices."** json-search's shaders are *loop programs*, one WGSL statement per operation inside a `for` over positions, one invocation per document. bit-emit.ts even turns values into integers and bit-words. HandwiredOS on WebGPU was a September scratch experiment, outside the repo.
4. **"`circuit.operations.length` is the program size."** It overstates. Count live ops: `program.valueCount - program.sourceSize` (5,028 built vs 4,646 live).
5. **"5,253 operations in 192 layers" is current.** That was 2026-09-14. Today it is 4,646 live in 130 layers. In between it peaked at 21,229 in 230 layers.
6. **Comparing the 41 µs run to the docs' 25 µs.** Different chip (M4 Max vs M5 Max), different load (about 10 vs about 4), and a program that grew 9% since that measurement.
7. **"Fusion, sparsity, reordering are all automatic GPU optimizations Handwired applies."**
   - Sparsity (CSR) is real.
   - Fusion and reordering are partial or permitted-by-contract, not a general GPU optimizer.
   - Layer scheduling is parked; `recomputeDepths` is off by default.
8. **"Agreement with the reference evaluator proves the program is right."** The docs say otherwise: "That the two evaluators agree doesn't show that a program does what the JavaScript it replaces did." [S1 L50]

---

## 9. Curiosity hooks

1. HandwiredOS's desktop **wallpaper is the compiled program itself**. Every stored weight is drawn as one arc, from the value it reads to the operation that reads it: copper for a weight that adds, indigo for one that subtracts. Wider arcs reach back more layers. [S11 `src/handwiredos/wiring.ts#L1-L8`]
2. The 6.4 MB single shader for HandwiredOS **did not finish compiling in 28 minutes**. Cut into 24 pieces, it compiled in 8.1 s. [S3 L40]
3. On the GPU, HandwiredOS was **27 times slower** than on the CPU: 2.2 ms vs 81 µs. A single, unrepeated program gains nothing from parallel hardware. [S3 L40]
4. A program can have 130 layers, but its **longest chain of gates is 71**. That chain, not the layer count, is the floor on GPU kernel launches. [S2 L57]
5. HandwiredOS **shrank by about 80%** in one day, 2026-10-13: 21,229 → 4,251 live ops, 230 → 123 layers (19,851 → 4,251 from the text layout alone, the rest from merging Files into Monitor). The main cause was moving the text layout out of the program into a native `<textarea>`. The next day's row rule made it 4,254. [S3 L22-L28]
6. Rewriting the same search program as bit-words took a 32-state search of 100,000 documents from **945 ms to 5.2 ms**. The weights did not change; the only change was how the backend holds values. [S6 L187-L189]
7. A layer has a cost of its own: **about 10 µs per 1,000 layers** on the CPU. The same 16,384 additions cost 3.4× more when arranged as 16,384 layers instead of 64 (re-run 2026-10-27: 64.5 vs 218.1 µs). [S5; S2 L7; RUN]
8. Of the 623,442 slots that dense per-layer matrices would need, HandwiredOS fills 9,909, **about 1.6%**. [RUN, derived]
9. Monitor's list shows **every live operation's current value**, read from the evaluator's `packedValues` array. The program displays itself while it runs. [S1 L294]
10. Compiling once and building the evaluator from that program avoids **compiling twice**. HandwiredOS does this so Monitor can show the program's counts. [S1 L294]

---

## 10. Visual and dramatic details

- **The matmul loom.** Show 130 thin paper-cut frames standing in a row, one per layer. Threads (weights) run from earlier pegs to each frame's row. Behind each frame, a row of small ramps (the ReGLU gates `max(0, gate)`) and a few detent wheels (the 59 boolean roundings). Only about 1.6% of the possible threads exist, so the loom should look *sparse*, mostly empty air. Copper threads add and indigo threads subtract, taken from the real wallpaper colors in wiring.ts.
- **The "nothing merges across a gate" moment.** Two sheets of weights slide together and fuse, then hit a gate frame and stop dead.
- **Packed storage.** The `packedValues` strip is one long ribbon: 234 source cells first, then each layer's outputs appended. A copy machine stamps 727 roots into a small output tray. Then it overwrites the same tray next frame, the "Copy it when retaining a frame" beat.
- **Dead-code removal.** 5,028 built pegs; 382 drop away because no root reads them (5,028 − 4,646 = 382, derived).
- **The GPU contrast.** One lone traveler (a HandwiredOS frame) walks a 2.2 ms corridor through a huge empty GPU hall. Then 100,000 travelers (documents) pass through the same hall together in about 5 ms. The Metal compiler as a slow press: 28 minutes and not done, then 24 small presses done in 8 s.
- **Real hardware named in the docs:** Apple M5 Max laptop, Bun 1.4.3, Chrome 155 (headless), Metal. This dossier's run: Apple M4 Max. Avoid real Apple logos and branding; show a generic laptop silhouette.
- **On-screen numbers safe to show:** 234 cells · 4,646 live operations · 130 layers · 9,909 weights · 727 roots · about 41–44 µs per evaluation (Bun, M4 Max, 2026-10-27) · 71-gate longest chain · 100,000 documents · 13 ms GPU search line example.

---

## 11. Sources

Repo links resolve at `https://github.com/chenglou/handwired/blob/257856e/<path>#L<a>-L<b>`.

1. [S1] docs/execution-model.md: Compilation L38-L50, Rounding points L155-L164, Buffer lifetime L292-L294, Backends L296-L298. https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md
2. [S2] docs/patterns.md: L5-L7 intro and costs, L42-L59 "When a tree takes less time than the loop". https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L42-L59
3. [S3] lab/status.md: L7, L11, L22-L28, L38-L40 (HandwiredOS on WebGPU, Sept 16, 2026), L58, L165-L177, L185, L256-L259. https://github.com/chenglou/handwired/blob/257856e/lab/status.md
4. [S4] README.md L7-L36. https://github.com/chenglou/handwired/blob/257856e/README.md and https://github.com/chenglou/handwired (fetched 2026-10-27)
5. [S5] lab/runtime-cost/README.md, report.ts, layers.ts. https://github.com/chenglou/handwired/tree/257856e/lab/runtime-cost
6. [S6] src/json-search/README.md: L1-L53, L104-L127, L175-L201. https://github.com/chenglou/handwired/blob/257856e/src/json-search/README.md
7. [S7] src/handwiredos/README.md L3, L10, L13. https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md
8. [S8] src/runtime/numeric-ui-core.ts: TensorLayer/TensorProgram types L167-L190; compileTensorProgram L796-L830; executeTensorProgram L1733-L1775; sparseMatmulAddBias L1870-L1884. https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts
9. [S9] lab/json-search/README.md L114-L128 "Is the GPU clearly faster?". https://github.com/chenglou/handwired/blob/257856e/lab/json-search/README.md#L114-L128
10. [S10] lab/ui-exploration/README.md L41. https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/README.md
11. [S11] src/handwiredos/wiring.ts L1-L12; src/handwiredos/monitor-footer.ts L24-L48 (`measureProgram`). https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/wiring.ts
12. [S12] Demo site: https://chenglou.me/handwired/ (fetched 2026-10-27: stat panel weights 9,909 · layers 130 · training 0, source `assets/demos.html#L142-L144`; JSON search deck sentence, source `assets/demos.html#L204`).
13. [S13] WebGPU specification, W3C Candidate Recommendation Draft, 15 September 2026, background only. https://www.w3.org/TR/webgpu/
14. [RUN] Commands run 2026-10-27 in `.orly-work/repos/handwired` (Bun 1.4.3, Apple M4 Max, load avg about 10.5):
    - `bun lab/runtime-cost/report.ts`, three runs;
    - `bun lab/runtime-cost/layers.ts`;
    - a read-only scratch probe that counts `createWindowManagerMachine().tensorProgram` by kind with `measureProgram` and `roundingPoints()`;
    - `grep -rl navigator.gpu src`, which returns only src/json-search/demo.ts and src/json-search/gpu/host.ts;
    - `git log -S` for the README bullet (commit 59b12cd, 2026-10-14) and the 5,028/4,646 sentence (efed114, 2026-10-14).

---

## Fact-check log (2026-10-27, adversarial pass)

Method: every repo citation was re-opened in `.orly-work/repos/handwired` at 257856e (HEAD verified: 257856e3b2…, 2026-10-16 17:33 -0700, 825 commits, first commit 3d2c717 2026-06-03); commit dates checked with `git log`; `grep -rl navigator.gpu src` re-run; GitHub README, the demo site and the W3C WebGPU spec fetched. Running `bun lab/runtime-cost/report.ts` / `layers.ts` / the probe was **not permitted** in this pass, so [RUN] numbers that the docs don't state are marked unverifiable rather than confirmed.

Changes made:

1. **Size history (Summary 4, Curiosity hook 5): corrected.** The drop to 123 layers happened on the evening of 2026-10-13 (4,251 live, 8,959 weights) when the text layout left the program; 4,254 / 8,965 is 2026-10-14 after Monitor's 64-slot row rule (+3 ops, +6 weights). The window merge (21,229 → 19,851) was a separate step the same day. Sources: `lab/status.md#L22-L28` (https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L22-L28).
2. **JSON search CPU comparison (section 4, 5f, section 7): qualified.** "13–14 s on the CPU as generated JavaScript" (patterns.md L58) is the smallest program; lab/json-search L118 gives 14 s for ≤8 states as generated JS and about 3 minutes for 17–32 states (3.2 minutes on the executor at ≤8 states). src/json-search README L53: "a search on the smallest program takes 13 s". "About even with 8 workers" holds back to back only; after a pause the GPU is "2 to 8 times as long" (lab/json-search L126).
3. **Quote 19: upgraded from near-verbatim to verified, full sentence:** "…then turned into WebGPU kernels for massive parallelism." Source `assets/demos.html#L204`, `assets/json-search.html#L45`.
4. **Demo-site "9,909 weights, 130 layers and 0 training": not a verbatim string.** It is a stat panel (`<dt>weights</dt> 9,909`, `layers 130`, `training 0`, `assets/demos.html#L142-L144`). Rewritten as a stat display; do not put it on screen in quotation marks.
5. **Citation line numbers: corrected.** The layers.ts update is `lab/runtime-cost/README.md#L13` (not L11; L11 is the polymorphic-reads warning). The big-program build/compile costs are `docs/execution-model.md#L48` (not L46).
6. **[RUN] timings and probe-only counts: marked not reproduced.** 41–44 µs / 162–167 µs (report.ts), 64.5 / 72.1 / 218.1 µs (layers.ts), 727 roots, 1,811 / 2,776 / 59 by kind, 114,476 bytes, 623,442 dense entries / 1.6%: not contradicted, internally consistent, but not independently re-run. Before putting them on screen, re-run `bun lab/runtime-cost/report.ts` and the probe. Machine confirmed Apple M4 Max (`sysctl machdep.cpu.brand_string`).

Confirmed without change (key claims): compilation layering and layer steps (execution-model L40); dead-op removal, wireOrder and the live-op count formula (L44, L46); 234 / 5,028 / 4,646 / 130 / 9,909 (execution-model L46, src/handwiredos/README.md L13); 5,253 ops in 192 layers on 2026-09-14 (status L7); the 2026-10-13 peak 21,229 / 230 / 46,930 (status L22); CPU-only runtime and navigator.gpu only in json-search demo.ts and gpu/host.ts (execution-model L298, grep); CSR layer type and FP32 rounding in `sparseMatmulAddBias` / `executeTensorProgram` (numeric-ui-core.ts L167-L180, L1733-L1775, L1870-L1884); fusion/sparsity/reordering reading (README L31, execution-model L46/L164, status L256, execution-model L42); rounding points 59 / 707 / 33 (execution-model L164); WebGPU 2026-09-16 experiment 2.2 ms vs 81 µs, 6.4 MB shader, 28 min, 24 shaders 8.1 s, 177,154 outputs of 202 tables (status L40); longest gate chain 71 of 130 layers (patterns.md L57); about 10 µs per 1,000 layers and the author's 55 / 65 / 210 µs (patterns.md L7, runtime-cost README L13, commit e012f08 2026-10-14); bit-emit 945 ms → 5.2 ms, 4,655 → 219 statements (src/json-search/README.md L185-L189; bit-emit commit 87b38f5 2026-10-14; note lab/json-search L125 gives 0.87 s for an earlier loop-emit run at 32 states); buffer lifetime (execution-model L294); big-program costs (execution-model L48); wallpaper copper/indigo arcs (src/handwiredos/wiring.ts L1-L8); commits 59b12cd and efed114 both 2026-10-14, a1b3b7b 2026-09-17; README quotes 1–3 verbatim on https://github.com/chenglou/handwired; WebGPU spec CRD dated 15 September 2026 (https://www.w3.org/TR/webgpu/). Quotes 4–18 re-read verbatim against the cited lines.
