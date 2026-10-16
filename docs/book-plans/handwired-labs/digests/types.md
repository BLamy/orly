# types

**Question:** How do lab folders written before wires had their own type keep type-checking after the core gave `Wire` a brand?

**Mechanism:** `lab/types/loose-wires.d.ts` augments the module `../../src/runtime/numeric-ui-core.ts` by setting `WireTypeOptions { looseWires: true }`. In the core, `type Wire = number & WireBrand`, where `WireBrand` is `unknown` when `looseWires` is set and a unique-symbol brand otherwise (`src/runtime/numeric-ui-core.ts:13-19`). With the file included, a plain number such as `circuit.assumeRange(0, 0, 1)` still counts as a wire. Labs opt in by listing `../types/loose-wires.d.ts` in their tsconfig `include`, e.g. `lab/runtime-cost/tsconfig.json`. A grep finds it in about 20 tsconfigs, including data-adapter, learned-interpreter, cascade-argmax, user-effort, reusable-layout, runtime-cost, event-window, generative-fields, trace-compiler and many ui-exploration folders. `lab/candidate-gallery/tsconfig.json` does not include it and uses `asWire` instead.

**Result:** Not an experiment and has no result. It is an 11-line compatibility shim.

**Status:** Legacy support. The file says "New code gets wires from circuit.source(index), circuit.constant(value) or asWire(position) instead."

**Visual idea:** Two doors into the circuit builder. One has a strict lock that only accepts tokens stamped "Wire" (from `source`, `constant` or `asWire`). The other, labelled "lab, pre-brand", lets bare numbers walk through. A switch marked `looseWires: true` swaps which door a folder's tsconfig uses.

**Sources:**
- lab/types/loose-wires.d.ts:1-11
- src/runtime/numeric-ui-core.ts:10-24
- lab/runtime-cost/tsconfig.json, lab/candidate-gallery/tsconfig.json
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
