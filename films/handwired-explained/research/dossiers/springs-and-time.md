# Dossier: Springs and Time — Animation Inside a Program with No Clock

- Topic id: `springs-and-time` · era: repo at `257856e` · as-of 2026-10-27
- Primary source: the clone at `.orly-work/repos/handwired`. `git log -1` gives
  `257856e3b221140acb4cc4460626b850c0bd4ff1  Fri Oct 16 17:33:49 2026 -0700`. 2026-10-27 is the film's as-of date.
  The commit itself is dated **2026-10-16** (author time zone -0700). Do not say on screen that it was made on Oct 27.
- Source notation: `R:path#Lx-Ly` = `https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/path#Lx-Ly`
  (line numbers read from the clone at that commit).
- **This pass ran the code.** Unlike the sibling host-loop dossier, `bun` ran here (Bun 1.4.3):
  - `bun test tests/runtime/spring-matrix.test.ts` → **26 pass, 0 fail, 121,059 expect() calls, 547 ms**.
  - A copy of that test file with `console.log` added at the measured-number comments (scratch copy, not in the repo)
    printed the measured values the docs quote: ui.md order **359.04 / 123.84 / 53.42 px**, stored displacement drift
    **1.397e-4 px** ('every evaluation') and **7.436e-5 px** ('events and settle checks'), drawn position drift
    **3.95e-3 px** at 65,536 px and **7.85e-3 px** at 131,072 px, **0.1024 px** at 1,048,576 px, and **5** clock stops at jumps.
  - A worked-example script imported `src/runtime/host-timing.ts` and `src/runtime/numeric-ui-core.ts` from the clone and
    ran the real `springStepMatrix`, `springMatrixPower`, `springMatrixBound`, `countSpringSteps`, `quantizeTimeMs`,
    `quantizeFrameTiming`, `advanceFrame` and a compiled `emitApplySpringMatrix` program (outputs in §5.4–§5.6).
  - `bun lab/ui-exploration/guide/examples/differentiability/report.ts` printed the gradient numbers in §5.8.
  Scripts: `/private/tmp/claude-501/-Users-blamy-Documents-Codex-orly-2/a761f115-e5d3-4a45-b429-b6ac42e99b03/scratchpad/springs/{worked.ts,plan.ts,measure.test.ts}`
  (session scratchpad; outputs pasted below so the numbers survive without them).

---

## 1. Summary

