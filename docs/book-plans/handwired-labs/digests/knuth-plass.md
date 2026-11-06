# lab/knuth-plass digest

**Question:** Can Knuth-Plass optimal line breaking, a shortest path over break points, be written as exact min-plus matrix products combined in a tree, and does that make many paragraphs faster on the GPU than plain JavaScript?

**Mechanism:** `knuthPlass()` in reference.ts is the plain DP: `cost[to]` = min over the last W starts of `cost[from] + lineCost(from, to)`, where `lineCost` is `min(slack, 63)²`, 0 for the last line (a variant of pretext's demo cost, which can't be computed exactly). `buildKnuthPlass(capacity, form)` in program.ts writes it as a circuit. Each line cost is one table read plus a ReLU overflow bit. Each minimum is `excess = relu(left - right)`, `value = left - excess`, in a tournament that keeps the reference's tie rule. The "chain" form takes one step per break point. The "tree" form makes each step a W x W min-plus matrix and combines them with Brent-Kung's prefix network (`minPlusProduct`, `statesByProductTree`). Pointers are followed by doubling. Every value is an integer under 2^24, so FP32 is exact. `gpuPlan()` in gpu/plan.ts and the shaders in gpu/kernels.ts run one WebGPU dispatch per tree level in u32, with a `full` kernel and a `dense-rows` kernel.

**Result:** (README.md) At n = 1,024, W = 32 on the CPU: chain 277,068 live operations, 10,232 layers, 2,925 µs; tree 2,823,382 operations, 230 layers, 22,445 µs; JS reference 75 µs. Tree costs "1.7 to 7.7 times the chain's µs". At 364 px on the demo, total cost 13,550 greedy vs 10,058 optimal, both 41 lines. GPU: one paragraph takes 0.3 to 0.6 ms (round trip), losing to the reference; dense-rows with positions beats `knuthPlassTyped` 2.3 to 2.8x at the largest batches (e.g. 4.50 vs 10.4 ms, 1,000 paragraphs, W = 32). Crossover "from below 30 to about 190 paragraphs of 256 break points". GPU check: 0 mismatches in 24,823,200 values.

**Status:** Answer to Cheng: "For many paragraphs, yes" and "For one paragraph, no." Also "a kernel over every entry isn't enough." Open: Sklansky's network, the demo's justified cost, a GPU mode for the page, mixed-length batches. Crossover counts "aren't a stable result" across Chrome sessions.

**Visual idea:** A paragraph's break points as dots on a line; a W x W min-plus matrix tile drops onto each, then tiles pair up level by level in a Brent-Kung tree (the tree program has 230 layers) racing a chain that steps through one break point at a time (10,232 layers), ending with pointer arrows hopping back by doubling to light up the chosen breaks.

**Sources:**
- lab/knuth-plass/README.md:1-470 (all sections read)
- lab/knuth-plass/program.ts:47-136
- lab/knuth-plass/reference.ts:1-50
- lab/knuth-plass/paragraph.ts:25-38, gpu/plan.ts:18-41, gpu/kernels.ts:21-207 (export signatures only)
- lab/status.md:240
- commit 4ea7fcb
