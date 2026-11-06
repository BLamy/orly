# runtime-cost

**Question:** On the CPU, how much of a circuit's run time is allocation and output copying, and what does a layer cost apart from its operations?

**Mechanism:** `lab/runtime-cost/report.ts` `runRuntimeStudy` times three circuits: a two-operation coordinate transform (with a direct scalar-JS baseline), the candidate gallery and HandwiredOS's window manager. `measure` compares `circuit.evaluateReference`, `circuit.evaluateTensor` (returns the full wire array) and the opt-in `circuit.createTensorEvaluator(roots)` (reuses buffers and returns only the requested outputs). It takes seven samples, rotates the method order, warms each method 200 times, and requires matching checksums. `lab/runtime-cost/layers.ts` builds the same 16,384 two-term sums (`roundAffine`) as chains of 64, 1,024 and 16,384 so that the compiled program has that many layers. It times each layer count in its own process (`Bun.spawnSync`) and checks the chain total.

**Result:** From `layers.ts` (README, October 14, 2026; Bun 1.4.3, Apple M5 Max): 54 to 55 µs in 64 layers, 64 to 65 µs in 1,024, and 210 to 214 µs in 16,384, "about 10 µs per 1,000 layers". When the three counts were timed in one process, 1,024 layers took 82 to 86 µs. The README gives no fixed numbers for `report.ts`'s three-way comparison. status.md quotes it, e.g. one HandwiredOS evaluation at "35.76 µs against 35.96 µs" in that process.

**Status:** An ongoing measurement tool, not a finished claim: "rerun locally rather than treating a single ratio as an architectural guarantee." A September 16 caveat says timing several programs in one process makes typed-array reads polymorphic and "can distort later timings" (up to 10x in an earlier gather benchmark), "`report.ts` runs its three circuits in one process."

**Visual idea:** Two conveyor machines process the same 16,384 small additions. One is wide and short (64 layers), the other is a tall, thin tower (16,384 layers). Each layer is a belt stop with a fixed handoff pause. A stopwatch shows the tall tower finishing about four times later even though both did identical work, ticking roughly 10 µs per 1,000 stops.

**Sources:**
- lab/runtime-cost/README.md:1-13
- lab/runtime-cost/report.ts:1-77
- lab/runtime-cost/layers.ts:1-58
- lab/status.md:32-34, 160, 230
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
