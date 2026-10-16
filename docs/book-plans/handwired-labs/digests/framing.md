# Framing digest: lab/ status documents (chenglou/handwired @ 4ea7fcb)

## What the labs are for

The labs test UI behavior as a fixed FP32 numeric circuit (weighted sums, ReGLU gates, boolean atoms). The reassessment names the question: "what making small pieces of behavior editable and learnable enables". Its bottom line: "Keep the smaller numeric representation and the ambition to learn useful computation." The labs are learning experiments plus runtime studies, and since September some also time ordinary JS tasks on CPU and WebGPU.

## Per-lab status table

| Lab | Status as stated in these docs | Key quote (short, exact) | Date of last update if given |
| --- | --- | --- | --- |
| learned-interpreter | Hard-loss optimizer corrected via loss scale | "coordinate 60/60; two adds 59/60 on integers, 15/60 with fractional FP32 checks" | Reassessment Sept 3, 2026 |
| reusable-layout | Built (reassessment's main proposal); transfers to new counts/widths | "learned responsive sizing within a fixed flow layout, not generation of arbitrary page structures" | not given |
| user-effort | Built; simulator-only | "No human observations, error prediction, or usability claim." | not given |
| data-adapter | Built; exact search baseline | "No neural training." | not given |
| event-window | July round one; compression bug fixed | "Training supplies correct internal state and decision labels." | July 2026 (round one) |
| generative-fields | July round one; claims weakened | "valid samples do not establish a smooth valid interpolation" | July 2026 (round one) |
| cascade-argmax | Soft training then hardening | "This fits a table, not a shared query/key rule." | not given |
| trace-compiler | Runtime study; oracle bugs fixed | "Its source interpreter is independently checked against native JavaScript" | not given |
| runtime-cost | Runtime study, CPU only | "compare it with the evaluators that return full arrays, on the CPU" | not given |
| hard-attend | Comparison page | "compares one-hot, direct and softmax gathers" | moved into lab/ Sept 16, 2026 |
| candidate-gallery | Comparison page | "a balanced argmax picks one" | moved into lab/ Sept 17, 2026 |
| learned-gallery | Promoted to src/; lab keeps only the measurements | "the network is fitted to one sketch at a time" | Oct 14, 2026 |
| json-search | Measurements only; page and code moved to src/ | "Against JavaScript in 8 workers: still no." | Oct 14, 2026 |
| knuth-plass | CPU + WebGPU timing study | "Uploading line costs computed in JavaScript never beats the typed-array loop." | Sept 17, 2026 |
| ui-exploration | Historical record plus guide | "16 of the 24 prototypes remain" | Sept 12-14, 2026 (trimmed Sept 16) |
| gather-lowering | Landed in core; tests moved to tests/runtime/ | "it does not discover query/key scoring" | Sept 17, 2026 |
| regex-search, json-highlighter | Removed; lessons moved to docs/patterns.md | "Nothing beat a loop over 32-bit words" | Oct 14, 2026 |
| exp-ste-backprop / exp-ste-reveal, exp-behavior-cells-relations | Superseded | "Made unnecessary by three independent routes" | July / Sept 16, 2026 |

## Reassessment

Two main findings. The learned interpreter's 0/20 failure came from loss scale, not architecture: multiplying losses by 1,000,000 gives 20/20, the same as shrinking Adam's epsilon. So "the old 0/20 result was not sufficient evidence to abandon them". And "some correctness checks compare implementations that share the same mistake".

- **Kept:** the numeric representation, the learning ambition, the sign cascade "as an exact forward construction", and the gather optimization (about 1.29x speedup).
- **Reframed:** generative-fields (1,408 of 4,154 repairs hid items), event-window (a demo bug, and recurrence remains), cascade-argmax (no learned query/key rule), gather-lowering ("neither learned query/key scoring"), trace-compiler (its oracle shared the compiler's bugs).
- **Dropped:** no lab was dropped. It retired nine claims, including "A latch is attention with one slot" and "Compiling ordinary source is a dead end". It also retired the shared brief's "take these as given" framing.
- **Proposed:** finish the numerical diagnosis, learn a reusable layout rule, separate predicting users from choosing for them, and build data adapters. These became reusable-layout, user-effort and data-adapter.

## Open threads

1. Do fractional training examples pin down how additions are grouped? Can the method scale without a complete loss table?
2. Can a shared query/key rule be learned? Decision 8 recommends retrieving a rectangle by id with soft attention, then running it with argmax.
3. Getting UI evidence from "an explicit human task, not from interpreting synthetic preference scores as usability".
4. FP32 order sensitivity. `emitArgmax` picks depend on build order for scores 2 to 5 FP32 steps apart. Gradients depend on statement order.
5. Depth and GPU. The recommendation is to measure one per-layer GPU pass first. HandwiredOS took 2.2 ms per evaluation on WebGPU against 81 µs on the CPU.

## Sources

- Overall question: lab/reassessment-2026-09-03.md:7, :186; lab/research-sweep.md:10
- Status table: lab/status.md:196-204, :212, :220, :228, :230, :103, :120, :240, :237, :289-290; lab/research-sweep.md:27-35
- Reassessment: lab/reassessment-2026-09-03.md:9, :25-38, :100, :105-107, :109-128, :130-175
- Open threads: lab/status.md:40, :170-171, :185, :187, :244, :246
