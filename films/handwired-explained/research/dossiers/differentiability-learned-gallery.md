# Dossier: Deep Dive 3: Gradients Through a Handwritten Program (the Learned Gallery and End-to-End Training)

- Topic id: `differentiability-learned-gallery`
- Era: the repo between 2026-06-09 (first backward pass) and 2026-10-16 (pinned commit `257856e`). Most of the material dates from Sept-Oct 2026.
- Local clone: `/Users/blamy/Documents/Codex/orly-2/.orly-work/repos/handwired` (`git log -1`: `257856e 2026-10-16 17:33:49 -0700`; `git rev-list --count HEAD` = 825, the same as the 825 commits GitHub shows on `main` on 2026-10-27 [S30]).
- Researcher run: 2026-10-27, Bun 1.4.3, macOS arm64.
- Source convention: `GH/<path>#Lnn` means `https://github.com/chenglou/handwired/blob/257856e/<path>#Lnn`, which is the same as `chenglou/handwired@257856e:<path>#Lnn`. Section 11 lists the numbered URLs.
- **Run record.** One script ran in full: `/private/tmp/claude-501/-Users-blamy-Documents-Codex-orly-2/a761f115-e5d3-4a45-b429-b6ac42e99b03/scratchpad/grad.ts`, run as `bun <script>` from the clone (output quoted in section 5.4). After that, the session's permission classifier blocked a second script and `bun test lab/cascade-argmax/ramp.test.ts`. For that reason, the one-Adam-step number and the toy ReGLU numbers in 5.4 are **worked by hand from the code** and labeled that way. Before any of them goes on screen, a stage with run permission should re-run them (commands given in 5.4).

---

## 1. Summary

**The claim.** The README's first line says: "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" [S1 L3]. It lists two training ideas under "funny use-cases": "unfreezing the weights and train them (what does that even do? Let's find out!)" and "attaching a specific frozen program to a generic neural net and train end-to-end (now a nanoGPT can do both Shakespeare and your particular UI?)" [S1 L34-35].

**What the backward pass is.** `Circuit.backpropagateReference(values, outputGradients, options)` walks the operations from last to first. It reads each wire's stored forward value and accumulates gradients [S2 L654-745]. It "differentiates the intended real arithmetic, not literal floating-point rounding" [S3 L36]. Rule by rule:
- An affine sum passes the output gradient times each coefficient.
- A ReGLU `left × max(0, gate)` passes `grad × max(0, gate)` to `left`. It passes `grad × left` to `gate` **only when gate > 0**, so a ReLU's corner has slope 0 [S2 L728-743].
- `multiply` and `select` macros are differentiated as whole products, not as their ReLU halves [S2 L673-683; S3 L34].
- A boolean atom **throws** unless the caller passes `{booleanGradient: 'straight-through'}` [S2 L718-724].
- An index read throws unless the caller passes `{indexGradient: 'zero' | 'backward-difference'}` [S2 L685-716].

