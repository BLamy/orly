# Dossier: Deep Dive 2b, Loops as Counts, Trees, Tables and the Same Work on Every Item (docs/patterns.md)

- Topic id: `patterns-loops-as-arithmetic` · era: repo at `257856e` · as-of 2026-10-27
- Primary source: the clone at `.orly-work/repos/handwired`. `git log -1` gives
  `257856e3b221140acb4cc4460626b850c0bd4ff1  Fri Oct 16 17:33:49 2026 -0700`. The commit is dated **2026-10-16**
  (author's time zone). 2026-10-27 is the as-of date, not the commit date (same note as the host-loop dossier).
- Source notation: `R:path#Lx-Ly` =
  `https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/path#Lx-Ly`.
  Line numbers come from `cat -n` on the clone at that commit.
- **Running code.** The sandbox refused `bun test tests/runtime/prefix-networks.test.ts` in the clone (auto-mode
  classifier: "judged this action dangerous"), the same refusal the host-loop dossier hit. So the worked numbers
  come from an **independent port** written for this dossier:
  `films/handwired-explained/research/runs/patterns_port.mjs` (run with
  `node films/handwired-explained/research/runs/patterns_port.mjs`, Node v24.20.0). Its output is saved verbatim at
  `films/handwired-explained/research/runs/patterns_port.out.txt`. The port does not import the repo. Its
  `sklanskyPrefix` and `brentKungPrefix` are line-for-line copies of R:src/runtime/prefix-networks.ts#L12-L44, and
  FP32 is emulated with `Math.fround` after every addition. **It reproduces every number in the patterns.md table
  of networks, plus the 799.300048828125 / 799.2999877929688 FP32 example, exactly.** Operation counts of whole
  circuits (e.g. 7,824 operations in 57 layers) were **not** run here. They come from the docs, which say the
  entries' tests pin them. Before putting a circuit's operation count on screen, run
  `bun test tests/runtime/prefix-networks.test.ts lab/ui-exploration/guide/examples/patterns` in the clone.

---

## 1. Summary

The thesis sentence appears verbatim twice in the repo:
**"The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table,
or the same work on every item."** (R:docs/patterns.md#L3, R:docs/README.md#L9).

`docs/patterns.md` (484 lines) is a catalogue of 18 rewrites. Each one has the same parts: the familiar JavaScript
loop, a **Circuit version**, its **Cost** (operations = total work; layers = the longest chain that must run in
order), **Exact when**, **Don't use it when**, and **Used in / long form / test** (R:docs/patterns.md#L5). The
catalogue falls into four families:

| Family (heading, lines) | Idea | Entries |
|---|---|---|
| **Searching and choosing** (L63-L169) | every item's test runs in the same layers, then *a count* (when the bits read 1…1 0…0) or *a tree* (when they can be in any order) picks one | `findIndex` (flips once) L67; `findIndex` (anywhere) / best score L97; `indexOf`+`lastIndexOf` L123; compare with the selected index L141; build every option, keep the best L155 |
| **Carrying a value from step to step** (L171-L350) | two steps combine into a step of the same kind, so the chain regroups into *a tree* (a prefix network) | running totals L175; a linear step repeated a runtime number of times (spring matrix power) L198; state machine over queued events L215; a loop whose decision needs later input L239; a set of states as a tree of matrix products L277; a stack of one bit per level L303; following links one at a time (pointer jumping) L328 |
| **The same work on every item, then counts and sums** (L352-L436) | no visiting in order; every item computes, e.g., "how many items come before me" | `items.sort(compare)` as ranks L356; `filter(isVisible).slice(0, K)` into K DOM nodes L379; per-item map stages L399; water filling L418 |
| **Work JavaScript does ahead of time** (L438-L473) | *a table*: JavaScript runs the loop when data changes, the program reads one entry | layout function of one runtime number L442; a loop over data that rarely changes L456 |

Two theory sections, **"Why a tree gives the loop's answer"** (L32-L40) and **"When a tree takes less time than the
loop"** (L42-L61), carry the ideas a teenager needs:

1. **Associativity is the licence.** A tree gives the loop's answer when "combining a with b, and then the result with
   c, gives what combining a with the combination of b and c gives" (L34). Choosing a candidate never computes a new
   number, so every grouping returns the same bits. FP32 *sums* round, though, "so the grouping is part of the
   result" (L39). Integers below 2^24 add exactly in any grouping.
2. **A tree trades layers for operations, and the CPU pays for operations.** The table at L46-L50: the loop is
   1,023 combines in 1,023 levels at 1,024 steps; `sklanskyPrefix` 5,120 in 10; `brentKungPrefix` 2,036 in 18.
   "On the CPU executor, the tree takes longer than the loop, with either network" (L54). A GPU, where one level is
   one dispatch, is where the tree can win (L55-L58).

**The prefix-sum constructions are verified from code:** `src/runtime/prefix-networks.ts` contains exactly two
networks, **Sklansky (1960)** (`sklanskyPrefix`, L10-L24) and **Brent-Kung (1982)** (`brentKungPrefix`, L26-L44).
**Not** Kogge-Stone, **not** Hillis-Steele, **not** Ladner-Fischer. Kogge-Stone (1973) is in lab/ only, but in
more than one place [fact-check]: lab example code builds it (`koggeStoneNetwork` in
R:lab/ui-exploration/guide/examples/executor/prefix-sums.ts#L78, used by that folder's executor.test.ts and
report.ts: 9,217 operations in 10 layers at 1,024 rows), lab docs discuss it (chains.md#L103, executor.md#L440,
L485, L489, loops.md#L32), the older index-read prototype used it (chains.md#L103), and lists' README describes an
earlier lists phase that took prefix counts from a Kogge-Stone network (R:lab/ui-exploration/lists/README.md#L219).
It is not in src/ (`git grep -i kogge 257856e -- src` finds nothing). "Ladner" appears once in the repo, as
"Ladner 1975" for the circuit value problem (chains.md#L174), not as Ladner-Fischer's prefix network.

**Sort is verified from code to NOT be a sorting network.** patterns.md's `items.sort(compare)` (L356-L377) is
**ranks by counting**: one `emitCompare` bit per pair, each rank one sum of bits, O(n²) operations in O(1) layers,
4,096 operations in 3 layers at 64 items. A Batcher-style sorting network (bitonic / odd-even merge, Batcher 1968)
appears only as the measured *alternative* for "well over a hundred items" (L376), in the lab guide
(R:lab/ui-exploration/guide/sections/loops.md#L183-L192). No code at 257856e builds one (`git grep -i bitonic`
finds only docs; see §5.5).

**Filter + slice into K DOM nodes** (L379-L397): every item's visibility bit in the same layers → a **Brent-Kung**
prefix count `visibleThrough` → DOM slot k shows the item where the count first reaches k+1, found either by
**one-hot neighbor differences** (O(n×K): 47,044 operations in 24 layers for 1,000 items into 20 slots) or by a
**binary search** with index reads (O(K log n): 7,824 operations in 57 layers). A slot's **presence bit** is
`[visibleThrough[n−1] >= k+1]`. K is fixed while building. That is the "fixed maximum": past K, items get no node.
docs/behavior-choices.md names the fallbacks that a maximum can have: "snap … carry … split … report … drop …
clamp … or throw" (R:docs/behavior-choices.md#L89). HandwiredOS's Monitor list *reports* with `slotOverflow` and
shows "Only 64 rows are drawn at a time." (R:docs/behavior-choices.md#L87; `slotOverflow` at
R:src/handwiredos/value-list.ts#L434-L435; the string is built at value-list.ts#L664 as
`` `Only ${slotCount} rows are drawn at a time.` `` with `slotCount = 64` at L63, and shown by L753 when
`slotOverflow` is 1) [fact-check].

---

## 2. Timeline (dated events)

Historical framing (only for brief context; the film is about Handwired):

| Date | Event | Sources |
|---|---|---|
| June 1960 | Jack Sklansky publishes "Conditional-Sum Addition Logic", *IRE Transactions on Electronic Computers* EC-9(2):226–231. It computes possible sums for pairs of columns, then groups of four, then eight… The repo names its `sklanskyPrefix` after this ("Sklansky (1960)") and links it to the conditional-sum adder. | [S1] dblp; [S2] UC Davis reading list; [S3] US3553446A; R:src/runtime/prefix-networks.ts#L10; R:lab/ui-exploration/guide/sections/chains.md#L132 |
| Apr 30–May 2, 1968 | K. E. Batcher (Goodyear Aerospace, Akron, Ohio) presents "Sorting Networks and Their Applications", AFIPS Spring Joint Computer Conference, vol. 32, pp. 307–314. It covers bitonic and odd-even merge networks. | [S4] doi 10.1145/1468075.1468121; [S5] Kent State Batcher collection; [S6] Wikipedia Ken Batcher |
| 1973 | Kogge & Stone, "A parallel algorithm for the efficient solution of a general class of recurrence equations", *IEEE Trans. Computers* C-22:786–793. **Not used in src/runtime.** | [S7] Brent's pub060 page (related works); R:lab/ui-exploration/guide/sections/chains.md#L103 |
| 1980 | Ladner & Fischer, "Parallel prefix computation", *J. ACM* 27:831–838. **Not used.** | [S7] |
| June 1979 / March 1982 | Brent (ANU, Canberra) & H. T. Kung (Carnegie-Mellon, Pittsburgh): tech report CMU-CS-79-131 (June 1979), then "A Regular Layout for Parallel Adders", *IEEE Trans. Computers* C-31(3):260–264, March 1982. The abstract argues that chip area and design regularity are a better cost measure than gate count for VLSI. | [S7]; [S8] scan of the IEEE original; [S9] DTIC report; [S10] Wikipedia Brent–Kung adder |
| Dec 1986 | Hillis & Steele, "Data Parallel Algorithms", *CACM* 29(12):1170–1183, doi 10.1145/7902.7903. Its scan is the Kogge-Stone shape on the Connection Machine. **Not used.** | [S11] Wikipedia Prefix sum; [S12] UW scan |
| 1990 | Blelloch's scan. The repo says Brent-Kung has "the same up-sweep and down-sweep shape as Blelloch's scan (1990)". **The 1990 date is the repo's attribution and was not checked externally in this fact-check; if a date goes on screen, cite the repo, not Blelloch.** | R:lab/ui-exploration/guide/sections/chains.md#L103 |
| Nov 2003 | D. Harris, "A taxonomy of parallel prefix networks" (Asilomar). It places Brent-Kung, Sklansky and Kogge-Stone at the three corners of a logic levels / fanout / wiring tracks trade-off. | [S13] IEEE Xplore 1292373; [S14] US7152089 |
| Sept 2026 (inferred from the branch name only; no commit date checked) | Handwired exploration branch `exploration-2026-09`: the runtime notes and outside-techniques notes measure an odd-even merge network (2,172 ops / 63 layers, 64 keys) and a bitonic network with payload (10,624 / 105). | R:lab/ui-exploration/guide/sections/loops.md#L185-L192 (links to branch `exploration-2026-09`) |
| 2026-10-16 | Commit `257856e`, the pinned state of docs/patterns.md and src/runtime/prefix-networks.ts. | `git log -1` in the clone |

---

## 3. People

- **Cheng Lou (`chenglou`)**: author of Handwired (the repo is `github.com/chenglou/handwired`). Per the brief, use
  only what the repo says: no biography, motives or words beyond the docs. patterns.md is written in a plain,
  impersonal register. It does not say "I". Depict him, if at all, as an anonymous programmer's silhouette at a
  desk. **Do not** invent a likeness.
- **Jack Sklansky**: author of the 1960 conditional-sum paper [S1]. A Prabook profile (a **lead, not a reliable
  source**) says: born 1928 in New York City; research engineer at RCA Laboratories, Princeton NJ, 1955–1965;
  professor at UC Irvine 1966–1994, in pattern recognition [S15]. A Cornell lecture names "Jack Sklansky, UC
  Irvine" [S16]. His co-authored book *Pattern Classifiers and Trainable Machines* (Springer, 1981) is confirmed
  by publisher listings [S17]. Appearance: **not verified**. For a 1960 silhouette, use a generic engineer in a
  short-sleeved shirt and tie at a bench, with no claimed likeness.
- **Richard P. Brent** (Department of Computer Science, Australian National University, Canberra) and **H. T. Kung**
  (Department of Computer Science, Carnegie-Mellon University, Pittsburgh): the affiliations are printed on the
  1982 paper [S7][S8] (confirmed in the retyped paper's footnotes [S19]: Brent, Department of Computer Science,
  Australian National University, Canberra; Kung, Department of Computer Science, Carnegie-Mellon University,
  Pittsburgh, PA 15213). Belief: for VLSI, "the chip area and design regularity represent a better measure of cost
  than the conventional gate count" (abstract, verbatim in [S19]). Brent's own page: "At the time of publication the
  use of carry-lookahead in VLSI designs was unpopular." It adds that the technique has since been widely applied in
  VLSI adders [S7] (the first sentence verbatim from the page; the second paraphrased). Appearance: **not verified**. Use generic period
  silhouettes (around 1980, academic).
- **Kenneth E. Batcher** (December 27, 1935 – August 22, 2019, per Wikipedia citing a legacy.com obituary [S6]),
  Goodyear Aerospace Corporation, Akron, Ohio (1968 paper header), later emeritus at Kent State [S5][S6]. Relevant only as a contrast, because Handwired's sort is *not* his network.
- People named only as a contrast (Kogge, Stone, Ladner, Fischer, Hillis, Steele): no depiction is needed.

---

## 4. The belief of the age

There are two "beliefs" here, and the film should keep them apart.

**(a) The circuit-design belief: depth is what you buy.** From the 1960s to the 1980s, adder designers wanted
fewer *logic levels*, i.e. less delay. Sklansky's conditional-sum adder reaches log2 n levels at a cost in logic
and fanout. A patent quotes Sklansky warning that "the maximum fanout is an increasing function of the summand
length" ([S18] via search result; **UNVERIFIED — do not use as a quote**). Brent & Kung (1982) moved the cost
measure to area and regularity and showed n-bit addition "in time proportional to log n and with area proportional
to n" (abstract [S19]; the carry network of their Fig. 5 alone is O(log n) time in O(n log n) area, Theorem 3, and
the O(n) area comes from the pipelined scheme of their §6). Their 16-bit example finishes at time T = 7 [S19].
**[fact-check correction]** The paper does not state the exact counts "2 log2 n − 2 levels, 2n − 2 − log2 n
combines"; those are the repo's counts for its `brentKungPrefix` (prefix-networks.ts#L28-L29) and the usual
textbook counts for the Brent-Kung prefix graph. Harris (2003)
showed that the known networks sit on one trade-off plane of levels, fanout and wiring tracks. Brent-Kung,
Sklansky and Kogge-Stone are its corners [S13][S14]. None of them is "best". Each one buys something.

**(b) The Handwired belief, stated in the repo: on today's CPU executor, the loop usually wins.** This is the
counter-intuitive centre of the deep dive. The trees are there for exactness and GPUs, not for CPU speed:
- "On the CPU executor, an evaluation's time follows its operations more than its layers, which is why several
  entries below say to keep the loop." (R:docs/patterns.md#L7)
- "So removing operations by adding layers doesn't always save time." (L7)
- "**On the CPU executor, the tree takes longer than the loop, with either network.**" (L54)
- Running totals, "Don't use it when. Depth doesn't matter, as on the CPU executor: the chain is the least work."
  (L195)
- The GPU case: knuth-plass's tree of min-plus matrix products took 0.47 ms on WebGPU at 1,024 break points,
  against 3.4 ms for the chain's program on the CPU executor (L55). Even then, "Against plain JavaScript, the tree on
  a GPU needs many items in one dispatch, and data that stays on the GPU" (L56).

Who dissents? Inside the repo, nobody. The doc gives both sides with measurements. The open question in the lab
is whether to *package* a sorting network for apps past 64 items
(R:lab/ui-exploration/guide/review-and-decisions.md#L269).

---

## 5. Experiments and results (mechanics, with numbers)

### 5.1 "Why a tree gives the loop's answer" (R:docs/patterns.md#L32-L40)

- A loop over n parts is a chain n layers deep. A tree of pairwise combines is about log2 n deep (L34).
- Correct when the combine is **associative**. The doc's examples: "the left group's first hit if the left group
  has one, otherwise the right group's"; "the larger score, and the left one on a tie"; for a state machine,
  "the earlier event, then the later event" (L34).
- Three bit-level cases (L38-L40):
  1. **Choosing** computes no new number, so every grouping gives the same bits *if the comparisons are exact*.
     `emitArgmax`'s comparison isn't. It keeps the left score when the right one is larger by less than about 9e-8
     (up to 2.4e-7 for some scores), so its tree can pick a different candidate from the loop (L38, L119).
  2. **Sums round in FP32.** Row heights 229, 167.4, 208.5, 194.4 px: the loop gives **799.300048828125**, pairs
     give **799.2999877929688**, "one FP32 step lower" (L39). **Reproduced by the port (§5.10, block 4).** The
     difference is 0.00006103515625 = 2^-14, one FP32 step at magnitude 512–1024. Pairwise matches the float64
     sum of the FP32 heights here. Integers below 2^24 add exactly in any grouping.
  3. **Tables of integer states** combined with index reads copy integers without rounding, so the result is
     exact in any grouping (L40).

### 5.2 "When a tree takes less time than the loop" (L42-L61)

The table at L46-L50 for n steps, n a power of two. **Every row is reproduced by the port:**

| Arrangement | Combines | Levels | n=8 (port) | n=1,024 (doc = port) |
|---|---|---|---|---|
| Loop | n − 1 | n − 1 | 7 in 7 | 1,023 in 1,023 |
| `sklanskyPrefix` | (n/2)·log2 n | log2 n | 12 in 3 | 5,120 in 10 |
| `brentKungPrefix` | 2n − 2 − log2 n | 2·log2 n − 2 | 11 in 4 | 2,036 in 18 |

Port output for n = 4, 8, 16, 64, 256, 1024: Sklansky 4/2, 12/3, 32/4, 192/6, 1024/8, 5120/10. Brent-Kung 4/2,
11/4, 26/6, 120/10, 502/14, 2036/18. These match the formulas the repo's test asserts for 4, 16, 64, 256
(R:tests/runtime/prefix-networks.test.ts#L56-L62).

- The cost of a combine (L52): 1 addition for running totals; S index reads for an S-state machine; **S³ ANDs** for
  a set of S states. So "Sklansky's network does at least log2 n / 2 times the loop's work, in the fewest levels,
  and Brent-Kung's about twice the loop's work or more, in about twice as many levels as Sklansky's."
- The CPU numbers (L7): knuth-plass takes 8 to 11 µs per 1,000 operations as a chain of 10,232 layers and as a
  tree of 230 layers alike, at 1,024 break points. A layer has its own cost, about 10 µs per 1,000 layers: 16,384
  two-term sums take 55 µs in 64 layers, 65 µs in 1,024 layers and 210 µs in 16,384 layers (Bun 1.4.3, Apple M5
  Max, `bun lab/runtime-cost/layers.ts`).
- The tree on CPU: knuth-plass's tree takes 1.7–7.7× its chain's time. The tree over a set of states takes 5.4× its
  two loops' time for 4.5× the operations (L54).
- GPU: 0.47 ms on WebGPU against 3.4 ms on the CPU (L55). A round trip costs 0.3–0.6 ms, while a JS loop lays out a
  1,024-break paragraph in 0.04–0.07 ms (L56). With everything uploaded, 10,000 paragraphs took 85 ms on the GPU
  against 37 ms in JS. With only the break positions uploaded, 15 ms (L56).
- The depth floor: "A backend that runs one large kernel per layer can't run fewer kernels than the program's
  longest chain of gates." HandwiredOS has 130 layers, and its longest ReGLU/boolean chain is 71 (L57).
- JSON search: about 5 ms on GPU for 100,000 documents, against 13–14 s on the CPU as generated JS. RegExp on one
  thread takes 1.5–9× the GPU's time (L58). One HandwiredOS evaluation took about 2 ms on WebGPU and takes under
  0.1 ms on the CPU (L58). Bit-packed rows: 5.2 ms against 945 ms for one f32 statement per operation at 32 states (L59).
- Timing context: WebGPU in headless Chrome on an Apple M5 Max. "src/runtime has no GPU backend: the GPU code is in
  src/json-search and in lab/" (L61).

### 5.3 `findIndex`, two cases (L67-L121)

**(a) The test flips once along the items (L67-L95): a count.**
- Worked table (L74-L78), **reproduced by the port**: row bottoms `40 80 80 140 180`, pointerY = 90. The bits
  `[rowBottom <= pointerY]` = `1 1 1 0 0`, count 3 = the loop's `findIndex(b => pointerY < b)` = 3. Neighbor
  differences give the one-hot `0 0 0 1 0`.
- Circuit: `emitCompare` per row in the same layers, one `circuit.roundAffine` sum, neighbor differences declared
  `circuit.assumeOneHot(isPointedRow, true)`, so a field read is 1 gather (L80).
- Cost: **3n + 3 operations in 3 layers. 195 in 3 at 64 rows, against 447 in 34 for an `emitFirstActive` tree**
  (L81). (3·64 + 3 = 195 ✓.)
- Exactness: bits on grids (pointer 1/64 px, bottoms 1/4 px) give integer bits. Off-grid gets a sign cascade, 15
  operations in 14 layers per row within 0..16,384. **Monotonicity is required.** A height of −10 px makes the
  bottoms 40, 30, 80, and at pointerY 35 the count is 1 while the loop returns 0. `validateOneHotGroups` catches it
  in tests (L82).
- Many rows: a binary search reads ceil(log2(n+1)) bottoms: **42 operations in 42 layers among 10,000 rows,
  against 20,001 in 3** for counting every row (L83-L93).

**(b) Passing items can be anywhere, and keeping the best score so far (L97-L121): a tree.**
- Diagram (L107-L114), **reproduced by the port**: hits `0 1 0 1 0 0 1 0` → OR-pairs up `1 1 0 1` → `1 1` → `1` →
  route down, left whenever the left holds 1 → one-hot `0 1 0 0 0 0 0 0`, which equals `findIndex` = 1.
- `emitFirstActive(circuit, gate, hitBits)` (R:src/runtime/numeric-ui-core.ts#L2781-L2830): the up-pass is
  `emitMaximum` of pairs, the down-pass `routeWinner`. It declares the one-hot itself only when the gate and every
  candidate are proven bits. Fractional candidates split the route: "[0.5, 0] route 0.25 to each output" (code
  comment at L2819-L2826).
- `emitArgmax(circuit, scores, unit)` (numeric-ui-core.ts#L2710): scores must be declared within 0..1, and `unit`
  must equal 1 (invariants).
- Cost at 64 candidates: `emitFirstActive` **316 operations in 31 layers**, against **127 in 127** for the chain.
  `emitArgmax` 437 in 33 (L118). For an exact match with the loop: `emitHighestScoreExact`, 500 in 39 at 64 scores
  on a 1/64 grid (L119).
- At 4 candidates the chain is 7 operations and the tree 16, so the tree loses on CPU (L120).
- Used in: HandwiredOS Photos' click priority (photo-gallery.ts). HandwiredOS's `emitFrontmost` instead checks
  stacking ranks one at a time, since at 3 windows the chain is smaller (L121).

### 5.4 Running totals with prefix networks (L175-L196; src/runtime/prefix-networks.ts)

**What the file is (R:src/runtime/prefix-networks.ts, 44 lines):**
- Header (L1-L8): "Prefix networks: fixed arrangements of pairwise combines that compute every prefix … with a far
  shorter longest chain of combines than a loop. combine(earlier, later) has to be associative … combine doesn't
  have to be commutative."
- **`sklanskyPrefix`** (L10-L24). Comment: "Sklansky (1960): for blocks of 2, 4, 8, ... items, combine the last
  prefix of the block's left half into every prefix of its right half. For k items, a power of two, that's (k / 2) ×
  log2(k) combines, and a longest chain of log2(k)." The code loops `halfSize = 1, 2, 4…`. In each block, for
  every index in the right half, `prefixes[index] = combine(prefixes[leftHalfLast], prefixes[index])`. This is the
  divide-and-conquer, high-fan-out construction. In the port's 8-item run, `prefix[3]` feeds 4 combines in level 3.
- **`brentKungPrefix`** (L26-L44). Comment: "Brent-Kung (1982): an upward pass combines neighbors, then pairs of
  pairs, and so on, which completes the prefixes of the first 2, 4, 8, ... items. A downward pass then completes
  every other prefix by combining one completed prefix with one smaller block. For k items, a power of two and at
  least 4, that's 2k − 2 − log2(k) combines, and a longest chain of 2 × log2(k) − 2." The up loop
  `index = 2·span − 1, step 2·span` is followed by the down loop `index = 3·span − 1, step 2·span`.
- **Construction-name verdict: Sklansky and Brent-Kung only.** Kogge-Stone (= the Hillis-Steele scan shape) is in
  the lab (R:lab/ui-exploration/guide/examples/executor/prefix-sums.ts#L1-L9: "Kogge-Stone network: about n
  log2(n) operations, log2(n) layers"), not in src/runtime. Ladner-Fischer does not appear. **[fact-check correction]**
  Brent & Kung's own paper does *not* give these exact figures. It states time proportional to log n (Theorem 3:
  carries in O(log n) time and O(n log n) area; O(n) area with its pipelined scheme), and its 16-bit network
  (Fig. 5) finishes at T = 7 [S19]. The formulas 2k − 2 − log2 k and 2 log2 k − 2 are the repo's (prefix-networks.ts
  #L28-L29, asserted by the test) and later literature's counts for the network, not quotations of the 1982 paper.
- **Tests** (R:tests/runtime/prefix-networks.test.ts):
  - L47-L54: "every prefix is the ordered combination of its items, for 1 to 70 items": it combines *strings*
    `"0," "1," …`, so any wrong grouping or order shows in the text.
  - L56-L62: "combines and longest chains follow the formulas for powers of two", for 4, 16, 64, 256.
  - L64-L94: a state-machine scan at S=4 states, k=32 events, 3 symbols, random tables (an LCG with seed 7). It
    checks the loop's state after every event, and the live-operation count `S × (k + combines) + k`, or
    `k + S × combines` from a constant initial state.

**The running-totals entry (L175-L196):**
- Diagram L184-L190 (4 rows): layer 1 gives 0..1 and 2..3, layer 2 gives 0..3 and 0..2 = (0..1) + h2.
- Three arrangements at 1,024 rows (L193): chain **1,023 operations in 1,023 layers**; wide sums **1,023 in 1 layer
  with 524,799 stored weights** (O(n²)); Brent-Kung **2,036 in 18**. (Check: 1,024·1,025/2 − 1 = 524,799 ✓
  arithmetic.)
- The `circuit.roundAffine` subtlety (L192): it "keeps a sum as its own operation with the caller's term order".
  With `circuit.affine`, the builder copies sums of fewer than 4 terms into their readers and sorts terms, "which
  regroups the additions".
- Exactness (L194): the chain and wide sums equal a loop that rounds each addition, bit for bit. Brent-Kung does so
  only when every partial sum is exact (quarter-pixel heights within 2^22 px, or counts below 2^24). **On long pages
  Brent-Kung is *more* precise:** at 10,000 rows of 20–300 px, the loop's totals are up to **5.67 px** from float64
  sums of the same FP32 heights, and Brent-Kung's up to **0.26 px**. (The guide reports 40.7 px of drift in
  instanced-items at 10,000 photos with sequential sums: R:lab/ui-exploration/guide/sections/executor.md#L325.)
- Where Brent-Kung is used: lists (lab/ui-exploration/lists/common.ts#L141), knuth-plass (program.ts#L162), the
  first-and-last-hit example, and running-totals.ts (git grep output, §11).

**Worked 8-item prefix sum (port, block 3):** heights `3 1 4 1 5 9 2 6`. Loop totals = Brent-Kung = Sklansky =
`3 4 8 9 14 23 25 31` (integers, so exact in any grouping). The Brent-Kung grouping (port, block 2) has **11
combines in 4 levels**:
```
level 1: 0+1, 2+3, 4+5, 6+7
level 2: (0+1)+(2+3), (4+5)+(6+7), (0+1)+2
level 3: (0..3)+(4..7) -> prefix[7]; (0..3)+(4+5) -> prefix[5]; (0..3)+4 -> prefix[4]
level 4: (0..5)+6 -> prefix[6]
```
Sklansky: **12 combines in 3 levels**, and level 3 is four combines that all read `(0+1)+(2+3)`.

### 5.5 `items.sort(compare)`: ranks, not a sorting network (L356-L377)

- "A sort reaches each item's place through comparisons that depend on earlier comparisons. The DOM needs each
  item's position after sorting, e.g. for a `translateY`, and that position is a count: how many items come before
  this item." (L358)
- Worked table (L366-L371), **reproduced by the port**: keys `30 10 30 20` → ranks **2, 0, 3, 1**. Equal keys
  break ties by index. JS `sort` order `[1, 3, 0, 2]` agrees.
- Circuit: one `emitCompare(keys[earlier], '<=', keys[later])` per pair gives both entries. Each rank is one sum.
  Each top is a sum of `comesBefore × height` (L373).
- Cost: **4,096 operations in 3 layers at 64 items** (L374). Inference, not stated in the doc: 2,016 pairs × 2
  operations + 64 rank sums = 4,096 exactly (port, block 8). Label it as our decomposition.
- Drag update: when one card moves, new ranks come from last frame's ranks. **1,404 operations in 8 layers at 100
  cards** (L374).
- The sorting network is only the alternative (L376): "a sorting network is O(n log² n) operations in O(log² n)
  layers, e.g. for 64 items with integer keys that each carry one value to their sorted place, 10,624 operations in
  105 layers, against 16,512 in 5 for ranks".
- Lab detail (R:lab/ui-exploration/guide/sections/loops.md#L183-L192): "Batcher's networks (bitonic and odd-even
  merge) use about n × log2²(n) / 4 compare-exchanges in log2(n) × (log2(n) + 1) / 2 stages". A compare-exchange is
  "a minimum and a maximum, 4 operations in 3 layers". At 16 items, bitonic with payload is 1,248 ops / 50 layers,
  against ranks 1,056 / 5. At 64, 10,624 / 105 against 16,512 / 5. Odd-even merge with keys only, 64 keys: 2,172 /
  63. On fractional keys, "20 to 24% of its outputs weren't bit-equal to any input, with errors up to 6e-5"
  (L194). These measurements live on the `exploration-2026-09` branch notes, which are not in the 257856e tree
  (`lab/ui-exploration/notes` does not exist at 257856e).
- **Verdict:** mention Batcher (1968) only as "the sorting network Handwired measured and chose not to use for
  ≤64 items". The shelf book *Bitonic Sorter* (`public/generated/handwired-bitonic-sorter/`) is about that
  alternative. Its chapter 4 claim "measured the bitonic network, keys only, at 64 layers and 2,752 operations"
  comes from an older commit (d01b763) and **differs** from the guide's odd-even 2,172 / 63. These are different
  networks, so don't conflate them.

### 5.6 `items.filter(isVisible).slice(0, K)` into K DOM nodes (L379-L397)

- "Which items pass the filter isn't known while building, but the number of DOM nodes K is." (L381)
- Worked table (L387-L390) and long form
  (R:lab/ui-exploration/guide/patterns/compaction-into-slots.md#L7-L18), **reproduced by the port (block 5)**:

```
item             0 1 2 3 4 5 6 7
visible          0 1 1 0 1 0 1 1
visibleThrough   0 1 2 2 3 3 4 5      (Brent-Kung prefix sum)
slot 0: [vT<=0] 10000000  one-hot 01000000 -> item 1
slot 1: [vT<=1] 11000000  one-hot 00100000 -> item 2
slot 2: [vT<=2] 11110000  one-hot 00001000 -> item 4
slot 3: [vT<=3] 11111100  one-hot 00000010 -> item 6
slot 4: [vT<=4] 11111110  one-hot 00000001 -> item 7
slot 5: [vT<=5] 11111111  one-hot 00000000 -> none, present = 0
binary search for slot 2: read [7]=5; read [3]=2 <= 2, +4; read [5]=3; read [4]=3 -> position 4
JS reference items.filter(isVisible).slice(0, 3) = [1, 2, 4]
```
  (The long form gives the same binary-search trace: "read visibleThrough at 7, 3, 5, 4 and get 5, 2, 3, 3; add the
  step (8, 4, 2, 1) whenever the count is at most 2 → 4, so item 4", L16-L17.)
- Code (R:lab/ui-exploration/guide/examples/patterns/every-item/compaction-into-slots.ts):
  - Visibility L43-L48: `reglu([], 1, [[price>=min,1],[price<max,1]], -1)`, which is an AND of two bits as
    relu(a + b − 1).
  - `emitPrefixCounts` L57-L75 is a hand-inlined Brent-Kung of `roundAffine` additions. Its comment: "Every partial
    sum is an integer below 2^24, so any grouping gives the loop's exact counts." Small finding: its down-pass
    starts at `span /= 4` where `brentKungPrefix` uses `span /= 2`. By our analysis the skipped round is always
    empty (its first index 3S/2 − 1 is ≥ n whenever S ≥ n), so the two compute the same network. This is an
    inference, not stated in the repo.
  - One-hot route L81-L106: `[count <= k] = relu(k+1−count) − relu(k−count)`, and consecutive k share a ReLU.
    `assumeOneHot(isShown, true)`. Price is a masked sum, "which the compiler lowers to one gather read".
  - Binary search L111-…: `stepCount = ceil(log2(n+1))`. A read past the end clamps. A missing slot reads +0 via
    `{outOfRange: 'zero'}`.
  - Host contract L7: prices, minPrice, maxPrice are integers within 0..1,024.
- Cost at 1,000 items → 20 slots (L394): visibility + counts **6,984 operations in 20 layers**. One-hots **47,044 in
  24** (129,948 stored weights, long form L61). Binary search **7,824 in 57**. 10,000 items → 24 slots: 71,373 in
  80 (long form L62).
- Don't use it when (L396): the visible items form one run, where slot k shows `firstVisibleRow + k` (hn-thread
  1,269 ops for 48 slots, against 25,616 with routing). The per-slot work is small: routing pays off only once
  per-item work exceeds about 2 + 2K operations (42 for 20 slots). Or K is close to n.
- **The fixed maximum and its fallback.** K is the maximum. The example simply drops: `slot < shownItems.length ? …
  : {present: 0, item: -1, price: 0}` (compaction-into-slots.ts#L23-L25), and its outputs are only
  `present, item, price` per slot (L53). There is no overflow output. The doctrine
  (R:docs/behavior-choices.md#L77-L95): "A program's size is fixed while building, so every count that JavaScript
  keeps in a growing array or a loop variable becomes a maximum, and what the program does past the maximum is part
  of the behavior." Fallbacks: snap / carry / split / report / drop / clamp / throw (L89). "Give every maximum an
  output or a check … without one, a program past a capacity computes wrong values, and no output shows the
  problem." (L95). The real example is HandwiredOS's Monitor list: 64 DOM slots, and `slotOverflow =
  emitCompare(endVisible − firstVisible, '>', slotCount)` (R:src/handwiredos/value-list.ts#L434-L435). The page
  shows "Only 64 rows are drawn at a time." (behavior-choices.md#L87; string built at value-list.ts#L664 from
  `slotCount = 64` at L63, and displayed by L753 when `slotOverflow` is 1). Strictly, the Monitor list does two
  fallbacks at once: it *drops* (rows past the 64 slots get no node) and *reports* (`slotOverflow`), which is how
  behavior-choices.md#L89 uses it for both "report" and "drop". How to choose the
  maximum: from the measured distribution, e.g. "48 DOM slots against at most 32 needed in the measured states of
  lab/ui-exploration/hn-thread" (L95).

### 5.7 "A loop over a set of states, as a tree of matrix products" (L277-L301)

- Context: regex/JSON search runs an automaton that can be in *several* states at once. The state is a 0/1 vector of
  S bits, and each step multiplies it by the current character class's transition-bit matrix (L233).
- The effect of a block of text has a fixed size: an **S × S matrix of bits** (`matrix[from][to]` = 1 if some path
  reads the whole block from `from` and ends in `to`) plus **one integer per state** (the end of the longest
  accepting path inside the block) (L279).
- Combine `followedBy(earlier, later)` (L288-L291): a clamped boolean matrix product, AND = `relu(a + b − 1)`, OR =
  `1 − relu(1 − sum)`, plus S maximums as tournaments of `a + relu(b − a)` (L297). It runs from the end of the text
  with `brentKungPrefix` (L293).
- Why bits alone don't suffice: restarting a match is a NOT of an OR, and "a product of 0/1 matrices clamped back
  to 0..1 can't compute a NOT", so the integers ride along (L297, L59).
- Cost: 8 states over 1,024 code points gives **1,064,103 operations in 174 layers** (Brent-Kung) and 1,278,722 in
  124 (Sklansky), against **236,328 in 8,190** for the two passes (L298). On CPU it took **10.8 ms against 2.0 ms**
  (L300). 16 states makes 5.9 million operations, about 15 s to build and compile, and 9–11 GB (L300).
- "**No program in this repo builds this tree**": the sizes come from a program built from the snippet.
  src/json-search runs the two passes as loops (L301). Say this honestly on screen.

### 5.8 "A stack of one bit per level" (L303-L326)

- A JSON parser's stack of open containers. Is a comma inside an object or an array? The stack's kinds fit in one
  integer whose bit d−1 is 1 when the container at depth d is an object (L322).
- Worked table (L316-L319), **reproduced by the port (block 10)** on `{[{}]}`: depthBefore `0 1 2 3 2 1`,
  codeBefore `0 1 1 5 1 1`, inObject `0 1 0 1 0 1`. The rule: add 2^depthBefore at `{`, subtract
  2^(depthBefore−1) at `}`. `inObject = [codeBefore >= 2^(depthBefore−1)]`, because the containers below add up to
  less than that bit.
- Cost: 5 operations per position after the depth (weight read, add, level read, 2-op compare), about 2,570 at 512
  positions and depth ≤ 16, in 528 layers. As one loop step: 20 per position (a 17-operation sign cascade), and
  json-search's highlighter step is 37 operations in all (L323).
- Limits: correct until the first mismatched bracket (`[}` subtracts a bit never added). The maximum depth is 24,
  past which the code's bits pass 2^24 (L324-L325). Used in src/json-search/json-step.ts, tested at every depth
  1–16 (L326).

### 5.9 "Following links one at a time" (pointer jumping, L328-L350)

- Line breaking: where each line starts, from a `nextStart` table. The walk is L layers deep for L links.
  "Replacing every link by the link it points to doubles how far every link reaches, so L links take about log2 L
  rounds (pointer jumping)." (L330)
- Worked table (L340-L343), **reproduced by the port (block 9)**: nextStart `3 3 4 6 6 8 9 9 10 10`; 2-lines-later
  `6 6 6 9 9 10 10 10 10 10`; line 3 starts at `j1[j2[0]] = j1[6] = 9`. The plain walk gives `0 3 6 9 10`.
- Cost: **342 operations in 7 layers at 63 segments and 32 line slots, against 94 in 32** (L347). The next-start
  table dominates at realistic sizes: 190,279 operations for 1,023 segments (L347). On CPU the walk is about 16×
  fewer operations at 1,023 segments (L349).

### 5.10 "Work JavaScript does ahead of time" (L438-L473): tables

- **Layout function of one runtime number** (L442-L454): JS calls the black-box layout every 1 px and bisects
  differences down to 1/64 px. The program adds `change × [containerWidth >= threshold]`. 5 messages from 160 to
  1,280 px have **45 thresholds**, and every bubble's top, height and width plus the content height are **106
  operations in 3 layers**. JS makes 1,391 layout calls when the text changes. The test compares all **71,681**
  widths (L451-L452). Caveat: this holds for greedy line breaking, while pretext's rich layout can get *more* lines
  when wider (L452).
- **Loop over data that rarely changes** (L456-L473): the ancestor table. Depths `[0 1 2 1 2 3]` give
  `ancestorAtLevel` rows such as row 3 `[0 3 3 3]` and row 5 `[0 3 4 5]`. The program does one `indexReadAffine`,
  "1 operation in 1 layer per read at any table size" (L465-L470). Data-in-cells trade-off: a 32-state automaton
  over 1,024 code points is 2,297,760 operations with the automaton in cells, against 133,529 (17× fewer) with one
  pattern built in as constants, at the price of a 0.3–0.5 s rebuild per pattern (L472).

### 5.11 The other "carrying" entries in brief

- **Spring matrix power** (L198-L213): 14 operations in 3 layers per spring at any step count. Unrolling is 3,301 in
  902 for up to 300 steps. Within 3e-4 px of the float64 loop. (Covered in depth by the host-loop dossier.)
- **State machine over queued events** (L215-L237): an event = a table from state to next state, and two events
  combine as `combined[state] = later[earlier[state]]`. Port block 11 reproduces "downOnButton, then moveOutside =
  [pressedOutside, pressedOutside, pressedOutside]" (L224-L227). Costs: **897 operations in 10 layers (Sklansky)
  and 681 in 14 (Brent-Kung) for a 3-state button at 64 events, against 129 in 65** for the loop (L234). On CPU,
  the JSON tokenizer (26 states) + grammar (8 states) over 512 code points takes 3.0× the loop's time with
  Brent-Kung scans and 6.1× with Sklansky (L236).

---

## 6. Verified quotes (verbatim, from the repo at 257856e)

All of these are read directly from the clone with `cat -n`. Each is usable as an on-screen quote of the docs.

1. "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a
   table, or the same work on every item." (R:docs/patterns.md#L3; also R:docs/README.md#L9)
2. "A pattern needs nothing new from the runtime" (R:docs/patterns.md#L3)
3. "So removing operations by adding layers doesn't always save time." (R:docs/patterns.md#L7)
4. "The tree gives the loop's answer when the combining step gives the same result however the parts are grouped"
   (R:docs/patterns.md#L34)
5. "Sums and products round in FP32, so the grouping is part of the result." (R:docs/patterns.md#L39)
6. "On the CPU executor, the tree takes longer than the loop, with either network." (R:docs/patterns.md#L54, bold
   in source)
7. "HandwiredOS is many different pieces of logic instead of one repeated step, so it has no tree to build."
   (R:docs/patterns.md#L57)
8. "A loop stops at the first item that fails the test." (R:docs/patterns.md#L69)
9. "Each total reads the total before it, so the loop is a chain n layers deep." (R:docs/patterns.md#L177)
10. "A program runs each of its layers once, so it can't run a loop a runtime number of times." (R:docs/patterns.md#L200)
11. "A program runs every step once, in order, so it can't go back." (R:docs/patterns.md#L241)
12. "No program in this repo builds this tree" (R:docs/patterns.md#L301)
13. "Replacing every link by the link it points to doubles how far every link reaches" (R:docs/patterns.md#L330)
14. "that position is a count: how many items come before this item." (R:docs/patterns.md#L358)
15. "Which items pass the filter isn't known while building, but the number of DOM nodes K is." (R:docs/patterns.md#L381)
16. "Work that a loop would redo on every frame runs in JavaScript when the data changes, and the program compares
    with its results or reads them." (R:docs/patterns.md#L440)
17. "A program's size is fixed while building, so every count that JavaScript keeps in a growing array or a loop
    variable becomes a maximum, and what the program does past the maximum is part of the behavior."
    (R:docs/behavior-choices.md#L79)
18. "Give every maximum an output or a check" (R:docs/behavior-choices.md#L95)
19. Code comment: "combine doesn't have to be commutative." (R:src/runtime/prefix-networks.ts#L6)
20. Code comment: "Sklansky (1960): for blocks of 2, 4, 8, ... items, combine the last prefix of the block's left
    half into every prefix of its right half." (R:src/runtime/prefix-networks.ts#L10-L11)
21. Code comment: "Brent-Kung (1982): an upward pass combines neighbors, then pairs of pairs, and so on"
    (R:src/runtime/prefix-networks.ts#L26)
22. On-page string: "Only 64 rows are drawn at a time." (quoted in R:docs/behavior-choices.md#L87; generated by
    R:src/handwiredos/value-list.ts#L664 with `slotCount = 64`)

External:
- Brent & Kung's abstract, verbatim from the retyped paper [S19] (retyped "with corrections" by Frances Page, July
  2000; check the IEEE scan [S8] before putting it on screen as the 1982 printed wording): "With VLSI architecture,
  the chip area and design regularity represent a better measure of cost than the conventional gate count. We show
  that addition of n-bit binary numbers can be performed on a chip with a regular layout in time proportional to
  log n and with area proportional to n."
- Brent's page [S7]: "At the time of publication the use of carry-lookahead in VLSI designs was unpopular."
- Sklansky's "the maximum fanout is an increasing function of the summand length": seen only as a patent's
  quotation in a search summary [S18]. **UNVERIFIED, do not use as a quote** until it is checked against the 1960
  paper.

---

## 7. Debates and controversies

- **Is the tree worth it?** The repo argues both sides with numbers. CPU: the loop wins (L7, L54, L195, L236, L300,
  L349). GPU / large batches: the tree can win (L55-L59). Against plain JavaScript, even the GPU tree needs many
  items per dispatch (L56). Not contested externally. Present it as a trade-off, not a triumph.
- **Exactness of trees.** Associativity holds exactly for selections and integer sums < 2^24, and only up to
  rounding for FP32 fractions (prefix-networks.ts#L3-L6, patterns.md#L36-L40). Counterpoint: at 10,000 rows
  Brent-Kung is *more accurate* than the loop against float64 (0.26 px vs 5.67 px, L194). The shelf book *Trace
  Compiler* states that a parallel prefix sum "would change rounding order, so under this exactness policy it is
  not automatically interchangeable" (`public/generated/handwired-trace-compiler/sources.json`, c4). Both are true.
  Bit-identity with a loop reference and closeness to the real-number answer are different goals.
- **Sorting network vs ranks.** It is open in the lab whether to package a sorting network for >64 items
  (R:lab/ui-exploration/guide/review-and-decisions.md#L269). Counting wins at 16 items, the network wins on
  operations at 64, and counting stays at 5 layers (loops.md#L192).
- **Naming of "Sklansky's network".** The 1960 paper is about conditional-sum addition. Calling it a *prefix
  network* is a later reading in the parallel-prefix literature (Harris 2003 uses "Sklansky" as a corner of the
  taxonomy [S14]). The repo itself connects the two: "the conditional-sum adder (Sklansky 1960) at O(log k) depth,
  which is the prefix scan of way 1" (R:lab/ui-exploration/guide/sections/chains.md#L132). Mild: say "the
  arrangement named after Sklansky's 1960 adder", not "Sklansky invented prefix sums".
- **Brent-Kung vs Kogge-Stone in hardware.** Wikipedia's Brent-Kung article says it has less wiring congestion and
  greater delay than Kogge-Stone, and is internally inconsistent about "better performance" [S10]. Not needed for
  the film.

---

## 8. Misconceptions to avoid

1. **"Handwired uses a Kogge-Stone / Hillis-Steele scan."** False for src/runtime: it has Sklansky and Brent-Kung
   only (prefix-networks.ts). Kogge-Stone appears only in lab/: a guide example that builds it (prefix-sums.ts), lab
   docs, the old index-read prototype (chains.md#L103) and an earlier lists phase (lists/README.md#L219).
2. **"Handwired sorts with a bitonic sorting network."** False. `items.sort` is ranks by counting (patterns.md#L373).
   Bitonic and odd-even merge are measured alternatives on an exploration branch.
3. **"Trees make Handwired faster."** Not on the CPU executor, which is the one src/runtime has. "src/runtime has no
   GPU backend" (L61).
4. **"A tree always gives the loop's exact bits."** Only for selections, integer tables and integer or grid sums
   below 2^24. FP32 fractional sums differ in the last bit (799.300048828125 vs 799.2999877929688).
5. **"The count trick works for any findIndex."** Only when the bits are monotone (1…1 0…0). Unsorted bottoms give a
   wrong row *without an error* (L82).
6. **"filter+slice handles any number of matches."** K is fixed at build time. Past K, items get no node. The
   example has no overflow output. HandwiredOS's list reports overflow (`slotOverflow`).
7. **"The tree of matrix products runs in json-search."** "No program in this repo builds this tree" (L301).
8. **"Brent-Kung's formula holds for every n."** The comment says "a power of two and at least 4" (L28). At n = 2 the
   level formula 2·log2 n − 2 gives 0, but the code does 1 combine in 1 level. (The combine count, 1, is right.)
9. **Miscounting the entries.** The Index table (L13-L30) has **18 rows**, one per entry. Use 18 if a number is
   needed.
10. Don't show the commit as made on Oct 27. It is dated 2026-10-16.

---

## 9. Curiosity hooks (true, sourced)

1. Adding the same four row heights in a different grouping gives a different FP32 answer, 799.300048828125 against
   799.2999877929688, one FP32 step (2^-14) apart (patterns.md#L39; port block 4).
2. At 10,000 rows, the "obvious" loop drifts up to 5.67 px from the true sum, while the tree drifts only 0.26 px.
   The parallel version is the more accurate one (L194).
3. The fastest prefix network (Sklansky: 10 levels for 1,024 items) does 5× the loop's work. Brent-Kung does twice
   the work in 18 levels (L46-L50; port).
4. Two 1960s–80s hardware adder designs, Sklansky's conditional-sum adder (1960) and Brent & Kung's VLSI adder
   (1982), are how a 2026 UI library computes the tops of list rows (prefix-networks.ts#L10, L26; [S1][S7]).
5. Sorting 64 cards: Handwired never sorts. Each card counts how many cards come before it, 4,096 operations in 3
   layers (L374).
6. A JSON parser's whole stack of open brackets fits in one number, one bit per level, up to depth 24 because FP32
   integers stop being exact at 2^24 (L322-L325).
7. On a GPU, the search over 100,000 JSON documents takes about 5 ms. The same program as generated JavaScript on
   the CPU takes 13–14 s (L58).
8. HandwiredOS on WebGPU took about 2 ms per evaluation, slower than under 0.1 ms on the CPU, because it is "many
   different pieces of logic instead of one repeated step" (L57-L58).
9. A whole set of states over 1,024 characters as a tree: 1,064,103 operations. 16 states took about 15 s and 9–11
   GB just to build and compile (L298-L300).
10. "Only 64 rows are drawn at a time.": the overflow message a fixed-capacity list shows (behavior-choices.md#L87).

---

## 10. Visual and dramatic details (for the teaching machines)

Concrete apparatus that the numbers support. Every value below is taken from a worked example above.

- **The counting rail (findIndex flips once):** five row-bottom pegs at 40, 80, 80, 140, 180 and a pointer bar at 90.
  Three pegs drop flags (1 1 1 0 0) and a tally drum clicks to 3. A ratchet mark sits at the boundary (one-hot 0 0 0
  1 0).
- **The knockout bracket (emitFirstActive):** eight lamps-as-tokens `0 1 0 1 0 0 1 0`. They merge upward in pairs
  (1 1 0 1 → 1 1 → 1), then a single token rides back down, always taking the left chute when the left holds a 1,
  and lands on slot 1. The machine clacks at each switch; nothing chimes (brief).
- **The prefix loom (Brent-Kung, 8 items):** heights 3 1 4 1 5 9 2 6 on paper tabs. The up-sweep makes 4, then 2,
  then 1 joins (levels 1–3). Then a down-sweep fills prefix 5, 4 and finally 6 (level 4). Totals 3 4 8 9 14 23 25
  31. 11 joins, 4 levels. Contrast **Sklansky**: 12 joins, 3 levels, and one tab (0..3) fanning out into four
  threads at once. That is the "high fanout" picture.
- **The two-sums scale:** two paper totals of the same four heights (229, 167.4, 208.5, 194.4), one reading
  …300048828125 and the other …2999877929688, a hair apart.
- **The rank board (sort):** keys 30, 10, 30, 20 in a 4×4 grid of flip-tiles. Each row sums to its rank (2, 0, 3,
  1), and cards slide to their slots without ever being swapped.
- **The K-slot rack (filter+slice):** eight items, visible 0 1 1 0 1 0 1 1, running counter 0 1 2 2 3 3 4 5. Three
  DOM-node frames on a shelf receive items 1, 2, 4. A 4th, 5th and 6th frame would get 6, 7 and nothing (presence
  flag down). A small card behind the rack says the capacity is fixed.
- **The bracket stack as a binary odometer:** `{[{}]}` with code 0 1 1 5 1 1, one bit per depth level.
- **The jump ladder (pointer jumping):** segments 0–10 with a "1 line later" arrow row and a "2 lines later" arrow
  row. Line starts 0, 3, 6, 9.
- **The CPU vs GPU set:** a single-file clerk (the CPU, pays per operation) against a row of many clerks moving in
  lockstep per level (a GPU dispatch per level). Period dressing is not needed; this is the house paper-cut theatre.
- Historical inserts, if any: a 1960 relay-and-diode adder bench for Sklansky (generic), and a 1980s VLSI chip
  layout drawing with a regular grid of cells for Brent-Kung. Brent & Kung's figure has white "buffer" nodes and
  black "combine" nodes ([S7] errata mentions black and white processors in Figure 5; [S10] white and black nodes).
  The black/white node vocabulary maps neatly onto silhouette art.

---

## 11. Sources

Repo (all at `https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/`):
- R1 docs/patterns.md (L3, L5, L7, L9-L30, L32-L40, L42-L61, L63-L121, L171-L237, L239-L350, L352-L436, L438-L473)
- R2 docs/README.md#L9
- R3 src/runtime/prefix-networks.ts#L1-L44
- R4 tests/runtime/prefix-networks.test.ts#L1-L95
- R5 src/runtime/numeric-ui-core.ts#L2710-L2830 (emitArgmax, emitFirstActive)
- R6 docs/behavior-choices.md#L77-L97
- R7 src/handwiredos/value-list.ts#L21, L184, L434-L439, L753
- R8 lab/ui-exploration/guide/patterns/compaction-into-slots.md#L1-L85
- R9 lab/ui-exploration/guide/examples/patterns/every-item/compaction-into-slots.ts#L1-L120
- R10 lab/ui-exploration/guide/sections/loops.md#L183-L196
- R11 lab/ui-exploration/guide/sections/chains.md#L11, L103, L105, L132
- R12 lab/ui-exploration/guide/sections/executor.md#L325, L387, L441-L444
- R13 lab/ui-exploration/guide/review-and-decisions.md#L269
- R14 lab/ui-exploration/guide/examples/executor/prefix-sums.ts#L1-L13
- R15 `git grep -n "brentKungPrefix\|sklanskyPrefix" 257856e` (uses in lab/knuth-plass, lists, guide examples)
- R16 Independent port and output: `films/handwired-explained/research/runs/patterns_port.mjs`,
  `films/handwired-explained/research/runs/patterns_port.out.txt` (command:
  `node films/handwired-explained/research/runs/patterns_port.mjs`)

Shelf leads (re-checked above against 257856e):
- L1 public/generated/handwired/sources.json (chapter 4: findIndex, Brent-Kung 2,036/18, ranks 4,096/3)
- L2 public/generated/handwired-bitonic-sorter/sources.json (Batcher 1968, bitonic counts; older commit d01b763)
- L3 public/generated/handwired-knuth-plass/sources.json (Brent-Kung tree 230 layers; Sklansky "not done")
- L4 public/generated/handwired-trace-compiler/sources.json (prefix sum changes rounding order)
- L5 public/generated/handwired-ui-exploration/sources.json (slots, index read)

External:
- S1 https://dblp1.uni-trier.de/db/journals/tc/tc9.html (Sklansky 1960, EC-9(2):226–231)
- S2 https://www.ece.ucdavis.edu/~vojin/CLASSES/EEC278/S2001/web/Handouts.htm
- S3 https://patents.google.com/patent/US3553446A/en
- S4 https://doi.org/10.1145/1468075.1468121 (Batcher 1968)
- S5 https://oaks.kent.edu/kenneth-e-batcher-collection/sorting-networks-and-their-applications
- S6 https://en.wikipedia.org/wiki/Ken_Batcher
- S7 https://maths-people.anu.edu.au/~brent/pub/pub060.html (Brent & Kung 1982 page; related works Kogge-Stone 1973, Ladner-Fischer 1980)
- S8 https://maths-people.anu.edu.au/~brent/pd/rpb060_IEEETC.pdf (scan of the IEEE original)
- S9 https://apps.dtic.mil/sti/pdfs/ADA074455.pdf (CMU-CS-79-131, 1979)
- S10 https://en.wikipedia.org/wiki/Brent%E2%80%93Kung_adder
- S11 https://en.wikipedia.org/wiki/Prefix_sum
- S12 https://ece757.ece.wisc.edu/uw-only/06_cacm86_data_parallel.pdf (Hillis & Steele 1986)
- S13 https://ieeexplore.ieee.org/abstract/document/1292373 (Harris 2003 taxonomy)
- S14 https://patents.google.com/patent/US7152089 (Harris taxonomy, l/f/t corners)
- S15 https://prabook.com/web/jack.sklansky/373217 (lead only)
- S16 https://ocw.ece.cornell.edu/files/2019/06/4740_lecture22-tree-adders.pdf
- S17 https://www.apress.com/us/book/9781461258407 (Sklansky & Wassel 1981)
- S18 https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4623982 (patent citing Sklansky; the fanout quote is unverified)
- S19 https://maths-people.anu.edu.au/~brent/pd/rpb060.pdf (retyped Brent & Kung, July 2000, with corrections; read in the fact-check: abstract, affiliations, "C-31 (March 1982), 260–264", CMU-CS-79-131 June 1979, Theorem 3, Fig. 5 T = 7 at n = 16. It does **not** state 2 log2 n − 2 levels or 2n − log2 n − 2 cells)
- S20 https://dblp1.uni-trier.de/db/journals/tc/tc9.html and https://dblp.dagstuhl.de/db/journals/tc/tc9.html (Sklansky, vol. 9 no. 2, June 1960, 226–231, via search result)
- S21 https://www.cs.kent.edu/~batcher/conf.html (Batcher's own list: 1968 SJCC, AFIPS Proc. vol. 32, pp 307–314)
- S22 https://dl.acm.org/doi/10.1145/7902.7903 (Hillis & Steele, CACM 29(12):1170–1183, Dec 1986)

---

## 12. Fact-check log (adversarial pass, 2026-10-27)

Method: every repo claim re-read in the clone at `257856e3b221140acb4cc4460626b850c0bd4ff1` (`cat -n`, `git grep`),
worked numbers recomputed with a fresh Node script independent of `patterns_port.mjs` (Math.fround sums; the
repo's two network loops counted for n = 2…1024; ranks, slot routing, the bracket code and pointer jumping by
hand), and operation counts checked against the values the repo's tests pin (`toMatchObject` / size strings in
`lab/ui-exploration/guide/examples/patterns/**.test.ts`, `tests/runtime/prefix-networks.test.ts`). Running
`bun test` in the clone was refused by the sandbox again, so test-pinned counts are confirmed as *asserted by the
tests*, not as *observed passing*. External claims checked on the web.

**Confirmed (no change):** the thesis sentence (patterns.md#L3, docs/README.md#L9); associativity text (L34, L38-L40);
799.300048828125 vs 799.2999877929688, difference 2^-14 = one FP32 step in [512, 1024), and the float64 sum of the
FP32 heights equals the pairwise result (running-totals.test.ts#L80 tests this example); exactly two networks in
src/runtime/prefix-networks.ts; 1,023/1,023, 5,120/10, 2,036/18 and every n = 4…256 count; the test formulas for
4, 16, 64, 256 (prefix-networks.test.ts#L56-L62); CPU tree 1.7-7.7× (patterns.md#L54, knuth-plass README#L185);
0.47 ms vs 3.4 ms and "src/runtime has no GPU backend" (L55, L61); findIndex count 195/3 vs 447/34 (count-instead-
of-search.test.ts#L82); emitFirstActive 316/31 vs 127/127 (first-active-tree.test.ts#L157); emitArgmax 437/33
(highest-score-tree.test.ts#L157) and tie band 8.9e-8 / up to 2.4e-7 (L38, L119); running totals 1,023/1,023,
1,023/1 with 524,799 weights, 2,036/18 and drift 5.67 vs 0.26 px (running-totals.test.ts#L107-L127); ranks 2 0 3 1
and 4,096/3, 1,404 at 100 cards (ranks-instead-of-sorting.test.ts#L112-L119); bitonic 10,624/105 vs 16,512/5 and
1,248/50 vs 1,056/5 (loops.md#L189-L190, review-and-decisions.md#L269); no sorting-network code at 257856e
(`git grep -i "bitonic|batcher|odd-even"` hits only .md files); filter+slice counts 0 1 2 2 3 3 4 5 → items 1, 2, 4
and 6,984/20, 47,044/24, 7,824/57, 71,373/80 (compaction-into-slots.test.ts#L97-L102); K fixed, the seven fallbacks
(behavior-choices.md#L89); set-of-states tree 1,064,103/174 vs 236,328/8,190, 10.8 vs 2.0 ms, "No program in this
repo builds this tree" (L298-L301); bracket code 0 1 1 5 1 1, depth-24 limit (L316-L325); pointer jumping 342/7 vs
94/32 (pointer-jumping.test.ts#L98-L99); all 22 repo quotes in §6 match the source wording. External: Sklansky,
*IRE Trans. Electronic Computers* EC-9(2):226-231, June 1960 [S20]; Brent & Kung, *IEEE Trans. Computers*
C-31(3):260-264, March 1982, ANU and Carnegie-Mellon affiliations, CMU-CS-79-131 June 1979 [S19][S8]; Batcher 1968
SJCC, AFIPS vol. 32, 307-314, Goodyear Aerospace, Akron [S21][S4]; Kogge-Stone 1973 C-22:786-793 and Ladner-Fischer
1980 J. ACM 27:831-838 as listed on Brent's page [S7]; Hillis & Steele CACM 29(12):1170-1183, Dec 1986 [S22]; Harris,
Asilomar Nov 2003, vol. 2 pp. 2213-2217, Brent-Kung / Sklansky / Kogge-Stone as the corners of the l+f+t = L−1
plane [S13][S14].

**Changes made:**
1. **Corrected (§4, §5.4, S19):** "Brent & Kung's own paper gives the same figures: about 2 log2 n − 2 delay levels
   and 2n − log2 n − 2 cells" and "accepted 2 log2 n − 2 levels, and got about 2n cells". The retyped paper [S19]
   states time proportional to log n, area O(n log n) for the carry network (Theorem 3) and O(n) with pipelining
   (abstract, §6), and its n = 16 example finishes at T = 7. The exact counts are the repo's (prefix-networks.ts#L28-L29)
   and later literature's, not the paper's.
2. **Corrected (§1, §5.6, §6 #22):** the "Only 64 rows are drawn at a time." string was cited to value-list.ts#L434-L435
   and #L753. Those lines compute `slotOverflow` and toggle the message's display; the string itself is built at
   value-list.ts#L664 from `slotCount = 64` (L63).
3. **Corrected for precision (§1, §8 #1):** "Kogge-Stone appears only in a lab example". It is in lab/ only, but in
   lab example code (prefix-sums.ts#L78, executor.test.ts, report.ts), several lab docs, the old index-read prototype
   and an earlier lists phase (lists/README.md#L219). Also noted that "Ladner" appears once, as Ladner 1975 (circuit
   value problem, chains.md#L174), not Ladner-Fischer.
4. **Upgraded (§3, §6 External):** the Brent & Kung abstract is now captured verbatim from the retyped paper (with a
   note to check the IEEE scan for the printed wording), and Brent's page sentence "At the time of publication the use
   of carry-lookahead in VLSI designs was unpopular." is quoted verbatim [S7].
5. **Unverifiable, kept demoted:** Sklansky's "the maximum fanout is an increasing function of the summand length".
   The Berkeley copy of the paper returned 404 and no primary text was found: **UNVERIFIED — do not use as a quote**
   (§4 now says so too).
6. **Unverifiable, labelled:** the "Sept 2026" date of `exploration-2026-09` is inferred from the branch name only;
   Blelloch's "1990" is the repo's own attribution, not checked externally; Sklansky's biography stays a Prabook lead.
7. **Added:** Batcher's full dates (Dec 27, 1935 – Aug 22, 2019, Wikipedia citing an obituary) and sources S20-S22.

Not contested: nothing in this dossier has a credible opposing source; the "tree vs loop" trade-off is the repo
arguing both sides with its own measurements (§7).