A Handwired program is a fixed list of FP32 operations that runs once per evaluation and cannot loop a runtime number of
times. An ordinary JavaScript spring animation runs "as many fixed 4 ms steps as the elapsed time allows", which is a loop
whose count depends on the clock. Handwired's answer, in `docs/execution-model.md` § "Springs and time"
(R:docs/execution-model.md#L166-L253): **JavaScript counts the steps and writes the effect of all of them into cells.**

The trick is linear algebra. One semi-implicit Euler step of 4 ms (update velocity from spring and damping forces, then
position from the new velocity) is a **2×2 matrix** acting on the pair (displacement from the destination, velocity).
So *n* steps are that matrix to the power *n*. Before each evaluation, JavaScript (float64, in `src/runtime/host-timing.ts`)
computes `springMatrixPower(springStepMatrix({stiffness, damping}), steps)` by repeated squaring and writes the **4 numbers**
into 4 source cells. Inside the program, `emitApplySpringMatrix` multiplies those 4 cells by the stored displacement and
velocity: **14 operations in 3 layers whether the frame ran 0, 4 or 300 steps** (pinned by test). The program never sees
stiffness, damping or the clock: "Stiffness and damping stay editable, since they only enter the float64 computation."

Three more ideas make the result exact and frame-rate independent:

1. **Times on a 1/64 ms grid.** `quantizeTimeMs` rounds absolute timestamps before subtracting, so any split of a time span
   adds up exactly (16.6667 ms → 16.671875 ms). Absolute `performance.now()` values stay in JavaScript because an FP32 cell
   would hold them only on a 0.5 ms grid after about 70 minutes.
2. **The ordering rule.** Before an event with timestamp T is applied, springs step to T toward the destinations in effect
   *before* T. So a new destination starts pulling within 4 ms of T at any frame rate. The familiar "handle inputs, then
   catch up" order (chenguini's ui.md) makes 10 fps differ from 120 fps by up to **359 px** in a float64 copy.
3. **Settling at fixed simulated times.** Springs only settle (snap exactly to rest) at settle checks every **64 ms of
   simulated time** (16 steps) from when the clock started, so the decision doesn't depend on which step counts frames land on.
   With the `'events and settle checks'` write-back policy (HandwiredOS uses it), only event, settle-check and snap
   evaluations write state back; a plain frame runs on a copy. Then **every stored table and every drawn output at a shared
   timestamp is identical in every bit at 10, 30, 60 and 120 fps** and through 500 ms stalls.

Springs store **displacement from the destination, not position**, so FP32 rounds state at the size of the displacement
(finely near rest even at 100,000 px). A per-frame cap of **300 steps (1,200 ms)** keeps the static bound; past it, every
animated object **snaps** to its destination instead of carrying a backlog (where chenguini's guidance carries it forward).
Gradients reach the 4 matrix cells; JavaScript can finish the chain rule to stiffness and damping, and a lab measurement shows
that sum equals central differences (0.1055 and −0.5047 after 16 steps).

---

## 2. Timeline (dated events)

| date | event | source |
|---|---|---|
| 2004-06-10 | (Context, outside the repo) Glenn Fiedler publishes "Fix Your Timestep!", a widely cited game-dev statement of fixed-step simulation with an accumulator; it discusses "the so called 'spiral of death'" (it did not coin the term). | https://gafferongames.com/post/fix_your_timestep/ |
| undated (current master) | Cheng Lou's personal site `index.ts` steps springs at `msPerAnimationStep = 4` with default stiffness 290, damping 30 and settle thresholds 0.01, and runs every pending step with **no cap** (index.ts L408; host-timing.ts L123-L124). | https://github.com/chenglou/chenglou.github.io/blob/master/index.ts |
| 2026-02-27 | chenguini commit "Spiral of death prevention: cap spring steps across all demos" adds `Math.min(300, steps)` to Animation.md's demos. | https://api.github.com/repos/chenglou/chenguini/commits?path=docs/Animation.md ; https://github.com/chenglou/chenguini/blob/main/docs/Animation.md |
| 2026-02-28 | chenguini commit "Docs: prefer closed-form animations over numerical stepping": Animation.md's "Closed-Form vs Numerical" section now prefers closed-form springs ("no catch-up loop, no accumulated integration drift, and no spiral-of-death cap"), keeping cap-and-carry for numerical springs. Last Animation.md change: 2026-09-12. | https://github.com/chenglou/chenguini/blob/main/docs/Animation.md#L10-L12 ; https://api.github.com/repos/chenglou/chenguini/commits?path=docs/Animation.md |
| 2026-06-06 | Commit a2445ea "Add numeric window spring transitions" (earliest spring commit in the repo's history). | `git log` in clone; https://github.com/chenglou/handwired/commit/a2445ea |
| 2026-09-14 | Cheng decides the default spring: it "works like spring-bank's source-matrix variant: `emitApplySpringMatrix` … reads a matrix that JavaScript writes". `emitCompare`, `emitAnimatedObject` and `advanceFrame` replace the older defaults (`emitSpring`, rounding stages). Until this date springs stored absolute positions. | R:lab/ui-exploration/guide/sections/differentiability.md#L13 ; R:lab/status.md#L176 ; R:lab/status.md#L12 |
| 2026-09-15 | Commit 17c2318 "Add the UI exploration lab, index reads, exact comparisons and host-timed springs"; commit 6ace584 "Convert IndirectOS to fixed-step springs, destination layouts and grid hit tests". HandwiredOS went from 5,253 to 3,654 live operations and 192 to 124 layers in that move. | `git log`; R:lab/status.md#L14 |
| 2026-09-16 | Commit a6b82aa "Fold spring-bank into event-time, moving its IndirectOS copy and carrying its findings". | `git log` |
| 2026-09-17 | Commit bf719fa moves the runtime into `src/` and root tests into `tests/` (host-timing.ts and spring-matrix.test.ts reach their current paths). | `git log -- src/runtime/host-timing.ts` |
| 2026-10-05 | Commit 4189d40 "Call vibescript by its new name, chenguini" (the guideline repo cited throughout the springs docs). | `git log` |
| 2026-10-06 | Commit e86f5ed renames the repo Indirect → Handwired, IndirectOS → HandwiredOS. | `git log` |
| 2026-10-15 | The absolute-position measurements are moved from execution-model.md into lab/status.md. | R:lab/status.md#L12 |
| 2026-10-16 | Commit 257856e (the pinned commit). | `git log -1` |

---

## 3. People

**Cheng Lou (`chenglou`)** — author of Handwired (https://github.com/chenglou/handwired), of the chenguini engineering/UI
guidelines (https://github.com/chenglou/chenguini) and of the `index.ts` on his personal site that Handwired's spring is
ported from. The repo refers to him as "Cheng" ("The default spring that Cheng decided on September 14, 2026",
R:lab/ui-exploration/guide/sections/differentiability.md#L13; "Cheng's note has the spring snap to the destination", ibid. L19).
- What he believed, per the repo only: that a frame's catch-up steps should be capped (300); that past the cap, an object
  should **snap** rather than carry leftover time into later frames (his note, differentiability.md L19); that the spring
  matrix should be written by JavaScript, not computed inside the program (the 2026-09-14 decision).
- His guidelines (chenguini Animation.md) recommend *carrying* the backlog for numerical springs (while preferring closed-form springs since 2026-02-28, Animation.md L10-L12): "the remaining gap catches up naturally over
  subsequent frames — no time skip". Handwired's host-timing.ts deliberately departs from that and snaps. lab/status.md lists as
  still open "changing ui.md, Animation.md and index.ts to step springs to each event's timestamp" (R:lab/status.md#L188).
  So the author's own guideline docs and his own new code currently disagree; that is a fair, sourced point to make.
- Depiction: the repo says nothing about his appearance, and the brief forbids invented biography. **Do not draw a likeness.**
  Use an anonymous generic paper-cut figure (a hand at a desk, a back at a monitor) or no figure at all. No era clothing applies;
  this is 2026 software.

**Glenn Fiedler** (context only, optional) — author of "Fix Your Timestep!" (2004), a widely cited game-programming article that
explains "the so called 'spiral of death'" (https://gafferongames.com/post/fix_your_timestep/). [Fact-check: the article's own
"so called" shows it did not coin the term; do not say it "named" it.] Not cited by Handwired directly; chenguini's
Animation.md uses the same phrase. Do not depict; a typeset title card of the article name is enough.

---

## 4. The belief of the age

**The common practice (held by game developers since at least 2004, and by chenguini/index.ts):** decouple simulation from
frame rate with a fixed timestep. Each frame, run `floor(elapsed / step)` steps and carry the remainder. index.ts's comment:
"run x spring steps. Decouple physics simulation from framerate!" (index.ts L408). Fiedler: "the renderer produces time and the
simulation consumes it in discrete dt sized steps", and "This left over time is passed on to the next frame via the accumulator
variable and is not thrown away." To prevent the spiral of death, cap the steps; chenguini: "N = 300 (1200ms at 4ms/step) is a
good default", with the rest of the gap caught up "over subsequent frames — no time skip". [Fact-check nuance: index.ts itself
has no cap (L408; host-timing.ts L123-L124 says so); and since 2026-02-28 chenguini's Animation.md *prefers closed-form springs*
over numerical stepping ("Closed-Form vs Numerical", L10-L12), keeping cap-and-carry as the guidance for numerical springs only.
So do not present chenguini as simply holding the fixed-step belief.]

The implicit assumption: *a fixed timestep makes the animation frame-rate independent.*

**Where Handwired dissents (with measurements):**
1. A fixed step is not enough when **inputs** arrive between frames. ui.md's frame order is "handle inputs, new layout,
   animation tick" (as described in R:lab/ui-exploration/guide/sections/springs.md#L261; ui.md's own headings are "Handle inputs / New layout & cursor / Animation tick", ui.md L17-L19). So a press that arrives between frames
   changes the destination at the next frame, and (a) the catch-up steps pull toward the new destination from up to one frame
   plus 4 ms *before* the press, and (b) an animation from rest starts up to one frame *after* the press. Handwired's float64
   copy of that order differs from 120 fps by **359 px at 10 fps, 124 px at 30 fps, 53 px at 60 fps** (R:docs/execution-model.md#L212;
   measured here: 359.04, 123.84, 53.42). The lab's separate frame-rate-check reports 411 / 112 / 46.0 px on different traces
   (R:lab/ui-exploration/guide/sections/springs.md#L271-L275). Use the execution-model.md numbers on screen; they are the
   ones tests/runtime pins (as lower bounds >100, >50, >10) and that re-ran here.
2. When the step is fixed but **settling** is checked once per frame, whether a spring settles depends on which step counts the
   frames land on: "A spring can be within both thresholds at one step count and above the speed threshold a few steps later"
   (R:docs/execution-model.md#L218).
3. Carrying a backlog past the cap is replaced by a **snap** (static bound, no time carries into later frames).

How long the old belief held / what ended it: not "ended" in general practice. Within this repo it ended for Handwired's
runtime on 2026-09-14/15 (the default-spring decision and the IndirectOS conversion). The author's own guideline repo has not
yet been changed (R:lab/status.md#L188: still open). Present it as "a refinement the repo argues for", not as a refuted field.

**Why a circuit forces the issue:** in plain JavaScript, a loop count is free. In a Handwired program, "a program can't loop a
runtime number of times" (R:docs/execution-model.md#L168), so the step count has to leave the program. Once it leaves, the
host decides exactly *when* the program runs, which is what makes the ordering rule and fixed settle times possible.

---

## 5. Experiments and results

### 5.1 What JavaScript writes (R:docs/execution-model.md#L170-L174; R:src/runtime/host-timing.ts)
- **Times on a 1/64 ms grid** — `quantizeTimeMs(t) = Math.round(t × 64) / 64 + 0` (`+ 0` turns −0 into +0) (host-timing.ts L61-L64).
  e.g. "16.6667 ms becomes 16.671875 ms" (L57). `quantizeFrameTiming(frameTimeStamp, previousFrameTimeMs, eventTimeStamps)` returns
  the frame's duration (0 for the first frame after idle) and each event's time relative to the frame, e.g. −3.5 for a press
  3.5 ms before the frame (L87-L104). Verified here: `quantizeFrameTiming(1016.67, 1000, [1013.17])` →
  `{frameTimeMs: 1016.671875, durationMs: 16.671875, eventTimesMs: [-3.5]}`.
  - Why: "an FP32 cell holding `performance.now()` stores it on a 0.5 ms grid from about 70 minutes into a session". Check:
    2^22 ms = 4,194,304 ms = 69.9 min, and FP32 spacing in [2^22, 2^23) is 2^-1 = 0.5. ✓
- **A spring matrix per stiffness/damping pair**, 4 cells.
- **A settle check bit, a snap bit, and the evaluation's events.**
- Defaults: `defaultSpringClockConfig = {timeGrid: 64, stepMs: 4, maxStepsPerFrame: 300, settleCheckSteps: 16}` (host-timing.ts L35-L40).
- `validateSpringClockConfig` requires a power-of-two grid and `maxStepsPerFrame × stepMs × timeGrid ≤ 2^24` (L42-L55):
  300 × 4 × 64 = 76,800 grid steps, exactly representable in FP32.

### 5.2 The step matrix (R:src/runtime/host-timing.ts#L151-L163)
```ts
// One semi-implicit Euler step of index.ts's stepSpringTo as a matrix:
//   velocity' = velocity + (-stiffness * displacement - damping * velocity) * dt
//   displacement' = displacement + velocity' * dt
const dt = stepMs / 1000
const velocityKeep = 1 - constants.damping * dt
return [1 - constants.stiffness * dt * dt, dt * velocityKeep, -constants.stiffness * dt, velocityKeep]
```
Derivation (for narration): substitute v′ into e′ = e + v′·dt:
e′ = (1 − k·dt²)·e + dt·(1 − b·dt)·v, v′ = (−k·dt)·e + (1 − b·dt)·v. Mass is 1 (index.ts: "we'll assume mass of 1").
Matrix layout: `[m0, m1, m2, m3]` = `[displacementFromDisplacement, displacementFromVelocity, velocityFromDisplacement, velocityFromVelocity]` (L142-L147).

**Powers by repeated squaring** (`springMatrixPower`, L178-L189): "Every power of one matrix commutes, so the result is the same
real matrix as `count` single steps, within float64 rounding." Test: powers by squaring equal repeated products within 1e-12 for
every n = 0..300 (R:tests/runtime/spring-matrix.test.ts#L639-L657).

**Bound** (`springMatrixBound`, L196-L208): largest |entry| of M^n for n = 0..300, times (1 + 1e-6), rounded to FP32. The program
declares the 4 cells within ±bound so a host that writes an overflowing matrix fails the source range check.

### 5.3 Spring constants and step sizes actually in the code
| where | stiffness | damping | step | notes |
|---|---|---|---|---|
| spring-matrix.test.ts `springConstants` (L59-L63) | 290 / 650 / 120 | 30 / 45 / 14 | 4 ms (0.004 s in `eulerSteps`, L113-L121) | 290/30 = index.ts default |
| spring-matrix.test.ts app traces (L908-L919) | 290 (x, y, object 1), 333 (scale) | 30, 20 | 4 ms | initial positions 400, 300, 1, 200 |
| HandwiredOS: photo-gallery.ts L72, shared by window-manager.ts | **650** | **45** | 4 ms | one shared matrix; 301 precomputed powers (L970-L974) |
| Photos zoom thresholds (photo-gallery.ts L101, L729) | — | — | — | settleDistance = settleSpeed = **2^-16** (unit 0..1) |
| chenglou.github.io index.ts `spring()` defaults | 290 | 30 | `msPerAnimationStep = 4` | thresholds 0.01 |
| chenguini Animation.md example | 333 | 33 | 4 ms | "Typically 4 steps for 60fps (16.6ms/frame) and 2 for 120fps" |

Bounds measured here with the real function: 290/30 → **6.8849**; 650/45 → **10.3605** (docs: "10.36"; host-timing.ts comment
says "e.g. 10.4"); 120/14 → 5.3193; 333/20 → 9.6407. `springMatrixBound({stiffness: 1e7, damping: 0})` throws "overflows".
Damping ratio ζ = b / (2√k) (my computation, standard formula, not from the repo): 290/30 → 0.881, 650/45 → 0.883 (both
slightly underdamped: a small overshoot), 333/20 → 0.548.

### 5.4 Worked spring step with real numbers (stiffness 290, damping 30, dt = 0.004 s)
Computed by hand and confirmed by running `springStepMatrix` and a compiled `emitApplySpringMatrix` program from the clone.

- velocityKeep = 1 − 30 × 0.004 = **0.88**
- m0 = 1 − 290 × 0.004² = 1 − 290 × 0.000016 = 1 − 0.00464 = **0.99536**
- m1 = 0.004 × 0.88 = **0.00352**
- m2 = −290 × 0.004 = **−1.16**
- m3 = **0.88**
- Real output: `springStepMatrix({stiffness:290, damping:30})` → `[0.99536, 0.00352, -1.16, 0.88]`. (650/45 → `[0.9896, 0.00328, -2.6, 0.82]`.)

**Scenario:** a window at x = 400 px, destination moves to 700 px, at rest. Stored state: displacement e = 400 − 700 = **−300**, v = **0**.

One step:
- v′ = m2·e + m3·v = −1.16 × −300 + 0 = **348 px/s**
- e′ = m0·e + m1·v = 0.99536 × −300 + 0 = **−298.608 px** → drawn at 700 − 298.608 = **401.392 px**
- Cross-check as forces: a = −290 × (−300) − 30 × 0 = 87,000 px/s²; v′ = 0 + 87,000 × 0.004 = 348; x′ = 400 + 348 × 0.004 = 401.392. ✓

One 60 fps frame: 1000/60 ms → `quantizeTimeMs` → **16.671875 ms** → `countSpringSteps(16.671875, 300)` →
`{steps: 4, leftoverMs: 0.671875, snap: false}` (and the doc's own example: 17.5 ms → 4 steps, carries 1.5 ms).

M^4 (float64) = `[0.9591341465, 0.0115982623, -3.8221546197, 0.5790274595]`; FP32 values written into the 4 cells:
`[0.9591341614723206, 0.011598262004554272, -3.8221545219421387, 0.5790274739265442]`.

Program output (compiled, FP32): e = **−287.740234375**, v = **1146.6463623046875**; drawn position f(700 + e) = **412.259765625**.
Float64 Euler loop of 4 steps: e = −287.7402439559639, v = 1146.6463859082364. Difference ≈ 9.6e-6 px, 2.4e-5 px/s.

Compiled cost (run here): **14 live operations, 3 layers** (the test also pins 28 stored weights, R:tests/runtime/spring-matrix.test.ts#L205).
For n = 300: e = −6.008e-7, v = 3.50e-5 (essentially at rest after 1.2 s). n = 0 (identity) returns −300, 0 unchanged.

A float64 trajectory at 60 fps (my script, matrices from the real functions): 412.26 (frame 1), 437.32, 468.51, 501.46 (64 ms),
533.43 [fact-check: was 533.44; recomputed 533.4349], 569.71 (frame 6 runs 5 steps, because the 0.67 ms leftovers accumulate), … 699.10 (frame 20), peaks ≈ 700.32 px
around frame 25–26 (~0.43 s), then eases back. Peak speed ≈ 2,066 px/s at step 15 (60 ms); at 64 ms (16 steps) it is 2,057.5 px/s
[fact-check: was "≈ 2,057 px/s around 64 ms", which is the 16-step sample, not the peak].

### 5.5 In the program (R:docs/execution-model.md#L176-L206; R:src/runtime/numeric-ui-core.ts#L2505-L2704)
- `emitApplySpringMatrix(circuit, matrix, displacement, velocity)` computes `(m0 × e + m1 × v, m2 × e + m3 × v)` with 4
  `circuit.multiply` products: "14 operations in 3 layers for any step count." Accuracy: "For displacements within ±2,000 px,
  velocities within ±5,000 px/s and up to 300 steps, the result is within 1e-3 px and 1e-2 px/s of a float64 Euler loop."
  The test draws 1,500 random samples over the three constant pairs to check this (spring-matrix.test.ts L200-L231). The matrix
  wires must have finite declared ranges or the builder throws "spring matrix wires need finite declared ranges".
- `emitAnimatedObject(circuit, springs, {settleCheck, snap})` steps every spring of one object (e.g. a window's x, y, width,
  height and scale) and settles them all with one exact bit:
  ```txt
  (displacement', velocity') = matrix × (displacement, velocity)
  displacement'' = f(f(destinationDuringSteps - destination) + displacement')
  exceedance = Σ over springs of relu(|displacement''| - distance) + relu(|velocity'| - speed)
  atRest = 1 when every displacement'' and velocity' is ±0, otherwise 0
  settled = boolean(relu(0.5 × settleCheck + 0.5 × atRest - 2^20 × exceedance))
  active = (1 - settled) × (1 - snap)
  next displacement = f(displacement'' × active)
  next velocity = f(velocity' × active)
  position = f(destination + next displacement), drawn but not stored
  ```
  (verbatim block, R:docs/execution-model.md#L182-L192)
- **Rebase:** the second line moves the displacement onto this evaluation's destination. An unchanged destination adds exactly 0,
  so rounding happens once per retarget, not once per evaluation.
- **Why displacement, not position:** FP32 rounds stored state at the size of the displacement; near 100,000 px positions are
  1/128 px apart. "Springs that store positions instead can fail to settle near 100,000 px." The absolute-position form (before
  2026-09-14), measured with traces moved to 65,536 / 131,072 / 1,048,576 px: "42 to 48 of 48 runs settled differently from
  float64 at each offset, up to 40 runs were still animating at the end, and positions were up to 16.6 px off" (R:lab/status.md#L12).
- **Exact settle test:** a sum of nonnegative FP32 values is 0 only when every term is 0, so exceedance = 0 exactly when every
  spring is within both thresholds; `|d| <= f(0.01)` is the same test as `< 0.01` "since no FP32 value lies between the two".
  Defaults 0.01 px and 0.01 px/s (the same as index.ts's `Math.abs(s.v) >= 0.01 || Math.abs(s.dest - s.pos) >= 0.01`).
- **Rest bit:** ReLUs of every displacement and velocity × 2^127, summed: any nonzero value down to 2^-149 contributes ≥ 2^-22,
  and `relu(1 − 2^22 × sum)` is the bit. An object exactly at rest settles at any evaluation.
- **Score arithmetic:** settleCheck and atRest are added first so the partial sum is exactly 0, 0.5 or 1; "0.5 − 2^20 × 2^-45 is
  the FP32 value just below 0.5", so any nonzero exceedance flips the boolean to 0. Recorded as a `'marked'` rounding point.
- **Costs (pinned in test, L303-L314):** one-spring object **29 operations, 11 layers**; 2 springs **52**; 5 springs with snap
  and separate destinations **128 operations, 13 layers**. Comparison: the older `emitSpring`, which runs 4 Euler steps inside the
  program with stiffness, damping and timestep as wires, is **46 operations in 33 layers** for one spring (docs L206; source
  R:src/runtime/numeric-ui-core.ts#L2426-L2479 — a literal `for (let step = 0; step < 4; step++)` unrolled at build time).
  [Fact-check: 46/33 re-measured, but only with every parameter declared nonnegative and `unit` declared 1, as in
  R:lab/ui-exploration/guide/examples/springs/costs.ts#L193-L213 (`buildHandwiredOsSpring`); with no declared ranges the same call
  compiles to 78 operations in 45 layers. Say "46 operations in 33 layers, as HandwiredOS built it".]

### 5.6 The ordering rule and the frame plan (R:docs/execution-model.md#L208-L220; host-timing.ts L314-L404)
- Rule (verbatim): "Before an event with timestamp T is applied, springs step to T toward the destinations in effect before T,
  and a stopped clock starts at T. So a new destination starts pulling within 4 ms of T at any frame rate."
- `advanceFrame(clock, frameTimeStamp, events, evaluate, writeBack)` plans evaluations of four kinds: `'events'` (one per
  distinct event timestamp: steps up to it, then applies events), `'settle check'` (steps to a fixed simulated time, checks
  settling), `'frame'` (steps to the frame's timestamp), `'snap'` (past the budget). The host keeps requesting frames while the
  returned clock runs (`animatedUntilMs !== null`).
- **Test log, verbatim numbers** (R:tests/runtime/spring-matrix.test.ts#L726-L740): frames at 100, 180, 250 ms, one event at 95.3 ms:
  `events@95.296875` (0 steps, starts the clock) → `frame@100` (1 step, simulated 99.296875, duration 4.703125) →
  `settle check@159.296875` (15 steps; "64 ms of simulated time after the event") → `frame@180` and `frame@250` with 0 steps,
  duration 0 ("The check reported that nothing animates: idle starts").
- **Plan run here** (290/30 spring, 400 → 700 px, press at 1010.2 ms, 60 fps frames, `'events and settle checks'`, float64 stand-in
  for the program):
  ```
  frame        t 1000         steps 0   pos 400.000
  events       t 1010.203125  steps 0   pos 400.000   (clock starts at the press)
  frame        t 1016.671875  steps 1   pos 401.392   v 348.00   (copy; not written back)
  frame        t 1033.328125  steps 5   pos 417.631              (counts from the last commit at 1010.2)
  frame        t 1050         steps 9   pos 444.745
  frame        t 1066.671875  steps 14  pos 484.966
  settle check t 1074.203125  steps 16  pos 501.458   v 2057.48 (64 ms after the clock started; committed)
  frame        t 1083.328125  steps 2   pos 517.689
  frame        t 1100         steps 6   pos 548.531
  ```
  Note how the frame evaluations' step counts grow (1, 5, 9, 14) because with this policy frames evaluate a copy, and how the
  settle check commits at exactly 16 steps. The settle check value 501.458 equals the 16-step value from §5.4's trajectory.
- Settle-check cost: "one more evaluation per 64 ms of animation, e.g. about one in four frames at 60 fps" (16.67 / 64 ≈ 0.26).

### 5.7 Write-back policies and frame-rate traces (R:docs/execution-model.md#L222-L228; test L1227-L1346)
Test app: object 0 has x/y springs (290/30) and a scale spring (333/20); object 1 has one spring (290/30). Traces: seeds 1–8
without jumps plus 4 seeds where ~35% of presses jump; schedules 120 fps (baseline), 10, 30, 60 fps, and 60/120 fps with a
500 ms stall; each trace runs until 2 s after its last press.
- `'every evaluation'`: positions within **1.4e-4 px** of float64 springs and within 1.5e-4 px of the 120 fps run; settle times
  match float64. (Test asserts < 5e-4; measured 1.397e-4.) With absolute positions this was 7.3e-4 px and 2 of 48 runs settled
  at a different check (test comment, L1281-L1282).
- `'events and settle checks'`: committed tables and drawn outputs at shared timestamps **identical in every bit** at 10, 30,
  60, 120 fps and through 500 ms stalls; positions within **7.4e-5 px** of float64 (measured 7.436e-5). "HandwiredOS uses it."
  Behavior-choices adds: "When every evaluation writes back, about half the tables that frames store differ in bits between 60
  and 120 fps." (R:docs/behavior-choices.md#L48)
- Far from origin: at 65,536 and 131,072 px stored displacements stay within 1.4e-4 px; drawn positions within 3.9e-3 and 7.9e-3
  px, "half of FP32's spacing at those positions"; at 1,048,576 px FP32 values are 1/8 px apart and displacements differ by up to
  0.10 px (measured 0.1024).
- **3 s stall test** (L1285-L1311): presses at 100, 250, 500 (during the stall), 4000, 4100 ms; stall 400–3400 ms. At every frame
  rate exactly **one snap at 3,400 ms**, no frame > 300 steps, committed tables bit-identical; positions after the snap
  `[120, 480, 0.75, 20]`, i.e. the destinations of the presses at 500 and 250 ms.

### 5.8 Static bounds, magnitude limits, gradients
- Cap: `maxStepsPerFrame` 300 (1,200 ms). `countSpringSteps(1203.984375, 300)` → 300 steps, carries 3.984375 ms;
  `countSpringSteps(1204, 300)` → snap (test L630-L631). "the first frame after a 2 s stall runs a snap and no steps".
- Snap threshold differs by policy: with `'events and settle checks'` "a frame gap from just above 1,140 ms can cause a snap, e.g.
  a 1,144 ms gap after an event at 0 ms and a frame at 60 ms, where `'every evaluation'` needs a 1,204 ms gap".
- Durations: within 76,800 grid steps; `PlannedEvaluation.durationMs` isn't clamped and is exact in FP32 only within 2^24 grid
  steps = **262,144 ms**.
- Retarget rounding example: `(2^23 + 1)/64` and `−(2^23 + 2)/64` differ by `(2^24 + 3)/64`, which FP32 rounds to `(2^24 + 4)/64`,
  moving the drawn position by 1/64 px.
- **Gradients** (R:docs/execution-model.md#L249-L253): backward pass reaches the 4 matrix cells; `circuit.multiply` gives each
  `displacement × outputGradient` or `velocity × outputGradient`, even at an entry of exactly 0 (identity at 0 steps). Stiffness and
  damping get nothing from the backward pass; JavaScript finishes the chain rule by summing `d output / d entry × d entry / d stiffness`
  over the 4 entries. Measured (run here, `report.ts`), source-matrix example, 290/30 spring from 0 to 100 px:
  - n = 16: circuit d/dstiffness 0, d/ddamping 0; chain rule in JS **0.1055, −0.50469**; central difference **0.1055, −0.50469**.
    [Fact-check: the docs print **0.1055 and −0.5047** (differentiability.md L281, L271; patterns/tables-javascript-writes.md L52;
    pinned by tables-javascript-writes.test.ts L182 to 4 places for stiffness). Use −0.5047 on screen; the fifth digit comes only
    from the earlier report.ts run, which this fact-check could not re-run.]
  - n = 150: −2.28e-4, −0.0011773 (both methods). n = 300: 9.96e-8, −1.52e-6 (both). [Fact-check: stiffness values match the
    doc table (differentiability.md L359-L360: −2.28e-4; 1.0e-7); the damping values at 150 and 300 steps appear in no doc and
    could not be re-run here: unverifiable, do not show.]
  - Settle bit is a boolean atom: `backpropagateReference` throws unless `booleanGradient` is `'straight-through'`; a settled object's
    gradient reaches only its destinations. Across the snap, the report shows a jump: stiffness 264.8859558 gives "settled 0, position
    100.0063…, gradient 0.0012773", stiffness 264.8859863 gives "settled 1, position 100, gradient 0"; "difference across the snap −206.75".
  - Rest bit: the 2^127 lift is inside a ReLU so "at exact rest the backward pass stops at that ReLU's corner instead of scaling
    gradients by 2^149."
  - Doc caveat (verbatim): "Exact settling says nothing about whether gradients through many steps stay usable."
  - Alternative noted: in-program matrix power with stiffness/damping as cells costs **546 operations** for the frame matrix
    (R:lab/ui-exploration/guide/sections/differentiability.md#L5, L269: one spring is 562 live operations, 42 layers). L5 compares
    546 with **119** "when spring-bank writes the powers into weights"; L287 adds that the source-matrix form (what
    `emitApplySpringMatrix` uses) "adds none" to the clock. [Fact-check: the earlier "546 vs 14" was the dossier's own pairing, not
    the doc's; 14 is the whole `emitApplySpringMatrix` cost from execution-model.md L178. If on screen, attribute each number to its
    own source.] Its gradients matched central differences within 1.3e-4 relative error over 1,080 checks (L13, L269).
  - Future: "A closed-form matrix, `exp(A × elapsed)` with `A = [[0, 1], [-stiffness, -damping]]`, could replace the Euler power
    later without changing the program." (L253)

---

## 6. Verified quotes (verbatim; all from files read at 257856e or fetched pages)

1. "A spring runs as many fixed 4 ms steps as the elapsed time allows, and a program can't loop a runtime number of times, so
   JavaScript counts the steps and writes the effect of all of them into cells." — docs/execution-model.md, § Springs and time, L168.
   R:docs/execution-model.md#L168
2. "One semi-implicit Euler step of 4 ms, which updates the velocity from the spring and damping forces and then the position from
   the new velocity, is a 2×2 matrix on (displacement from the destination, velocity), so n steps are that matrix to the power n." — L173.
3. "Stiffness and damping stay editable, since they only enter the float64 computation." — L173.
4. "14 operations in 3 layers for any step count." — L178.
5. "Before an event with timestamp T is applied, springs step to T toward the destinations in effect before T, and a stopped clock
   starts at T. So a new destination starts pulling within 4 ms of T at any frame rate." — § The ordering rule, L210.
6. "A spring can be within both thresholds at one step count and above the speed threshold a few steps later, as the remaining
   displacement accelerates it again." — § Settling at fixed simulated times, L218.
7. "Springs that store positions instead can fail to settle near 100,000 px." — L196.
8. "Use `'events and settle checks'` where stored state must be bit-identical across frame rates, e.g. to replay recorded events.
   HandwiredOS uses it." — L226.
9. "Exact settling says nothing about whether gradients through many steps stay usable." — § Gradients, L251.
10. "Step springs to each event's timestamp before applying the event, and write next state back only at events and settle checks."
    — docs/behavior-choices.md L32. R:docs/behavior-choices.md#L32
11. "A new destination starts pulling within 4 ms of the event at any frame rate." — behavior-choices.md L42.
12. "so replaying recorded events at another frame rate, e.g. in a screenshot test, reproduces the screen bit for bit." — behavior-choices.md L48.
13. Code comment, host-timing.ts L1: "// Host timing for springs whose step matrix JavaScript writes into source cells."
14. Code comment, host-timing.ts L3-L4: "Everything here is float64 JavaScript that runs between evaluations. It never builds operations and never touches the DOM."
15. Test name: "ui.md's order, applying presses and then catching up, differs across frame rates in float64" — spring-matrix.test.ts L1348.
16. Test name: "a 3 s stall snaps every object onto its destination once, no frame runs more than 300 steps, and the committed tables
    stay bit-identical across frame rates" — L1285.
17. External, index.ts L408 (chenglou.github.io master): "run x spring steps. Decouple physics simulation from framerate!"
    https://github.com/chenglou/chenglou.github.io/blob/master/index.ts
18. External, chenguini Animation.md: "N = 300 (1200ms at 4ms/step) is a good default" and "the remaining gap catches up naturally
    over subsequent frames — no time skip". https://github.com/chenglou/chenguini/blob/main/docs/Animation.md (via fetch; re-check
    exact punctuation, e.g. the em dash, before typesetting).
19. External, Glenn Fiedler, "Fix Your Timestep!" (2004-06-10): "It's called the spiral of death because being behind causes your
    update to simulate more steps to catch up" (sentence continues on the page). https://gafferongames.com/post/fix_your_timestep/
- UNVERIFIED — do not use as a quote: any line attributed to Cheng Lou personally about springs beyond the repo text. The repo's
  "Cheng's note" (differentiability.md L19) is paraphrased in the repo, not quoted.

---

## 7. Debates and controversies (design trade-offs; both sides sourced)

1. **Carry the backlog vs snap past the cap.** chenguini Animation.md (for numerical springs; its stated preference is closed-form) / ui.md: cap at 300 and carry the remainder, "no time skip".
   Handwired: snap, so "no frame runs more than 300 steps, and no time carries into later frames" (L235). Cost of snapping: a
   visible jump after a stall of about 1.2 s while something still moves (behavior-choices.md L87). Cost of carrying: unbounded
   pending work and a program whose state depends on history of stalls.
2. **Write back every evaluation vs only at events and settle checks.** Every evaluation: simpler, positions within 1.4e-4 px of
   float64, but ~half the stored tables differ in bits between 60 and 120 fps. Events-and-settle-checks: bit-identical stored
   state, but each frame copies the table (22 cells in the toast stack, behavior-choices.md L46), a snap can happen at a slightly
   smaller frame gap (1,144 vs 1,204 ms), and stages that read "last frame's value" read an older copy (drawer lag 60 → 174 px at
   60 fps, behavior-choices.md L73). Bit-identity also requires events in timestamp order and no snap.
3. **Matrix written by host vs computed in program.** Host-written: 14 ops to apply (execution-model.md L178), but gradients stop at
   the 4 cells and JS must finish the chain rule. In-program from stiffness/damping cells: 546 ops for the frame matrix (vs 119 for
   spring-bank's powers-in-weights variant, differentiability.md L5), gradients flow end to end (L13).
4. **Euler power vs closed form.** The Euler step is a first-order approximation of the continuous spring; `exp(A × elapsed)` could
   replace it "without changing the program" — listed as open (L253; lab/status.md L188). Note: chenguini's Animation.md already
   *prefers* closed-form springs (since 2026-02-28, "Closed-Form vs Numerical"), so on this point Handwired's runtime is the one
   still on numerical steps.
5. **Guidelines vs new code.** The author's chenguini docs still recommend the frame-ordered loop; changing them is "still open"
   (lab/status.md L188). Present as an open thread, not a contradiction to mock.

---

## 8. Misconceptions to avoid

- **"The program animates" / "the program has a clock."** No: the program never loops over time and never sees a timestamp's
  absolute value; JavaScript decides step counts and writes 4 matrix numbers per spring constant pair. The program only multiplies.
- **"One matrix per spring."** One matrix per **stiffness/damping pair**; HandwiredOS shares one 650/45 matrix across windows and
  thumbnails (lab/status.md L14).
- **"The matrix power is exact."** It equals repeated float64 Euler steps "within float64 rounding"; the program's FP32 result is
  within 1e-3 px / 1e-2 px/s of a float64 loop. And Euler itself approximates the continuous spring. What is *exact* is the
  settle decision and the landing on the destination ("A settled or snapped object lands exactly on its destinations with zero
  velocity, up to the sign of zero").
- **"Fixed timestep = frame-rate independence."** Only between input events; see the 359 px figure.
- **"Settling happens every frame."** Only at settle checks (every 64 ms of simulated time) or at exact rest.
- **Springs store positions.** They store displacement from the destination and velocity; positions are drawn, not stored.
- **"Bit-identical across frame rates, always."** Only with `'events and settle checks'`, events in timestamp order, and no snap
  (a 1,144 ms gap can snap at one rate and not another). A stall that makes every rate snap (e.g. 3 s) stays bit-identical.
- **Wrong constants.** Tests use 290/30 (index.ts default); HandwiredOS uses 650/45; chenguini Animation.md's example is 333/33.
  Don't attribute 650/45 to index.ts or 290/30 to HandwiredOS.
- **Bound value.** Docs say 10.36 for 650/45; a host-timing.ts comment says "e.g. 10.4" (rounded). The function returns 10.3605.
- **Function name drift.** Handwired's comments cite index.ts's `stepSpringTo`; the current master of chenglou.github.io names
  these `springStep`/`stepSpring`. Don't put `stepSpringTo` on screen as current index.ts code.
- **Two different "359 vs 411 px" figures.** execution-model.md's 359/124/53 px (app traces in spring-matrix.test.ts) and the
  lab's frame-rate-check 411/112/46.0 px (different traces). Use one set and name its source.
- **Commit date.** 257856e is dated 2026-10-16, not 2026-10-27.

---

## 9. Curiosity hooks (true, sourced)

1. **Fourteen operations for 1.2 seconds of physics.** Whether a frame simulates 4 ms or 300 steps, the in-program spring is the
   same 14 operations in 3 layers (R:docs/execution-model.md#L178; test L205).
2. **The 70-minute bug that can't happen.** An FP32 cell holding `performance.now()` would tick in 0.5 ms steps after ~70 minutes
   (2^22 ms), so absolute time never enters the program (L172).
3. **Frame rate moves a window by 359 px.** In a float64 copy of the familiar "handle inputs, then step" order, 10 fps and 120 fps
   disagree by up to 359 px at shared timestamps (L212; re-measured 359.04).
4. **Same pixels at 10 fps and 120 fps, bit for bit.** With events-and-settle-checks, every stored table and drawn output at a shared
   timestamp matches in every bit (L226; test L1230).
5. **2^127 to find zero.** The rest bit multiplies ReLUs by 2^127 so the tiniest nonzero FP32 value (2^-149) becomes ≥ 2^-22 and a
   ReLU can tell "exactly zero" from "almost zero" (L198).
6. **"No FP32 value lies between the two"** — `<= f(0.01)` and `< 0.01` are the same test (L198).
7. **Rounding at the destination, not the position:** far out at 100,000 px, positions are 1/128 px apart, so storing displacement
   keeps settling exact; the old absolute-position springs mis-settled in 42–48 of 48 runs far from the origin (lab/status.md L12).
8. **Stiffness and damping never enter the program**, yet a designer can retune them live, and JavaScript can still compute their
   gradients: 0.1055 and −0.5047 after 16 steps, matching central differences (differentiability.md L281).
9. **One settle check per 64 ms** — about one extra evaluation every four frames at 60 fps — buys frame-rate-independent settling (L220).
10. **The snap after a stall:** a 3 s stall produces exactly one snap at 3,400 ms at every frame rate, and the windows appear at
    their latest destinations `[120, 480, 0.75, 20]` (test L1300-L1310).

---

## 10. Visual and dramatic details (for the art department)

Teaching machine ideas, all grounded in the mechanics above:
- **The step stamp:** a paper-cut 2×2 brass plate stamped `0.99536 | 0.00352 / −1.16 | 0.88`. Each 4 ms tick, two cards
  (displacement −300, velocity 0) slide through it and come out as −298.608 and 348.
- **The squaring press:** a clockwork press that folds the plate onto itself (M², M⁴) — repeated squaring; for 300 steps, 8
  squarings and 4 multiplications into the result (binary of 300 = 100101100, four 1-bits). (My arithmetic; host-timing.ts L178-L189 is the algorithm.)
- **The host's ledger desk vs the program's loom:** JavaScript at a desk with a stopwatch reading 16.671875 ms (the 1/64 ms grid as
  a ruler with 64 ticks per millisecond), writing four numbers on slips and posting them through a slot into the machine. The
  machine (the program) has no clock on its wall: emphasize the empty wall hook.
- **The ordering rule as a train schedule:** event tickets stamped with timestamps (1010.203125); before each ticket is punched,
  the spring carriage advances to that time on the old track, then the switch (destination) flips.
- **Settle bells — no, settle detents:** per the brief, machines clack, never chime. A ratchet that can only lock on every 16th tooth
  (64 ms marks) — the settle check — and a pawl that drops only when both needles (distance, speed) are under 0.01.
- **The snap:** after a stall (3 s of dark stage), the window cut-outs drop straight onto their marks with one clack.
- **Two orchestras at different tempi** (10 and 120 fps conductors) producing the identical final tableau, overlaid bit for bit.
- Settings: a 2026 desk, a browser window, HandwiredOS's three windows (Monitor, Notes, Photos) and a dock as cut-out silhouettes.
  Spring constants 650/45 make windows slightly overshoot (ζ ≈ 0.88) — a gentle settle, not a bounce.
- Period details: none historical. Optional title-card for 2004's "Fix Your Timestep!" as an aside about the "spiral of death".

---

## 11. Sources

1. Handwired repo at the pinned commit: https://github.com/chenglou/handwired/tree/257856e3b221140acb4cc4460626b850c0bd4ff1
2. docs/execution-model.md § Springs and time, L166-L253: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/execution-model.md#L166-L253
3. docs/behavior-choices.md § Apply events at their timestamps…, L30-L52 (and L73, L87, L93): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/behavior-choices.md#L30-L52
4. src/runtime/host-timing.ts (L1-L404): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/host-timing.ts
5. tests/runtime/spring-matrix.test.ts (L59-L63, L113-L121, L200-L231, L303-L314, L608-L660, L725-L740, L908-L919, L1227-L1364): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/tests/runtime/spring-matrix.test.ts
6. src/runtime/numeric-ui-core.ts `emitSpring` L2426-L2479, `emitApplySpringMatrix` L2505-L2525, `emitAnimatedObject` L2610-L2704: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/numeric-ui-core.ts#L2426-L2704
7. src/handwiredos/photo-gallery.ts L72, L101, L729, L970-L974, L1002-L1003: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/handwiredos/photo-gallery.ts
8. src/handwiredos/window-manager.ts L1462-L1463, L1725: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/handwiredos/window-manager.ts
9. src/handwiredos/README.md L17: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/handwiredos/README.md
10. lab/status.md L12, L14, L176, L188: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/status.md
11. lab/ui-exploration/guide/sections/differentiability.md L5, L13, L19, L174, L281, L293: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/ui-exploration/guide/sections/differentiability.md
12. lab/ui-exploration/guide/sections/springs.md L7, L33, L253-L275: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/ui-exploration/guide/sections/springs.md
13. lab/ui-exploration/guide/examples/differentiability/report.ts (run: `bun lab/ui-exploration/guide/examples/differentiability/report.ts`): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/ui-exploration/guide/examples/differentiability/report.ts
14. Commit history (a2445ea, 17c2318, 6ace584, a6b82aa, bf719fa, 4189d40, e86f5ed): https://github.com/chenglou/handwired/commits/257856e3b221140acb4cc4460626b850c0bd4ff1
15. Command run: `bun test tests/runtime/spring-matrix.test.ts` in the clone (Bun 1.4.3) → 26 pass, 0 fail, 121,059 expect() calls, 547 ms (2026-10-27).
16. chenguini docs/ui.md (Render Loop, Hit Testing): https://github.com/chenglou/chenguini/blob/main/docs/ui.md
17. chenguini docs/Animation.md (4 ms step, 333/33 example, 0.01 thresholds, Spiral of Death Prevention, N = 300): https://github.com/chenglou/chenguini/blob/main/docs/Animation.md
18. chenglou.github.io index.ts (msPerAnimationStep = 4, spring defaults 290/30, 0.01 thresholds, step loop): https://github.com/chenglou/chenglou.github.io/blob/master/index.ts
19. Glenn Fiedler, "Fix Your Timestep!", 2004-06-10: https://gafferongames.com/post/fix_your_timestep/
20. Semi-implicit Euler method (symplectic Euler / Euler–Cromer; velocity first, then position): https://en.wikipedia.org/wiki/Semi-implicit_Euler_method

---

## Fact-check log (adversarial pass, 2026-10-27)

Method: re-read every cited line in the clone at 257856e; re-ran code with fresh scratch scripts (not the drafting scripts):
`bun test tests/runtime/spring-matrix.test.ts` (26 pass, 0 fail, 121,059 expect() calls); an independent script calling the real
`springStepMatrix`, `springMatrixPower`, `springMatrixBound`, `quantizeTimeMs`, `quantizeFrameTiming`, `countSpringSteps` and a
compiled `emitApplySpringMatrix` program; a scratch copy of spring-matrix.test.ts with `console.log` added (ui.md order: 359.0395,
123.8395, 53.4201 px; 5 clock stops at jumps); `emitSpring` compiled both with and without declared ranges; a float64 60 fps
trajectory and the planner positions. Fetched externally: chenglou.github.io `index.ts` (raw, master), chenguini `docs/Animation.md`
and `docs/ui.md` (raw, main), the GitHub commits API for Animation.md, and gafferongames.com "Fix Your Timestep!".
`bun lab/.../differentiability/report.ts` could not be re-run (permission denied), so its extra digits are checked against the docs only.

Confirmed (no change): all 20 key claims as worded below, apart from the caveats on 16, 17 and 18. Specifically: the step matrix
[0.99536, 0.00352, −1.16, 0.88] and 650/45 [0.9896, 0.00328, −2.6, 0.82]; one step → v 348, e −298.608, drawn 401.392; 1000/60 →
16.671875 ms → 4 steps, leftover 0.671875; FP32 program e −287.740234375, v 1146.6463623046875, drawn 412.259765625, float64 diff
9.6e-6 px / 2.4e-5 px/s; 14 ops / 3 layers (and 28 weights); bounds 6.8849 / 10.3605 / 5.3193 / 9.6407, 1e7 throws; n = 300 result
−6.008e-7, 3.50e-5; all execution-model.md / behavior-choices.md / lab/status.md / host-timing.ts quotes verbatim at the lines given;
commits a2445ea (2026-06-06, first to add `emitSpring`), 17c2318, 6ace584 (2026-09-15), a6b82aa (09-16), bf719fa (09-17), 4189d40
(10-05), e86f5ed (10-06), 257856e (2026-10-16 -0700); planner test log L726-L740; 3 s stall → one snap at 3,400 ms, positions
[120, 480, 0.75, 20]; costs 29/11, 52, 128/13; index.ts defaults k = 290, b = 30, 4 ms, 0.01 thresholds, "we'll assume mass of 1",
L408 comment verbatim; Animation.md quotes verbatim (em dash present), 333/33 example, "Typically 4 steps for 60fps…"; Fiedler page
dated Jun 10, 2004, quotes verbatim; ζ 0.881 / 0.883 / 0.548; planner positions 401.392, 417.631, 444.745, 484.966, 501.458, 517.689,
548.531; 300 = 100101100₂.

Changes:
1. §2 / §3 — Fiedler "named" / "canonical" statement of the spiral of death → the article itself says "the so called 'spiral of
   death'", so it did not coin the term; reworded to "widely cited … discusses". Source: https://gafferongames.com/post/fix_your_timestep/
2. §2 / §3 / §4 / §7 — chenguini portrayed as simply holding the fixed-step belief → Animation.md has preferred closed-form springs since
   commit 2026-02-28 ("Docs: prefer closed-form animations over numerical stepping"; § "Closed-Form vs Numerical", L10-L12), keeping
   cap-and-carry for numerical springs; cap added 2026-02-27. Added dated timeline rows and nuance (affects key claims 17 and 20).
   Sources: https://github.com/chenglou/chenguini/blob/main/docs/Animation.md ; https://api.github.com/repos/chenglou/chenguini/commits?path=docs/Animation.md
3. §2 / §4 — index.ts grouped with "cap the steps" → index.ts has no cap (index.ts L408; R:src/runtime/host-timing.ts#L121-L124).
4. §5.8 / §7.3 — "546 operations … vs 14 (differentiability.md L5)" → L5 compares 546 with 119 (spring-bank powers in weights); 14 is
   execution-model.md L178's `emitApplySpringMatrix` cost; L287 says source-matrix "adds none". R:lab/ui-exploration/guide/sections/differentiability.md#L5 , #L287
5. §5.5 — `emitSpring` 46 ops / 33 layers holds only with parameters declared nonnegative and unit = 1 (costs.ts L193-L213,
   `buildHandwiredOsSpring`); without declared ranges it compiles to 78 ops / 45 layers (re-measured). Caveat added (key claim 16).
6. §1 / §5.8 / §9 — damping gradient −0.50469 → docs print −0.5047 (differentiability.md L271, L281; tables-javascript-writes.md L52);
   use the documented value (key claim 18).
7. §5.8 — damping gradients at 150 and 300 steps (−0.0011773, −1.52e-6) appear in no doc and could not be re-run: marked unverifiable.
8. §5.4 — frame-5 position 533.44 → 533.43 (533.4349 recomputed).
9. §5.4 — "peak speed ≈ 2,057 px/s around 64 ms" → peak ≈ 2,066 px/s at step 15 (60 ms); 2,057.5 px/s is the 16-step value.
10. §4 — springs.md line ref L259 → L261 (L259 is the heading); added ui.md's own wording ("Handle inputs / New layout & cursor / Animation tick", ui.md L17-L19).