**The learned gallery** (`src/learned-gallery/`) is the only demo whose weights are trained. Its network:
- has 20 output slots, of which the page uses up to 12;
- feeds each slot 10 fixed features (a constant 1, the slot's position in −1..1, and sin/cos of π·f·position for f = 1..4) through two ReGLU layers of 6 units, then a linear readout to left, top, width and height;
- has 244 trainable coefficients stored as **source cells**, and compiles to **6,320 operations in 8 layers** [S4 L3; S6 L207-303; run R1].

The loss has two parts:
1. a Huber loss on each photo's four edges against the sketch (threshold 0.08, with stage = 1);
2. a misalignment penalty between photo edges of the same kind, helped by an augmented-Lagrangian-style "method of multipliers" kept by ordinary code.

Training is Adam (lr 0.008, β₁ 0.9, β₂ 0.999, ε 1e-8, gradient norm clipped to 1, weights clamped to ±6, decay 2e-7) on gradients from `circuit.backpropagateReference` [S4 L3, L22-33; S6 L82, L451-462, L703-768]. A `trainOrUndo` loop takes a frame back when it raised the function it follows. The page trains at 600 steps a second at any frame rate [S4 L17].

**No straight-through in the gallery.** The gallery's network has no boolean atoms and no index reads. It calls `backpropagateReference(values, outputGradients)` with **default options** [S6 L739]. The straight-through estimator does exist in the repo, as one option, and is used in `lab/generative-fields/ste-backprop.ts` and in drag-knobs' strategy A [S9; S10 L103-113]. The lab measured it as biased in two places, by very different amounts: generative-fields reports "up to ~1.5x phantom gradient" (173 against a true slope of 120) [S11 L80, L126]; drag-knobs found 592 of 2,250 checks off on candidate-gallery, e.g. a gradient of 692,700 where the finite difference is 0 [S10 L111; S15 L156, L242]. **"~1.5x" is generative-fields' figure only; don't present it as the general size of the bias** (fact-check FC2).

**Hard 0/1 selectors give zero or useless gradients.** At whole-number inputs, an integer bit `relu(v−4) − relu(v−5)` reports slope 0, except exactly at the threshold, where it reports the left side's slope, 1. That "describes the ramp, not the decision" [S10 L60-63, L91]. The hard argmax cascade gives the score cells gradient `[0, 0]`; `lab/cascade-argmax/ramp.test.ts` asserts exactly that [S12 L16-25]. The repo's answer is to **train a soft version and run the exact one**. One soft clipped ramp learns 160/160 table selections over seeds 101-110 before "exact hardening" [S13 L202; S12 L5-14].

**What "unfreezing" does in practice.** A hand-written number is a coefficient baked into an operation. To train it, builder code must declare it a `constant` **cell** instead [S14 L51]. The backward pass then reaches it. Drag-knobs did this to five design numbers of an app shell: 63.6% of moving drag frames were solved by one gradient step, and 24.6% started with gradient 0 for every unlocked knob [S15 L233, L240]. The gallery's 244 weights were never a hand-written program. They start from a seeded random initialization [S6 L314-377]. HandwiredOS has "none ... trained" [S16 L3].

**The "What learns" table** (status.md) [S13 L192-206]:
- learned interpreter: coordinate 60/60; two adds 59/60 on integers, 15/60 with fractional FP32 checks;
- reusable layout: 121 shared parameters;
- user effort: 5 coefficients, 1.68 ms held-out error against the simulator mean;
- data adapters: exact search over 868 programs, "No neural training".

**End to end.** Attaching a frozen program to a generic neural net (nanoGPT) **has not been done in the repo**. "nanoGPT" and "Shakespeare" appear only in README line 35. No lab experiment, test or code trains a generic net through a frozen Handwired program [grep, section 7]. It is an aspiration phrased as a question.

**A worked gradient (run R1).** Take the Story preset at its seeded weights. The output bias for "left" (parameter 240, value 0.5) has `backpropagateReference` gradient **0.00236120680**. The central difference gives **0.00236120684**. The hand formula (1/40)·Σ[clip(e_left) + clip(e_right)] over the 10 rectangles gives **0.00236120684**.

---

## 2. Timeline

| Date (PDT) | Event | Source |
|---|---|---|
| 1964-03 | Peter J. Huber, "Robust Estimation of a Location Parameter", *Ann. Math. Statist.* 35(1):73-101. The Huber loss the gallery uses comes from here (the repo doesn't cite it). | [S20] |
| 1969 | Hestenes ("Multiplier and gradient methods", JOTA 4:303-320) and Powell ("A Method for Nonlinear Constraints in Minimization Problems") introduce the method of multipliers. The gallery's code names "the method of multipliers" but cites no paper. | [S21][S6 L124] |
| 2013-08-15 | Bengio, Léonard and Courville post arXiv:1308.3432, which names the "straight-through estimator". Context only. The repo does cite it once: lab/ui-exploration/learned-bits/README.md L264 lists "Bengio, Léonard and Courville, ... 2013 (https://arxiv.org/abs/1308.3432)" as the source of the straight-through estimator (fact-check FC1). | [S22][S32] |
| 2014-12-22 | Kingma and Ba post "Adam: A Method for Stochastic Optimization" (arXiv:1412.6980). | [S23] |
| 2020-02-12 | Shazeer, "GLU Variants Improve Transformer" (arXiv:2002.05202), defines ReGLU(x,W,V,b,c) = max(0, xW + b) ⊗ (xV + c). Same form as Handwired's `reglu`; the repo doesn't cite it. | [S24] |
| 2026-06-03 20:24 | First commit of the repo: `3d2c717` "Create numeric UI atom lab". | [S25] git log |
| 2026-06-09 19:35 | `515d6a8` "Add differentiable UI fitting demo", the first commit containing `backpropagateReference` (`git log -S`). | [S25] |
| 2026-06-10 01:47 | `00c1048` "Learn gallery geometry coefficients", the origin of trainable-geometry.ts (`git log --follow`). | [S25] |
| 2026-09-03 06:13 | `c6bf933` "Fix circuit semantics and test reusable learned rules" adds the learned-interpreter, reusable-layout, user-effort and data-adapter READMEs. The September 3 reassessment finds that "Some gradients are wrong for the intended calculation" (multiply at 0). User-effort results are "Observed September 3, 2026". | [S25][S17 L76-82][S19 L44] |
| 2026-09-16 07:24 | `d769a2e` moves the learned gallery into lab/. | [S25][S5 L7] |
| 2026-10-13 | The gallery page is rebuilt as one of the `bun start` demos. Training continues during edits. Cheng asks for "a bigger penalty or adjustable one ... for grid being unaligned" (the request itself is undated in the source); the first answer, dated October 13, snaps the sketch with ordinary code. | [S5 L9, L13] |
| 2026-10-14 05:50 | `59b12cd` "Cleanup" is the earliest commit whose README has the "unfreezing the weights" and "nanoGPT" lines (`git log -S`). | [S25] |
| 2026-10-14 08:59 | `19509c1` promotes the gallery to src/learned-gallery. Since this day "nothing straightens the sketch": the penalty is part of the loss. | [S25][S5 L13] |
| 2026-10-14 23:19 | `4c63d9b` moves the gallery's measurements into lab/learned-gallery/README.md. | [S25] |
| 2026-10-16 17:33 | `257856e`, the commit pinned for the film. | git log |
| 2026-10-27 | Live demo page shows the gallery card "Unfreeze a compiled program's weights & train them in real time." | [S26] |

---

## 3. People

**Cheng Lou (`chenglou`)**, the author of the repo (GitHub owner of `chenglou/handwired`; demo site at chenglou.me) [S26][S30]. Per the brief, only what the repo says:
- In the gallery's history he is the one who asked for the penalty and rejected the snapping fix: Cheng asked for "a bigger penalty or adjustable one for learned gallery for grid being unaligned", and later said "the spirit of the gallery is to learn something. Snapping to some alignemtn is just a simple thought." [S5 L13] (his typo "alignemtn" is in the source).
- The differentiability guide records his preference: "keep the run-time program exact, take gradients where the math is continuous, and for discrete choices search over instances, or train a soft version and run the exact one" (attributed as "The recommendation matches Cheng's preference") [S10 L17].
- **Appearance:** the repo gives none. Do **not** model a likeness. For silhouette depiction use a generic, unidentifiable figure at a desk (any build; no distinctive hair or glasses chosen to resemble him), or show only hands and a screen.

**"A reviewer"** (unnamed) appears in the lab README as having "measured 725 steps a second on a busier machine" [S5 L9]. Do not name or depict this person.

**Outside names, as context only** (not the repo's lineage): Yoshua Bengio, Nicholas Léonard and Aaron Courville (Université de Montréal) for the straight-through name [S22]; Diederik Kingma and Jimmy Ba for Adam [S23]; Noam Shazeer for ReGLU [S24]; Andrej Karpathy as author of nanoGPT [S27]. The film doesn't need these people as characters. If they are shown at all, credit them on screen as text cards rather than silhouettes.

---

## 4. The belief of the age

**Inside the repo: "differentiable" versus "useful gradient".** The README's slogan is "fully differentiable" [S1 L3], because the program is only weighted sums and ReLU products [S1 L27-29]. The repo's own docs immediately narrow that word:
- "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding." A soft comparison or custom derivative "is a training choice, not an exact derivative of a hard decision" [S3 L36].
- The differentiability guide states the distinction directly: "That's the difference between "the backward pass runs" and "the gradient is useful"" [S10 L93].

So the belief that holds *in the repo itself* is two-sided:
- Every program has a backward pass, and continuous parts (affine sums, products, selects, ReLUs away from corners) give true gradients.
- Every exact decision is a step, whose slope is 0 almost everywhere. The backward pass "either throws (the boolean atom), reports 0 (the sign cascade, and integer bits on whole numbers), or reports the slope of a ramp that the program never uses" [S10 L13].

**Who dissented, and what changed.** The September 3, 2026 reassessment overturned two earlier beliefs inside the project:
1. **That the multiply's gradient was right.** It wasn't: "the derivative of `3 * variable` with respect to `variable` at zero is three. `emitMultiply` expands signed multiplication into two ReLUs, and the chosen zero-slope convention at their shared corner makes the backward pass report zero" [S17 L78]. The same paragraph adds: "Reversing the operand order gives three." The note was written as "findings before implementation" [S17 L3]; the fix landed in the same commit, `c6bf933` (2026-09-03 06:13 PDT), which also introduced the multiply macro in the backward pass (`git log -S"macro?.kind === 'multiply'"`). The fix kept `multiply`/`select` as macros so the backward pass differentiates the whole product [S3 L34; S13 L216].
2. **That the learned interpreter couldn't learn composition.** It could: "An Adam epsilon that dominated small gradients caused most of the reported hard-loss failure" (ε 1e-8 → 1e-14) [S7 L7, L56].

**The wider field's habit (context).** ML commonly trains through hard decisions with surrogate gradients, and the straight-through estimator is the classic one [S22]. The repo treats this as an explicit, opt-in, biased choice, not a default. It throws instead of silently returning zeros, "so a training loop can't silently receive zeros for the index" [S3 L112].

---

## 5. Experiments and results

### 5.1 The learned gallery's network: exact sizes

From `createTrainableGeometryCircuit` and `createParameterLayout` [S6 L172-303]; counts confirmed by run R1.

**Inputs per slot** (fixed while building, not cells). The slot position is `p = item/(slotCount−1)·2 − 1`, so the 20 slots run from −1 to +1. The features are `[1, p, sin(πp), cos(πp), …, sin(4πp), cos(4πp)]`, which makes **10 features**. The network has **no runtime input besides its weights** [S13 L203 "The program has no input besides the weights"].

**Layer 1.** 6 ReGLU units, each `(Σ wL·feature + bL) × max(0, Σ wG·feature + bG)`. That is 6×10 left weights + 6 left biases + 6×10 gate weights + 6 gate biases = **132**. Because the features are build-time constants, they sit in the *coefficients*, and the weights are the *wires* (cells).

**Layer 2.** 6 ReGLU units over layer 1's 6 outputs: 36 + 6 + 36 + 6 = **84**. Here weight × activation is a wire × wire product, so it goes through `emitMultiply`.

**Readout.** 4 outputs (left, top, width, height) × 6 weights + 4 biases = **28**.

**Total.** 132 + 84 + 28 = **244 parameters** = the 244 source cells. The program has **6,320 operations** (R1: `operations 6320 sourceSize 244`) in **8 layers** [S4 L3].

**Initialization** is a seeded LCG (seed `0x517a9e`):
- first-layer weights uniform ±√(2/16);
- gate biases 1 ± 0.05, so every unit starts open;
- output biases left = top = 0.5 and width = height = 0.18.

So every photo starts as a small square near the stage's center: "The seeded weights put the photos in a pile" [S6 L314-377; S4 L28].

**Matching.** By default (`matching: 'assignment'`), a minimum-cost assignment in ordinary JS pairs sketch rectangles with output slots before each step (`minimumCostAssignment`, a potentials-based Hungarian-method routine) [S6 L379-449, L573-585]. In R1 the Story preset's 10 targets paired with outputs `[7, 0, 8, 6, 3, 2, 9, 5, 4, 1]`. The big hero rectangle (target 0) went to output slot 7.

### 5.2 The loss and the optimizer

**Distance term.** The Huber loss of each photo edge (left, right = left + width, top, bottom = top + height) against the sketch's edge: ½e² for |e| ≤ 0.08, linear beyond. Its gradient is `clip(e, ±0.08)`. It is averaged over rectangles × 4 edges [S6 L72-82, L451-462]. Edges are compared rather than width and height because "with a loss on the width, a pull on a right edge also moved the left edge" [S6 L74-78].

**Misalignment penalty.** For every pair of same-kind photo edges:
- the pull is `clamp(multiplier + 5·gap, ±(reach − |gap|))`, strongest when nearly aligned and 0 from one reach on;
- it is divided by the number of edges on the two lines, and weighted ×2 against the distance term;
- it stays off after a reset until the distance is < 1e-6 (or 1,000 steps), then ramps over 200 steps [S6 L84-123, L136-157; S4 L22-28].

The slider runs from off to 8% and starts at 4%; the penalty's reach is half the slider's value [S4 L25].

**Multipliers.** Ordinary code grows one number per edge kind and pair by 0.02·steps·5·gap per frame, which is "the method of multipliers". "A gap that stays open is pulled harder and harder until it closes" [S4 L24; S6 L124-133, L612-627].

**Adam settings** [S6 L703-768]:
- lr 0.008;
- β₁ 0.9, β₂ 0.999, ε 1e-8, with bias corrections;
- weight decay 2e-7 added to the gradient;
- whole-gradient norm clipped to ≤ 1;
- every weight clamped to [−6, 6] after a step.

**Why weight decay matters.** "Without any decay, a unit whose gate has closed gets no gradient and stays shut: over 200 random edits in a row, 2 to 4 of the first layer's 6 units can end shut, where with this decay at most 2 do, and mostly 1 or none" [S4 L29]. This is the ReLU gate rule (gate ≤ 0 → no gradient) seen at the scale of a whole unit.

**`trainOrUndo`.** A frame of steps is taken back (weights and Adam moments restored) when the followed function rose. The rate then halves, down to 1/64, and further down to 1/4096 after 5 rejected frames in a row at 1/64. A kept frame multiplies the rate by 1.15, up to full. Frames train 2 or more steps, or none [S4 L30-31; S6 L864-897].

**Page numbers** [S4 L17, L34; S13 L203]:
- 600 steps/s at any frame rate (10 steps per frame at 60 Hz, 5 at 120 Hz), at most 20 steps and 6 ms per frame;
- first fits of 630-750 steps (Story), 1,360-1,840 (Cinema) and 860-980 (Contact sheet) per the src README. status.md gives slightly different ranges: 579-763, 1,299-1,932 and 860-1,021 "depending on how the training steps are divided into frames". **Quote one source per number; don't mix them.**
- one step takes "about 0.2 ms in Bun and 0.34 to 0.41 ms in Chrome 155 on an Apple M5 Max" [S4 L34]. (A code comment in learned-gallery.ts L275-276 gives an earlier measurement: "One step took 0.26 ms in Bun and about 0.4 ms in Chrome 155 on an M5 Max (October 13, 2026)". Quote the README's figure and don't mix the two; FC6.)
- 41 tests in about 20 s [S4 L9] (README claim, not re-run here).

### 5.3 Hard selectors and gradients (with numbers)

**Integer bit `[v >= 5]` = `relu(v−4) − relu(v−5)`**, which is the README's `above4` [S1 L19]. Backward-pass slopes measured in the guide [S10 L70-72]: v = 4 → 0; v = 4.5 → 1; **v = 5 → 1** (left-side slope at the corner); v = 6 → 0. The README's worked example uses a = 5, so asking the program "how would `result` change if `a` moved?" returns 1 × (10 − 12) = **−2**. That is the slope of a ramp the program never uses on integers. (Derived from the select rule: gate gets `on − off` [S10 L41], with the integer-bit row at v = 5; not run.)

**Scope of the "1 at the threshold" row (FC7).** It holds for the hand-written construction `relu(v−4) − relu(v−5)` measured in the guide. `emitCompare`'s own integer bits are described differently: they "give an operand a nonzero gradient only when `D` is a fraction strictly between -1 and 1 ... That only happens when a grid declaration is false" [S3 L143]. So don't generalize "slope 1 at the threshold" to every integer bit the runtime builds; on true grid values `emitCompare`'s bits report 0.

**Boolean atom after a ×256 rounding stage.** It throws by default. With straight-through it reports 256 for a − b = 2⁻¹⁰ and 0 for a − b = 0.25, where the true slope is 0 in both rows [S10 L73-75].

**Sign cascade.** Its gradient is 0 at d = 0.3 and 2³⁰ inside a ramp 2⁻³⁰ wide [S10 L76-78].

**Hard argmax cascade.** `ramp.test.ts` asserts the gradient to both scores is `[0, 0]` for scores [0.4,0.6], [0.6,0.4], [0.5,0.5] and [0, 2⁻¹⁴⁹] [S12 L16-25]. The soft single clipped ramp trains the selection table: hardened 100% correct over seeds 101-110, with less than half the operations of the seven-stage soft cascade [S12 L5-14; S10 L123]. The status table reports this as "A single clipped ramp recovers 160/160 table selections over ten fresh seeds before exact hardening" and limits it to "This fits a table, not a shared query/key rule. Hard score gradients still provide no useful learning signal." [S13 L202]

**What the repo uses for hard decisions**, ranked by the guide [S10 L17, L103-123]:
1. **Freeze decisions** (the exact slope inside the current region). This is drag-knobs' "frozen" booleans.
2. **Soft relaxation + annealing, then hardening.** event-window recovered all 20 seeds this way, with 0 divergences over 30,000 held-out frames.
3. **Straight-through** (one option, biased).

**Straight-through in code.** `lab/generative-fields/ste-backprop.ts` is 10 lines. Its comment reads: "Exact forward values, explicitly substituted identity derivative for booleans." [S9 L8]. Bengio, Léonard and Courville 2013 is the conventional reference for the name [S22]. **The gallery does not use it.**

### 5.4 A worked gradient for one parameter (run R1, real numbers)

**Command:** `bun /private/tmp/claude-501/-Users-blamy-Documents-Codex-orly-2/a761f115-e5d3-4a45-b429-b6ac42e99b03/scratchpad/grad.ts` from the clone, 2026-10-27. The script:
1. builds `createLearnedGalleryMachine('story')`;
2. evaluates with `circuit.evaluateReference`;
3. seeds the output gradients with the Huber slopes (penalty reach is 0 in a fresh machine, so the loss is the distance term alone);
4. calls `circuit.backpropagateReference`;
5. compares five parameters against central differences of `machine.evaluate().loss` with h = 1e-3.

**Fact-check note (FC10).** The 2026-10-28 fact-check tried to re-run this script and was blocked by the permission classifier, so the digits below rest on this one run record. The structure was checked against the code: `trainStep` scales every edge slope by 1/(targets × 4) and adds a right edge's slope to both the left and the width output [S6 L703-724], and the 4-decimal table below sums to 0.0945 → 0.0023625. A stage with run permission must re-run it before any digit goes on screen.

**Output (verbatim excerpts):**
```
parameterCount 244 operations 6320 sourceSize 244
targets 10 outputByTarget [ 7, 0, 8, 6, 3, 2, 9, 5, 4, 1 ]
loss at seed 0.01298888279752879
outputBiasLeft weight 0.5 backprop 0.00236120680347085 central diff 0.002361206844449883
outputBiasWidth weight 0.18000000715255737 backprop 0.0002646252978593111 central diff 0.0002646252959962219
outputWeightLeft0 weight -0.03639224171638489 backprop -0.00413435697555542 central diff -0.004134245658641387
firstGateBias0 weight 0.9843534231185913 backprop 0.00026599771808832884 central diff 0.00026599380835378426
firstLeftWeight0_1 weight -0.24011696875095367 backprop -0.0002803778334055096 central diff -0.0002799110373212158
hand outputBiasLeft 0.002361206844449042
after 700 plain Adam steps loss 3.7398655193879306e-8 ms 397
```

**Parameter 240, the "left" output bias, by hand.** Every slot's left is `Σⱼ W_left,j·h2ⱼ + b_left`, so ∂left/∂b_left = 1 for each slot. The right edge is left + width, so b_left moves both left and right edges. With 10 rectangles × 4 edges, the loss is a mean over 40 terms:

> ∂Loss/∂b_left = (1/40) · Σₖ [ clip(e_left,k) + clip(e_right,k) ], with clip at ±0.08

Errors per target at the seeded weights (run R1; output − sketch, stage = 1):

| target→slot | e_left | e_right | clipped sum |
|---|---:|---:|---:|
| 0→7 (hero) | +0.3813 | +0.0047 | 0.0847 |
| 1→0 | −0.1725 | −0.2577 | −0.16 |
| 2→8 | −0.1647 | −0.3209 | −0.16 |
| 3→6 | +0.3039 | +0.3280 | +0.16 |
| 4→3 | +0.2359 | +0.1525 | +0.16 |
| 5→2 | −0.0238 | −0.0618 | −0.0856 |
| 6→9 | −0.2354 | −0.2938 | −0.16 |
| 7→5 | +0.3026 | +0.3158 | +0.16 |
| 8→4 | +0.1947 | +0.1604 | +0.16 |
| 9→1 | −0.0523 | −0.0123 | −0.0646 |

The sum is ≈ 0.0945, and 0.0945 / 40 ≈ 0.00236. The script's unrounded hand sum is 0.002361206844, the backward pass gives 0.002361206803, and the central difference gives 0.002361206844. (With the 4-decimal errors shown above, the sum comes to 0.0023625. Show the unrounded result on screen.)

**Intuition.** Eight of the 20 edge errors exceed 0.08, so they each push with the same capped force. The hero's left edge is 0.38 too far right, but it pushes no harder than a photo 0.09 off. The Huber clip makes far-off photos vote, not shout. The total is slightly positive, so gradient descent lowers the bias: on balance, photos sit to the right of where they're drawn.

**The first Adam step on this parameter (hand-derived from the code, not run).** At step 1, the bias-corrected moments are m̂ = g and v̂ = g². So the step is lr · g / (|g| + 1e-8) ≈ 0.008 · sign(g). (The decay adds 0.5 × 2e-7 = 1e-7 to g. The global norm clip doesn't bind, because the gradient norm is far below 1.) So b_left goes from 0.5 to ≈ **0.492** after one step, a move of 0.8% of the stage width, whatever the gradient's size. That is Adam's sign-like first step [S6 L741-766]. Re-run to confirm: `m.train(1); m.source[240]`.

**A ReGLU toy for the screen (hand-derived from [S2 L728-743], not run).** Take one unit `y = (3w) × max(0, g + b)` with w = 0.5, g = 0.25, b = −0.1:
- gate = 0.15, left = 1.5, y = 0.225;
- ∂y/∂w = 3 × 0.15 = 0.45;
- ∂y/∂g = ∂y/∂b = 1.5.

Set b = −0.4 instead: gate = −0.15, y = 0, and **every** gradient is 0, including the gate's. That is the "unit whose gate has closed gets no gradient and stays shut" [S4 L29].

**Other checks from R1.** The gradients agree with central differences:
- to ~1e-8 relative for the output biases;
- to ~3e-5 relative for the output weight and first gate bias;
- to 0.17% for a first-layer left weight (FP32 forward noise at h = 1e-3).

700 plain `train` steps took the loss from 0.01299 to 3.74e-8 in 397 ms of wall time. That run includes extra evaluations per step and JIT warm-up, so it is not comparable to the README's 0.2 ms/step.

### 5.5 The "What learns" table (status.md, verbatim cells)

Source: [S13 L194-206].

| Experiment | What changes | Held-out result | Main limitation |
|---|---|---|---|
| Two-instruction interpreter | "Shared instruction probabilities, then two hard instructions" | "Corrected hard-loss optimizer: coordinate 60/60; two adds 59/60 on integers, 15/60 with fractional FP32 checks" | "Integer training cannot determine addition grouping. The hard-loss method evaluates all 3,600 complete programs before training." |
| Reusable layout | "121 shared parameters predicting each item's preferred width" | "Trained on 4/8 items; tested 6/12, new widths, longer captions, and different crops. Every required item retained in the study." | "Learns an authored preference objective, not human taste. Ordinary JS performs text measurement and flow layout." |
| User effort | "Five shared coefficients predicting task duration" | "192 held-out observations: 1.68 ms error against the simulator mean. Chooses the simulator's best candidate in 120/120 situations, including 20/20 unrestricted cases." | "Predictor features deliberately match the simulator. No human observations, error prediction, or usability claim." |
| Data adapters | "Exact search over 868 programs" | "Eight tasks recovered from 12 training scenes; all pass 438 held-out scenes with new counts, storage orders, and fractional values." | "No neural training. Lookup predicates and the rule for extracting a reusable function are authored. Capacity is 12." |
| Learned gallery | "244 shared weights that give each of up to 12 photos its left, top, width and height" | "No held-out test: the network is fitted to one sketch at a time." … | "The program has no input besides the weights, so it can't lay out for e.g. a window size it wasn't trained on." … |

Footnote under the table, verbatim: "Learned parameters can occupy source cells beside changing application inputs. That storage choice does not turn parameter fitting into a different learning algorithm. The reusable layout and effort models train shared parameters once, then replace only features at inference." [S13 L206]

**Details behind each row:**
- **Learned interpreter** [S7]:
  - The vocabulary is add/subtract/multiply over 4 runtime inputs: 48 first-instruction × 75 second-instruction candidates = 3,600 programs. There are 123 shared program cells.
  - Training runs 500 Adam steps per phase at temperatures 2 → 0.125.
  - The fix was ε 1e-8 → 1e-14. With it, every row recovers 19-20 of 20 seeds **on the integer training domain**, against 0 of 20 with the original ε. Under full fractional certification the two-add rows recover only 5, 3 and 7 of 20 (coordinate rows stay 20/20) [S7 L67-74]. Say "integer domain" whenever the 19-20/20 figure is used (FC8).
  - Building the loss table takes 707,472 + 53,060,400 instruction evaluations, so "No method here avoids exhaustive evaluation by learning from executions alone."
  - Worked FP32 grouping example: pointerX = 1, panelLeft = 2⁻²⁴ and distractor = −1 give 0 one way and 2⁻²⁴ the other [S7 L46-48].
- **Reusable layout** [S8]:
  - 8 features → 12-unit ReLU hidden layer → 1 width: 8·12 + 12 + 12 + 1 = **121** parameters, in 133 operations and 5 layers per item.
  - Training covers 96 layouts / 576 item examples, 160 epochs, 0.8-1.0 s per seed.
  - Held-out preference loss: 0.0259-0.0266 for the learned rule, against 0.0229 for search and 0.3727 for wrapping (short captions).
  - "There is no gradient through wrapping."
- **User effort** [S19]:
  - 5 coefficients, 6 operations, 3 layers.
  - Adam: 800 updates, lr 0.04, ε 1e-8.
  - 720 train / 192 held-out observations.
  - RMS error 20.22 ms on noisy observations (the noise SD is ~20.21) and 1.68 ms against the simulator mean, versus 133.94 for a constant baseline.
- **Data adapter** [S18]: 7 × 4 × (1 + 5 + 25) = 868 programs; about 60 ms of search; "Nothing trains neural weights here."

### 5.6 "Unfreezing" in a hand-written program: drag-knobs

[S15]
- **Setup.** drag-knobs lifts five design numbers of layout-tree's app shell into source cells: card padding, grid gap, minimum card width, sidebar width and title font scale. A drag seeds a gradient on the dragged edge and backpropagates to the knobs. When needed, it searches 256 candidates as instances of the same circuit.
- **Results.** 63.6% of moving frames were solved by the first step (82.5% with every knob unlocked). 24.6% started with gradient 0 for every unlocked knob. 24.2% had a step that flipped some visible decision.
- **Straight-through.** Solved 16.5% of candidate-gallery frames in one step, against 38.2% with frozen booleans [S15 L233-242]. The guide gives 37.6% for the frozen figure [S10 L111]. **The two numbers disagree. Use the drag-knobs README's 38.2%, or avoid the number.**
- **Cost of keeping numbers learnable.** A spring with stiffness and damping as cells costs 546 operations, against 119 when they are baked into weights [S10 L5].

### 5.7 Apparatus for the art department

There is no physical apparatus. It's a browser page:
- a stage 5 wide by 4 tall (620 × 496 px at a 1440 px window; 538 × 430 px before Oct 14) [S5 L13];
- up to 12 photos (named e.g. "Blue Lagoon", "Autumn Road" [S28 L40-41]);
- the hand-drawn rectangles of the sketch;
- a loss readout, a step counter, and a loss chart under the photos (`chartStepCount` 1000);
- a "Misalignment penalty" slider and a Retrain button [S4 L13-17].

Presets [S28 L79-128]:
- **Story**: one large rectangle 0.6 × 0.52, two beside it, and a 4 × 2 grid below with 7 of its 8 cells filled; 10 rectangles.
- **Cinema**: one full-height hero rectangle plus a 2 × 5 rail with 8 of its 10 cells filled; 9 rectangles.
- **Contact sheet**: a 4 × 3 grid with 11 of its 12 cells filled; 11 rectangles.

(Each preset leaves its last cell empty "so that a click has room to add a rectangle" [S4 L15]; the cell counts are from `createGridCells(..., 4, 2, 7)`, `(..., 2, 5, 8)` and `(..., 4, 3, 11)` at S28 L81-125; FC5.)

The opening visual is true to the code: all photos start piled near the center at 0.18 × 0.18 of the stage, then slide out to their rectangles over about 1-3 s.

---

## 6. Verified quotes

| # | Quote (verbatim) | Speaker / document | Date | Source | Context |
|---|---|---|---|---|---|
| Q1 | "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" | Handwired README (Cheng Lou) | at 257856e, 2026-10-16 | [S1 L3] | Opening line |
| Q2 | "unfreezing the weights and train them (what does that even do? Let's find out!)" | README | first in 59b12cd, 2026-10-14 | [S1 L34] | Use-case list |
| Q3 | "attaching a specific frozen program to a generic neural net and train end-to-end (now a nanoGPT can do both Shakespeare and your particular UI?)" | README | first in 59b12cd, 2026-10-14 | [S1 L35] | Aspiration; nothing in the repo implements it |
| Q4 | "Unfreeze a compiled program's weights & train them in real time." | demo site card | live 2026-10-27 | [S26][S29 L170] | Gallery card ("real time" is italic) |
| Q5 | "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding." | docs/execution-model.md | 257856e | [S3 L36] | Gradient semantics |
| Q6 | "A soft comparison or a custom derivative is a training choice, not an exact derivative of a hard decision." | docs/execution-model.md | 257856e | [S3 L36] | Same paragraph |
| Q7 | "That's the difference between "the backward pass runs" and "the gradient is useful"." | lab/ui-exploration/guide/sections/differentiability.md | 257856e | [S10 L93] | After the selector table |
| Q8 | "the spirit of the gallery is to learn something. Snapping to some alignemtn is just a simple thought." | Cheng Lou, as quoted in lab/learned-gallery/README.md | Oct 13-14, 2026 | [S5 L13] | Rejecting the snapping fix (typo in source) |
| Q9 | "a bigger penalty or adjustable one for learned gallery for grid being unaligned" | Cheng Lou, quoted | undated in source (on or before Oct 13, 2026) | [S5 L13] | The request |
| Q10 | "No code moves a rectangle or a photo onto a line: the photos line up only because training lowers the penalty." | src/learned-gallery/README.md | 257856e | [S4 L19] | |
| Q11 | "Without any decay, a unit whose gate has closed gets no gradient and stays shut" | src/learned-gallery/README.md | 257856e | [S4 L29] | Weight decay rule |
| Q12 | "Learned parameters can occupy source cells beside changing application inputs. That storage choice does not turn parameter fitting into a different learning algorithm." | lab/status.md | 257856e | [S13 L206] | Under the "What learns" table |
| Q13 | "The hard cascade does not provide useful score gradients." | lab/cascade-argmax/README.md | 257856e | [S31 L9] | |
| Q14 | "Exact forward values, explicitly substituted identity derivative for booleans." | code comment, lab/generative-fields/ste-backprop.ts | 257856e | [S9 L8] | STE wrapper |
| Q15 | "Every weight of the program is written by builder code, and none is trained." | src/handwiredos/README.md | 257856e | [S16 L3] | Contrast with the gallery |
| Q16 | "No method here avoids exhaustive evaluation by learning from executions alone." | lab/learned-interpreter/README.md | 257856e | [S7 L80] | Honest limit |
| Q17 | "(we call this the straight-through estimator)" | Bengio, Léonard, Courville, arXiv:1308.3432 abstract | 2013-08-15 | [S22] | Naming of STE (context only) |
| Q18 | "The simplest, fastest repository for training/finetuning medium-sized GPTs." | nanoGPT README (Karpathy) | live 2026-10-27 | [S27] | What nanoGPT is |
| Q19 | "ReGLU(x, W, V, b, c) = max(0, xW + b) ⊗ (xV + c)" | Shazeer 2020, §2 eq. 5 (via ar5iv) | 2020-02-12 | [S24] | Definition |

**UNVERIFIED, do not use as quotes:**
- Adam's "Good default settings" caption (α = 0.001, β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸). The PDF text could not be extracted this session. The film may say the gallery uses β₁ 0.9, β₂ 0.999, ε 1e-8 (from the code), but shouldn't quote the paper.
- Any statement by Cheng Lou about nanoGPT beyond README line 35.

---

## 7. Debates and controversies

1. **Is a Handwired program "fully differentiable"?**
   - **For:** every operation has a backward rule, and continuous paths match finite differences [S10 L38-50; run R1].
   - **Against (the repo's own docs):** boolean atoms throw, index reads throw by default, hard selectors give 0 or ramp slopes, and literal FP32 rounding is not differentiated [S3 L36, L112, L143; S10 L13]. The learned interpreter README says: "They do not claim literal FP32 rounding is differentiable" [S7 L116].
   - **Film framing:** "differentiable as real arithmetic; the decisions have slope zero."
2. **Straight-through: useful or misleading?**
   - **For:** one option, exact forward pass. generative-fields used it, and it matches finite differences within 2% on continuous paths [S11 L80].
   - **Against:** phantom gradients, "up to ~1.5x" [S11 L126]; 592/2,250 drag-knobs checks off; 16.5% one-step success against 38.2% with frozen booleans [S15 L242]. The guide's ranking puts frozen decisions and soft-then-harden ahead of it [S10 L17].
3. **Does the learned gallery "learn"?** It fits one sketch at a time with "No held-out test", and "The program has no input besides the weights" [S13 L203]. It is an optimizer driving a tiny network, not a model that generalizes. The reusable-layout and user-effort experiments are the ones with held-out tests [S13 L197-198].
4. **Penalty vs snapping.** The Oct 13 answer snapped with ordinary code, which aligned lines within 0.5 px "and it wasn't learned: ordinary code decided where every line is, and training only copied the result". Cheng rejected it on "spirit" grounds, and the penalty replaced it on Oct 14 [S5 L13 and the "What was tried" list].
5. **End to end with nanoGPT.** It is claimed as a possibility (with a question mark) [S1 L35] and **not demonstrated**. No code, test or lab result exists at 257856e. grep for `nanoGPT|Shakespeare` in the clone (excluding .git and node_modules) returns only README.md:35. The nearest demonstrated things are learned parameters in cells beside runtime features (reusable layout, user effort). Even there, the ordinary-JS parts are outside the gradient: "There is no gradient through wrapping" [S8 L21].
6. **Two sets of step ranges.** The src README (630-750 / 1,360-1,840 / 860-980) and status.md (579-763 / 1,299-1,932 / 860-1,021) differ because they measure different frame-timing conditions. Not a contradiction, but don't mix them.

---

## 8. Misconceptions to avoid

- **"The gallery unfreezes a hand-written program."** No. Its 244 weights are randomly seeded, and it is a small generic ReGLU network compiled as a Handwired circuit. The "unfreeze" card is the site's framing [S26]. Hand-written numbers become trainable only when declared as cells (drag-knobs, `constant` cells) [S14 L51; S15].
- **"Gradients flow through the if-else."** They don't usefully. A 0/1 selector's slope is 0 on integers. At the threshold the backward pass reports the ramp's slope (e.g. −2 for the README example at a = 5), which the program never uses.
- **"Handwired uses straight-through estimation to train."** Only as an opt-in option in two lab experiments. The gallery uses the default exact backward pass.
- **"Training runs on the GPU."** The gallery trains on the CPU in JS: `evaluateReference` and `backpropagateReference`, about 0.2 ms per step in Bun [S4 L34]. Only JSON search uses WebGPU (see compilation dossier).
- **"nanoGPT was trained with a Handwired program inside it."** Never done.
- **"The network decides which photo goes where."** A min-cost assignment in ordinary JS pairs outputs and rectangles each step [S6 L573-585]. The line counts and multipliers are also ordinary code, outside the loss [S4 L21-24].
- **"Backprop differentiates FP32 rounding exactly."** No. It differentiates real arithmetic on rounded forward values [S7 L116; S3 L36].
- **"Fully learned alignment = loss goes to 0."** With the penalty on, the loss rests where its two parts balance, e.g. 1e-5 with a photo held 9 px off [S4 L32].
- **Mixing the 38.2% and 37.6% frozen-boolean numbers.** They come from different documents.

---

## 9. Curiosity hooks

1. **The README's own example has a "wrong" gradient.** At a = 5, the backward pass says `result` changes by −2 per unit of `a`. That is the slope of the ramp `relu(a−4) − relu(a−5)`, which only exists between integers [S1 L19; S10 L70-72].
2. **A switched-off neuron never wakes up by itself.** With zero weight decay, 2-4 of the gallery's 6 first-layer units could end permanently shut after 200 edits. A decay of just 0.0000002 rescues them [S4 L29].
3. **Adam's first step is the same size for every weight.** At step 1, every weight with a nonzero gradient moves by ≈ 0.008, the learning rate, whatever its gradient's size. The "left" bias goes 0.5 → ≈ 0.492 (derived from S6 L741-766).
4. **The page sometimes refuses its own progress.** `trainOrUndo` takes back any frame that made things worse. At rest, after Story's first fit, 238 of the next 300 frames were taken back. A frame at the lowest rate changes only 28 of the 244 weights, because the other steps are smaller than 32-bit floats resolve [S6 L855-862].
5. **One wrong default epsilon hid a whole result.** With Adam ε = 1e-8, the learned interpreter recovered 0 of 20 programs per seed group. With 1e-14 it recovered 19-20 of 20 [S7 L7, L66-73].
6. **The fix for "photos don't line up" was rejected for being too easy.** Snapping worked to 0.5 px, but "the spirit of the gallery is to learn something" [S5 L13].
7. **The big photo isn't anyone's in particular.** In run R1, the hero rectangle was paired with output slot 7 of 20. A min-cost assignment decides that afresh each step [run R1].
8. **Multiply had a zero-gradient bug at zero.** `3 × x` at x = 0 used to report slope 0, because both ReLU halves sat at their corner; "Reversing the operand order gives three" [S17 L78], so the bug depended on which operand sat in the gate. The fix: remember that it was a multiply [S17 L78; S10 L85].
9. **Exhaustive search hides behind "learning".** The learned interpreter's loss table needs 53 million second-instruction evaluations before training starts [S7 L78].
10. **The gallery's only input is its weights.** Its slot positions are baked in as constants, so the "program" is the weights [S13 L203; S6 L216-224].

---

## 10. Visual and dramatic details

- **Setting.** No physical lab. The real "room" is a browser tab with a 5:4 stage, hand-drawn rectangles, photos sliding into them, a falling loss curve, and a slider labeled "Misalignment penalty" [S4 L13-25]. Dates are October 13-14, 2026; the commit log runs from 05:50 to 23:19 on Oct 14 [S25].
- **Teaching machine: the ReGLU gate as a valve.** The left value flows through a gate whose opening is `max(0, gate)`. Backward, gradient flows back to `left` in proportion to the opening, and to `gate` only while the valve is open. A closed valve is a dead branch: paint it dark and draw no backward arrow.
- **Teaching machine: the integer bit's ramp.** Two ReLU ramps (paper-cut wedges) at 4 and 5 subtract to make a step one unit wide. Whole-number inputs land on the flat parts (slope 0) or on the corner (slope 1).
- **Teaching machine: the Huber clamp.** Each photo edge pulls on the bias with a spring whose force is capped at 0.08. Show the 20 edge springs from the table in 5.4: eight are maxed, and the hero's 0.38 error pulls no harder than a 0.09 error.
- **The pile.** All photos start as 0.18 × 0.18 squares near (0.5, 0.5), stacked, then fan out to their rectangles in 1-3 s (630-750 steps for Story) [S6 L373-376; S4 L17].
- **Multipliers as ratchets.** Each frame, every open gap tightens a little more (+0.02·steps·5·gap) until the edges click onto one line. "Machines clack, never chime" (brief) fits a ratchet.
- **Undo as a rewind.** A rejected frame snaps the weights and Adam's moments back. The learning rate halves (1 → 1/64 → 1/4096).
- **The aspiration card.** The nanoGPT line should appear only as the README's question, e.g. a paper card with a question mark, never as a working machine.

---

## 11. Sources

Repository paths are at commit 257856e (`https://github.com/chenglou/handwired/blob/257856e/...`).

- [S1] https://github.com/chenglou/handwired/blob/257856e/README.md (L3, L19-21, L27-35)
- [S2] https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts (L654-745, backpropagateReference)
- [S3] https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md (L34, L36, L112, L126, L143, L249-251 "Gradients")
- [S4] https://github.com/chenglou/handwired/blob/257856e/src/learned-gallery/README.md (L3, L9, L13-34)
- [S5] https://github.com/chenglou/handwired/blob/257856e/lab/learned-gallery/README.md (L3-13 and "tried and not kept" list)
- [S6] https://github.com/chenglou/handwired/blob/257856e/src/learned-gallery/trainable-geometry.ts (L72-157, L172-303, L314-377, L379-462, L465-481, L703-768, L864-897)
- [S7] https://github.com/chenglou/handwired/blob/257856e/lab/learned-interpreter/README.md (L7, L13-17, L46-48, L50-58, L66-78, L116)
- [S8] https://github.com/chenglou/handwired/blob/257856e/lab/reusable-layout/README.md (L11-13, L21, L27, L35-41)
- [S9] https://github.com/chenglou/handwired/blob/257856e/lab/generative-fields/ste-backprop.ts (L1-10)
- [S10] https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/differentiability.md (L5, L13-19, L36-93, L103-125)
- [S11] https://github.com/chenglou/handwired/blob/257856e/lab/generative-fields/README.md (L76-80, L126)
- [S12] https://github.com/chenglou/handwired/blob/257856e/lab/cascade-argmax/ramp.test.ts (L1-25)
- [S13] https://github.com/chenglou/handwired/blob/257856e/lab/status.md (L192-206 "What learns", L216)
- [S14] https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L51
- [S15] https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/drag-knobs/README.md (L5, L18-35, L233-242)
- [S16] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md#L3
- [S17] https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md (L76-82)
- [S18] https://github.com/chenglou/handwired/blob/257856e/lab/data-adapter/README.md (L3-5, L31, L63)
- [S19] https://github.com/chenglou/handwired/blob/257856e/lab/user-effort/README.md (L22-33, L44-54)
- [S20] https://projecteuclid.org/euclid.aoms/1177703732 (Huber 1964, *Ann. Math. Statist.* 35(1):73-101, doi:10.1214/aoms/1177703732)
- [S21] https://apps.dtic.mil/sti/pdfs/ADA113075.pdf (a Rockafellar 1982 report that credits the method of multipliers to Hestenes and Powell, 1969) and https://scholarhub.vn/publication/:slug/8f7ca1ad-61bd-4af3-acc1-24e62e53d492 (the Hestenes record). Hestenes, "Multiplier and gradient methods", JOTA 4:303-320, 1969, https://doi.org/10.1007/BF00934777 (DOI located by the fact-check, FC9); Powell, in *Optimization*, ed. R. Fletcher, Academic Press, 1969, pp. 283-298 (some sources, e.g. Rockafellar 1973, date the volume 1972; page numbers not independently verified).
- [S22] https://arxiv.org/abs/1308.3432 (Bengio, Léonard, Courville, "Estimating or Propagating Gradients Through Stochastic Neurons for Conditional Computation", 2013-08-15)
- [S23] https://arxiv.org/abs/1412.6980 (Kingma, Ba, "Adam: A Method for Stochastic Optimization", v1 2014-12-22)
- [S24] https://arxiv.org/abs/2002.05202 and https://ar5iv.labs.arxiv.org/html/2002.05202 (Shazeer, "GLU Variants Improve Transformer", 2020-02-12, §2 eq. 5)
- [S25] git log of the local clone at 257856e (commits 3d2c717, 515d6a8, 00c1048, c6bf933, d769a2e, 59b12cd, 19509c1, 4c63d9b); browse at https://github.com/chenglou/handwired/commits/257856e
- [S26] https://chenglou.me/handwired/ (fetched 2026-10-27)
- [S27] https://github.com/karpathy/nanoGPT (fetched 2026-10-27: "The simplest, fastest repository for training/finetuning medium-sized GPTs."; the Shakespeare char-level quick start trains a 6-layer, 6-head, 384-channel model in about 3 minutes on one A100 to a validation loss of 1.4697)
- [S28] https://github.com/chenglou/handwired/blob/257856e/src/learned-gallery/learned-gallery.ts (L15-17, L40-128, L243-306)
- [S29] https://github.com/chenglou/handwired/blob/257856e/assets/demos.html#L170 and https://github.com/chenglou/handwired/blob/257856e/assets/learned-gallery.html#L27
- [S30] https://github.com/chenglou/handwired (fetched 2026-10-27; 825 commits on main)
- [S31] https://github.com/chenglou/handwired/blob/257856e/lab/cascade-argmax/README.md#L9
- [S32] https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/learned-bits/README.md#L264 (the repo's one citation of Bengio, Léonard and Courville 2013)
- [R1] Run record: `bun /private/tmp/claude-501/-Users-blamy-Documents-Codex-orly-2/a761f115-e5d3-4a45-b429-b6ac42e99b03/scratchpad/grad.ts` (cwd: the clone at 257856e, Bun 1.4.3, 2026-10-27); output quoted in 5.4.

---

## 12. Fact-check log (2026-10-28, adversarial pass)

Method: every key claim re-read against the clone at `257856e` (`git log -1`: 2026-10-16 17:33:49 -0700; 825 commits), with `git log -S` for dates, and outside citations re-opened on the web. Re-running R1 (`bun .../grad.ts`) was blocked by the permission classifier again, so R1's digits are checked for consistency only.

**Confirmed against the source (no change):** README L3 and L34-35 wording, first in `59b12cd` (2026-10-14 05:50) [S1; S25]; `nanoGPT`/`Shakespeare` appear only at README.md:35, and no `end-to-end` code exists (grep of the clone); network shape 20 slots / ≤12 used / 10 features `[1, p, sin/cos × 4]` / two ReGLU layers of 6 / 132+84+28 = 244 / 6,320 ops in 8 layers [S4 L3; S6 L158-303; `learnedSlotCount = 20` at S28 L17]; init (seed 0x517a9e, ±√(2/16), gate biases 1±0.05, output biases 0.5/0.5/0.18/0.18) [S6 L306-377, L471]; Huber threshold 0.08, penalty stiffness 5, strength 2, onset 1e-6 / 1,000 / 200, multiplier growth 0.02 per step × 5 × gap = a tenth of the gap [S6 L82-132]; Adam lr 0.008, β 0.9/0.999, ε 1e-8, norm clip 1, clamp ±6, decay 2e-7, default-option `backpropagateReference` call at L739 [S6 L472-481, L703-768]; backward rules (ReGLU gate only when > 0, boolean throws without straight-through, index read throws without `indexGradient`) [S2 L654-745]; `ste-backprop.ts` comment verbatim [S9 L8]; `ramp.test.ts` [0, 0] and seeds 101-110 [S12]; status.md "What learns" rows verbatim [S13 L192-206]; learned-interpreter ε fix and exhaustive table [S7 L7, L57, L67-80]; HandwiredOS "none is trained" [S16 L3]; drag-knobs 63.6% / 82.5% / 24.6% / 24.2% / 16.5% vs 38.2% [S15 L233-242]; weight-decay unit rule [S4 L29]; 600 steps/s, 0.2 ms / 0.34-0.41 ms, 630-750 Story steps [S4 L17, L34]; Cheng's two quotes verbatim including "alignemtn" [S5 L13]; reassessment text on `3 * variable` [S17 L78] and fix commit `c6bf933` 2026-09-03; Shazeer arXiv:2002.05202 v1 2020-02-12 19:57 UTC, eq. 5 "ReGLU(x,W,V,b,c) = max(0,xW+b) ⊗ (xV+c)" (https://arxiv.org/abs/2002.05202, https://ar5iv.labs.arxiv.org/html/2002.05202), not cited in the repo (grep); Bengio et al. v1 2013-08-15 and "(we call this the straight-through estimator)" (https://arxiv.org/abs/1308.3432); Kingma & Ba v1 2014-12-22 (https://arxiv.org/abs/1412.6980); Huber 1964, Ann. Math. Statist. 35(1):73-101, doi:10.1214/aoms/1177703732 (https://projecteuclid.org/euclid.aoms/1177703732); nanoGPT's first sentence and the Shakespeare quick-start numbers (https://github.com/karpathy/nanoGPT); live demo card text (https://chenglou.me/handwired/, fetched 2026-10-28).

**Changes made:**
- **FC1 (corrected).** Timeline 2013 row said the repo "never" cites Bengio, Léonard and Courville. It does: lab/ui-exploration/learned-bits/README.md L264 [S32]. Row rewritten; S32 added.
- **FC2 (corrected).** "Up to ~1.5x phantom gradient" is generative-fields' measurement (173 vs 120) [S11 L80, L126]. drag-knobs measured a far larger leak (692,700 where the true change is 0; 592 of 2,250 checks) [S15 L156, L242]. Summary reworded so the film does not present 1.5x as the bias in general.
- **FC3 (corrected, minor).** Q9 (Cheng's request) was dated "Oct 13"; the source dates only the first answer to it ("The first answer, on October 13, 2026") [S5 L13]. Q9 and the Oct 13 timeline row now say the request is undated. Claim 15's "Cheng asked for a misalignment penalty" is a paraphrase; his words were "a bigger penalty or adjustable one ... for grid being unaligned".
- **FC4 (corrected, line ref).** Q16 is at learned-interpreter README L80, not L78.
- **FC5 (corrected).** Preset descriptions: Story's lower grid is 4 × 2 with 7 of 8 cells filled (not "2 rows of 4"); Cinema's rail has 8 of 10 cells filled [S28 L81-125].
- **FC6 (added nuance).** A code comment (learned-gallery.ts L275-276, Oct 13) gives 0.26 ms per step in Bun and about 0.4 ms in Chrome, against the README's 0.2 ms and 0.34-0.41 ms. Use one source.
- **FC7 (marked contested within the repo).** "Integer bit reports 1 at the threshold" holds for the hand-written `relu(v−4) − relu(v−5)` [S10 L70, L91], but docs/execution-model.md L143 says `emitCompare`'s integer bits give a nonzero gradient only when D is strictly fractional, i.e. only when a grid declaration is false. Both sourced in 5.3; the film should scope the claim to the README's expression.
- **FC8 (added nuance).** The ε fix's "19-20 of 20" is integer-domain success; full fractional certification is 5, 3 and 7 of 20 for the two-add rows [S7 L67-74].
- **FC9 (added).** Hestenes 1969 DOI 10.1007/BF00934777 (https://link.springer.com/doi/10.1007/BF00934777). Powell's chapter is dated 1969 by most sources and 1972 by Rockafellar 1973; pp. 283-298 not independently verified.
- **FC10 (unverifiable, flagged).** R1's gradients (0.00236120680 / 0.00236120684 / 0.00236120684) could not be re-run. The formula matches the code's gradient seeding [S6 L703-724], and the 4-decimal table sums to 0.0023625. Re-run before the digits go on screen.
- **FC11 (added nuance).** The multiply bug depended on operand order: "Reversing the operand order gives three" [S17 L78]. Hook 8 and section 4 updated.
- **Still UNVERIFIED:** Adam's "Good default settings" caption (the arXiv PDF text could not be extracted this pass either). Do not quote it.
