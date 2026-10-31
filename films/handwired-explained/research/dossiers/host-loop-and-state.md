# Dossier: Deep Dive 2a — The Host Loop, State, DOM Writes and Why a Program Cannot Stop Early

- Topic id: `host-loop-and-state` · era: repo at `257856e` · as-of 2026-10-27
- Primary source: the clone at `.orly-work/repos/handwired`, `git log -1` gives
  `257856e3b221140acb4cc4460626b850c0bd4ff1  Fri Oct 16 17:33:49 2026 -0700`. **Note:** the brief writes
  "257856e (2026-10-27)". 2026-10-27 is the as-of / pin date. The commit itself is dated **2026-10-16** in the
  author's time zone (-0700), which is **2026-10-17T00:33:49Z in UTC** (GitHub API). Do not say on screen that the
  commit was made on Oct 27. As of 2026-10-27 it is still the head of `main` (GitHub API, fact-check).
- Source notation: `R:path#Lx-Ly` = `https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/path#Lx-Ly`
  (line numbers read from the clone at that commit with `cat -n`).
- **Running code.** This pass was not allowed to execute the cloned repo's own code: `bun test` was refused by the
  sandbox ("Code from External"). Every number below therefore comes from one of two places:
  (a) the repo's docs and test names, quoted verbatim, or
  (b) **an independent Python port** of the float64 host arithmetic in `src/runtime/host-timing.ts`, written for
  this dossier at
  `films/handwired-explained/research/runs/host_timing_port.py`
  and run with `python3 -I host_timing_port.py`. Its output is pasted in §5.6.
  The port reproduces the repo's documented numbers exactly: 16.671875, 4 steps + 1.5 ms, the 10.36 bound,
  207 px/s, 0.009 px, and the 1,144 ms vs 1,204 ms snap thresholds. **The FP32 program side** (operation counts,
  bit-identity across frame rates, the 38-frame clock) **was not run here**. It rests on the docs and on test names.
  Before showing those numbers on screen, re-run `bun test template tests/runtime/spring-matrix.test.ts` in the clone.

---

## 1. Summary

A Handwired program is a **fixed list of FP32 operations**. Builder code appends them to a `Circuit` once, "so
nothing in the program branches or loops at runtime" (R:docs/tutorial.md#L13). Each evaluation runs every operation
once, in layers. The repo says it in its own words, twice: **"The program runs every operation on every frame and
can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item."**
(R:docs/patterns.md#L3, R:docs/README.md#L9). It also says: **"A program can't loop a number of times that is only
known at runtime"** (R:docs/tutorial.md#L106), and "A program runs each of its layers once, so it can't run a loop
a runtime number of times" (R:docs/patterns.md#L200).

So where do time, state and iteration come from? From **the host**: "The JavaScript around the program is the host:
it writes browser inputs into the table and runs the program on it, which is one evaluation, then writes the
program's next-state values back into the table and its other outputs to the DOM" (R:docs/tutorial.md#L13).

- **State lives in cells.** All state sits in one `Float32Array`, the *source table*. State cells get exactly one
  "next value" wire each, and the host copies those next values back after an evaluation (`source.set(result.nextValues)`).
- **Iteration happens across evaluations.** The program is one pass of a state machine, and the host turns the crank
  again and again.
- **Data-dependent repetition becomes data.** The spring's 4 ms Euler step is linear, so *n* steps form one 2×2
  matrix power. The host counts the steps in float64 (`host-timing.ts`) and writes the 4 numbers of `M^n` into
  cells. The program applies them in **14 operations in 3 layers for any step count** (R:docs/execution-model.md#L178).
  The other route, unrolling with masks, costs 3,301 operations in 902 layers for up to 300 steps
  (R:docs/patterns.md#L210).
- **Every count needs a static bound, with a named fallback.** A frame may run at most `maxStepsPerFrame = 300`
  steps (1,200 ms). Past that, the host plans a **snap**: every animated object lands on its destination with zero
  velocity, and the backlog is dropped (R:src/runtime/host-timing.ts#L292-L313, R:docs/execution-model.md#L230-L237).

The host loop is `advanceFrame(clock, frameTimeStamp, events, evaluate, writeBack)`
(R:src/runtime/host-timing.ts#L314-L404). It plans one frame as several evaluations:
1. **settle checks** at fixed simulated times, every 64 ms (16 steps × 4 ms);
2. **one `'events'` evaluation per distinct event timestamp**, which steps springs *to* that timestamp before
   applying the events;
3. **one `'frame'` evaluation** at the frame's timestamp, for what's on screen.

With the `'events and settle checks'` write-back policy, which the template and HandwiredOS use, the frame's own
evaluation runs on a **copy** of the table and throws its next state away. Stored state then depends only on the
events and not on the frame rate (R:docs/execution-model.md#L222-L228).

`docs/behavior-choices.md` lists **seven** user-visible choices that this model forces or rewards
(R:docs/behavior-choices.md#L7-L173). See §5.4.

---

## 2. Timeline (dated events)

All dates come from the repo's own records. No outside dates were invented.

| Date | Event | Source |
|---|---|---|
| until 2026-09-14 | Springs stored **absolute positions** ("the form until September 14, 2026"). Measured on that form (the source does not say when the measurement was taken; the text was moved into status.md on 2026-10-15): with traces moved to 65,536 / 131,072 / 1,048,576 px, "42 to 48 of 48 runs settled differently from float64 at each offset". Springs now store **displacements**. | R:lab/status.md#L12 |
| until 2026-09-15 | "HandwiredOS ran one evaluation per frame, so a frame's moves collapsed." | R:lab/ui-exploration/guide/sections/executor.md#L395 |
| 2026-09-15 | "HandwiredOS and its Photos app moved to these additions … the machine runs `advanceFrame` with `'events and settle checks'`, every destination change reaches the machine as a timestamped event, including viewport resizes". Since then a 60 fps drag frame with 16 coalesced moves runs "about 17 evaluations". | R:lab/status.md#L14, R:lab/ui-exploration/guide/sections/executor.md#L395 |
| 2026-10-14 | Repo made public. Its history was rewritten before release, and commit hashes in the docs were updated. | R:lab/status.md#L36 |
| 2026-10-16 | Commit `257856e` (the pinned commit). | `git log -1` in the clone |
| 2026-10-27 | The film's as-of date. The repo page shows Public, MIT, ~2.0k stars and 825 commits on the day fetched. | https://github.com/chenglou/handwired |

Context dates (framing only, *not* Handwired history):
- 2004-06-10: Glenn Fiedler, "Fix Your Timestep!" (Gaffer On Games; the page shows "Jun 10, 2004"). It uses the
  term ("the so called 'spiral of death'"), so it did **not** coin it. It describes the accumulator that *carries*
  the leftover, less-than-one-step time into the next frame. **But its own loop also clamps frame time**
  (`if ( frameTime > 0.25 ) frameTime = 0.25;`), which throws away anything past 250 ms. So Fiedler carries the
  remainder below one step and *drops* a large backlog. https://gafferongames.com/post/fix_your_timestep/
- (undated, current main): chenguini's `ui.md` render loop caps catch-up at 300 steps and *carries* the rest.
  `Animation.md` explains "Spiral of Death Prevention". Handwired *snaps* instead of carrying.
  https://github.com/chenglou/chenguini/blob/main/docs/ui.md, https://github.com/chenglou/chenguini/blob/main/docs/Animation.md

---

## 3. People

**Cheng Lou (`chenglou`)** is the author of Handwired, and of chenguini, the UI and engineering guidelines the docs
compare against (both under github.com/chenglou).
- Per the brief's guardrail, the film may use **only what the repo says**. The repo refers to him as "Cheng". It
  records that he "noted that pretext has a Knuth-Plass demo" (R:lab/status.md#L240). It also records that changes
  were made "with Cheng's approval" (R:lab/status.md#L3), and that he asked for a measured pass of chenguini's
  engineering.md: "No need to abide by the guide religiously. Back out what didn't" (R:lab/status.md#L44, a quote of
  Cheng as recorded in the repo).
- What the work shows he believes, in the repo's words: the familiar render order (ui.md's) makes stored state
  frame-rate dependent. (The repo calls chenguini "a set of engineering and UI guidelines". It sits under the
  `chenglou` GitHub account, but the repo never states who wrote it. Don't say on screen "his own guideline" as a
  sourced fact.) For Handwired he deliberately departs from it in two places:
  event-timestamp ordering with commits only at events and settle checks, and snapping instead of carrying
  (R:docs/behavior-choices.md#L5).
- **Depiction:** the repo contains no description of his appearance, and the brief forbids invented biography. The
  recommendation for the art department is to **not depict him as a specific figure**. If a human hand is needed,
  use a generic, unidentified silhouette hand at a workbench, or show only the machine. No glasses, hair or clothing
  details are sourced.
- The repo itself records that its history mentioned AI models in commit trailers. These were removed before
  release (R:lab/status.md#L36). Don't speculate on screen about who or what wrote which line.

Glenn Fiedler is cited only as the source of "spiral of death" framing, and only if the film needs that term.
He is not a character.

---

## 4. The belief of the age

**The familiar belief (UI and game loops):** handle a frame's inputs, step the simulation up to "now", commit the
state, on every frame. If the simulation fell behind, carry the backlog into later frames, capped to avoid the spiral
of death.
- Game loops: Fiedler (2004) has "the renderer produces time and the simulation consumes it in discrete dt sized
  steps"; leftover time "is passed on to the next frame via the accumulator variable and is not thrown away"
  (https://gafferongames.com/post/fix_your_timestep/; both phrases checked verbatim against the page HTML in the
  fact-check). **CONTESTED as a "carry" example:** "leftover" there means the remainder below one dt. The same
  article's loop clamps `frameTime` to 0.25 s, so a long stall is dropped, not carried. Fiedler is therefore
  closer to "cap and discard" than ui.md is. Don't present him as on ui.md's side of snap vs carry.
- (Another alternative from the same guidelines: Animation.md notes that a closed-form spring needs "no catch-up
  loop, no accumulated integration drift, and no spiral-of-death cap".)
- chenguini ui.md "Render Loop": DOM reads → "Handle inputs" → "New layout & cursor" → "Animation tick" → "Commit
  state changes" → "Occlusion & DOM writes", with
  `const steps = Math.min(300, Math.floor((now - newAnimatedUntilTime) / msPerAnimationStep))`, commented
  "spiral of death prevention, see Animation.md" (https://github.com/chenglou/chenguini/blob/main/docs/ui.md).
- Animation.md: "Cap it: `steps = Math.min(N, steps)`", and "the remaining gap catches up naturally over subsequent
  frames — no time skip". It also has "N = 300 (1200ms at 4ms/step) is a good default"
  (https://github.com/chenglou/chenguini/blob/main/docs/Animation.md).

**Who dissents, and why (Handwired):** two departures.
1. **Ordering.** ui.md's order "depends on the frame rate when a destination changes between two frames". "In a
   float64 copy of that order, 10, 30 and 60 fps differ from 120 fps by up to 359, 124 and 53 px at shared timestamps"
   (R:docs/execution-model.md#L212). Handwired steps springs to each event's timestamp *before* applying the event.
2. **Carry vs snap.** A program has a fixed size, so the backlog cannot be carried as hidden extra work. Handwired
   wants "no time carries into later frames" (R:docs/execution-model.md#L235). Past 300 steps it snaps, and the
   comment notes that ui.md "carries the time past the cap into later frames instead, and chenglou.github.io's
   index.ts runs every pending step with no cap" (R:src/runtime/host-timing.ts#L121-L124).

**How long the old way held inside Handwired itself:** HandwiredOS ran "one evaluation per frame" until
September 15, 2026 (R:lab/ui-exploration/guide/sections/executor.md#L395). The move to `advanceFrame` ended it. The
docs still list the cases where you'd *not* do this (§7).

**Note:** this is a design disagreement over trade-offs, not a debunked belief. ui.md's order is fine where nothing
replays sessions (R:docs/behavior-choices.md#L50).

---

## 5. Experiments and results (the mechanics)

### 5.1 The model: cells, one evaluation, next state

- The source table is one `Float32Array`. Cell kinds and what happens to each around an evaluation
  (R:docs/tutorial.md#L42-L49):
  - `constant`: set once and kept.
  - `input`: written by JS before the evaluation, and kept.
  - `inputBit`: an input that is exactly 0 or 1.
  - `event()`: "an exact bit that JavaScript sets to 1 when an event arrives, and the program resets to 0".
  - `state` and `stateBit`: computed by the program.
- `nextSource` lists the wire holding each cell's next value: "a constant or an input holds itself, and an event
  holds 0". A state cell that never gets a next value, or gets two, throws while building
  (R:docs/tutorial.md#L68).
- Reassignment becomes new wires: "`armedAfterDown` holds the value after the press, while `cells.armed` still holds
  the previous evaluation's value" (R:docs/tutorial.md#L93). An `if` becomes `emitSelect`, which "computes both sides
  and picks one" (R:docs/tutorial.md#L93).
- The toggle template's cells (R:docs/tutorial.md#L20-L37):
  - viewport width and height;
  - `down` and `up` events, each with x and y on a 1/64 px grid;
  - `cancel`;
  - `on` and `armed` state bits;
  - 4 `springMatrix` input cells;
  - `settleCheck` and `snap` bits;
  - the thumb's `displacement`, `velocity` and `destination`.
  "the toggle's 20 cells" (R:docs/tutorial.md#L145).

### 5.2 The host loop, exact order and code

From `template/toggle.ts` `createToggleMachine` (R:template/toggle.ts#L92-L139). The tutorial reproduces the same
code at R:docs/tutorial.md#L114-L141.

```ts
machine.clock = advanceFrame(machine.clock, frameTime, queued, evaluation => {
  const values = evaluation.writesBack ? source : copy        // 1. which table
  if (!evaluation.writesBack) copy.set(source)                //    frame eval works on a copy
  const matrix = matrices[evaluation.steps]!                  // 2. M^steps, precomputed for 0..300
  cells.springMatrix.forEach((wire, index) => { values[wire] = matrix[index]! })
  values[cells.settleCheck] = evaluation.settleCheck ? 1 : 0  // 3. two bits
  values[cells.snap] = evaluation.snap ? 1 : 0
  values[cells.viewportWidth] = viewportWidth                 // 4. browser inputs
  values[cells.viewportHeight] = viewportHeight
  for (const {kind, x, y} of evaluation.events) { ... values[cells[kind].active] = 1 ... }  // 5. events
  const result = evaluate(values)                             // 6. one evaluation (validated)
  if (evaluation.writesBack) source.set(result.nextValues)    // 7. next state copied back
  frameOutput = result.output
  return result.output.active > 0                             // 8. still animating?
}, writeBack)
queued = []
```

The steps of one frame, in order:
1. A pointer handler queues `{kind, x, y, timeStamp}` with x and y rounded to 1/64 px. Event handlers *only queue*
   (R:docs/tutorial.md#L110, R:template/toggle.ts#L160-L166). "Only queue" means they don't evaluate or write state.
   In the code each handler also calls `scheduleRender()` to request a frame, and so does `resize`
   (R:template/toggle.ts#L163-L168).
2. `requestAnimationFrame(render)` calls `machine.step(clientWidth, clientHeight, frameTime)`.
3. `advanceFrame` plans the frame and calls the callback once per planned evaluation, in this order: settle checks
   interleaved before the events at or after their time, then events grouped by timestamp, then the frame.
4. **DOM writes** come from output numbers only (R:template/toggle.ts#L150-L159, R:docs/tutorial.md#L149-L159):
   - `track.style.transform = translate3d(trackLeft, trackTop)`
   - `--fill` and `--armed` CSS variables
   - `aria-checked` from `output.on === 1`
   - `thumb.style.transform = translate3d(thumbInset + thumbOffset, thumbInset)`
   - then `if (machine.clock.animatedUntilMs !== null) scheduleRender()`
5. "The page requests another frame only while the clock runs, i.e. until an evaluation that writes state back finds
   nothing animating" (R:docs/tutorial.md#L161). Idle costs nothing.
6. `evaluate(values)` checks the table against every declaration before running, and checks next values and outputs
   after. A coordinate off the grid throws `down.x must be a multiple of 0.015625` (R:docs/tutorial.md#L145).
   Validation cost: "100,000 cells take about 90 µs per check in Bun" (same line).
7. A resize "isn't an event: it doesn't start the clock, and its frame's evaluation runs on a copy"
   (R:docs/tutorial.md#L147). In the template, a resize that moves a page-position destination by more than ±40 px
   makes `evaluate` throw. That's why the spring sits on the thumb's offset *within* the track.
8. In HandwiredOS's list, "the DOM code only reads the outputs of the frame's last evaluation, which applies no
   event". A scroll request therefore comes from the evaluation that applied the key (R:docs/behavior-choices.md#L165).

### 5.3 Why it cannot stop early, and what "Static bounds" require

- **The constraint, in the repo's words:**
  - "The program runs every operation on every frame and can't stop early" (R:docs/patterns.md#L3; R:docs/README.md#L9).
  - "nothing in the program branches or loops at runtime" (R:docs/tutorial.md#L13).
  - "A program can't loop a number of times that is only known at runtime" (R:docs/tutorial.md#L106).
  - "a program can't loop a runtime number of times, so JavaScript counts the steps and writes the effect of all of
    them into cells" (R:docs/execution-model.md#L168).
- **Why (mechanics):** compilation packs independent instructions into layers. "A layer gathers its earlier inputs,
  evaluates its sparse affine projection, applies gather reads, index reads, ReGLU gates and boolean rounding, and
  appends outputs" (R:docs/execution-model.md#L40). The number of layers and operations is fixed when you build.
  There is no instruction for "jump", "break" or "repeat". `findIndex` therefore examines *every* item, and a branch
  computes both sides.
- **Static bounds** (R:docs/execution-model.md#L230-L237; R:src/runtime/host-timing.ts#L292-L313):
  - At most `maxStepsPerFrame` = **300** steps per frame (**1,200 ms** at 4 ms/step).
  - Before an `'events'` or `'frame'` evaluation that would exceed the remaining budget, a `'snap'` evaluation runs
    first. The host writes 1 into snap cells, every object lands on its destination with zero velocity, and "the
    clock stops, which discards the backlog of steps".
  - An event during a stall still applies at its own timestamp. Springs snap onto the destinations in effect before
    it, and snap again onto the event's destinations if the remaining time is also too long.
  - "no frame runs more than 300 steps, and no time carries into later frames. `quantizeFrameTiming` clamps durations
    and event times to 1,200 ms" (R:docs/execution-model.md#L235).
  - Events before the last write-back evaluation apply at that evaluation's time. Events after the frame's timestamp
    apply at the frame's.
  - Inputs that change destinations should arrive as timestamped events if stored state must be frame-rate
    independent.
- **Static bounds generalize** beyond springs. "A program's size is fixed while building, so every count that
  JavaScript keeps in a growing array or a loop variable becomes a maximum, and what the program does past the maximum
  is part of the behavior" (R:docs/behavior-choices.md#L79). The seven named fallbacks are snap, carry, split,
  report, drop, clamp and throw (R:docs/behavior-choices.md#L89).
- **Configuration validation** (R:src/runtime/host-timing.ts#L42-L55):
  - the time grid must be a power of two;
  - `maxStepsPerFrame × stepMs × timeGrid ≤ 2^24`, so FP32 holds every duration exactly. 300 × 4 × 64 = 76,800 grid
    steps, well inside 16,777,216.

### 5.4 The seven behavior choices (docs/behavior-choices.md), with numbers

1. **Hit-test destinations instead of drawn positions** (L7-L28).
   - The toast stack: "three presses 80 ms apart, 4 px below the top, dismiss three toasts, like closing tabs in Safari
     by clicking the same spot". Testing drawn positions dismisses one.
   - Cost: "35 operations in 5 layers on destinations, and 205 in 34 on drawn positions". Destinations lie on grids,
     so `emitCompare` builds integer bits. Drawn positions don't, so each comparison becomes a sign cascade.
   - Don't use it for drag starts (ui.md keeps `pos` for drag targets).
2. **Apply events at their timestamps, and write state back only at events and settle checks** (L30-L52).
   - "A new destination starts pulling within 4 ms of the event at any frame rate."
   - ui.md's order: 10 fps differs from 120 fps by up to 359 px.
   - In the toast stack, stored tables and drawn tops are "identical in every bit at 10, 30, 60 and 120 fps and
     through 500 ms stalls". When every evaluation writes back, "about half the tables that frames store differ in
     bits between 60 and 120 fps".
   - Cost: one table copy per frame ("22 cells in the toast stack").
   - Caveat: bit identity holds "only while events arrive in timestamp order and no snap runs".
3. **Read last frame's value** (L54-L75).
   - A stage reads a stored copy, so its layers no longer come after the chain.
   - The drawer: "144 operations either way, in 17 layers instead of 30". The cost is lag: the grid trails the
     drawer's edge "by up to 60 px at 60 fps and 159 px at 10 fps". About 5% of frames at 60 fps drew a different column count,
     moving a thumbnail "by up to 533 px".
   - With commits only at events and settle checks, the lag grows "from 60 px to 174 px at 60 fps".
   - "Fewer layers only save time on an executor that runs a layer's operations at the same time, while today's CPU
     executor pays per operation."
4. **A fixed maximum with a named fallback** (L77-L97).
   - Examples:
     - snap past 300 steps;
     - code-points' text field lays out at most 12 lines and shows a warning;
     - Monitor's list: "Only 64 rows are drawn at a time.";
     - Photos has two zoom springs for 12 photos, about 300 operations fewer than one per photo.
   - Costs are paid always: about 210 operations per character cell, and about 2,200 operations and 40 layers per
     press capacity in HandwiredOS's event queue.
   - `emitApplySpringMatrix` "is 14 operations whether the frame runs 2 steps or 300".
   - Choosing the maximum: "300 steps against about 4 per frame at 60 fps", and "48 DOM slots against at most 32
     needed".
5. **Store what the user placed, and fit it to the viewport in every evaluation** (L99-L122).
   - A phone rotated and back leaves the windows where they were. Writing back the fitted rectangle "leaves
     HandwiredOS's three windows on one small rectangle".
   - Cost: 125 live operations and 7 layers. Without the `assumeRange`/`assumeGrid` declarations, "844 more live
     operations and 5 more layers".
6. **Anchor the scroll position to the row at the top of the view** (L124-L147).
   - Binary search over stored row bottoms.
   - At 10,000 rows: 10,000 state cells copied back "with one `Float32Array.set` in about 0.4 µs", and "1,290 of the
     program's 111,271 live operations" for the scroll machinery.
   - Storing only the first row would misplace the view "by 35,000 px".
7. **Scroll a list natively, and select a row at the release** (L149-L173).
   - The browser owns `scrollTop`. The host reads it at the top of each frame into an input cell (1/4 px grid).
   - Row r goes to DOM slot r % 64.
   - Program size is independent of row count "up to the 100,000 rows that the scroll cell's range covers".
   - Tested on "60,000 random frames".
   - The cost: stored state now depends on frame rate while scrolling ("a scroll position has no timestamp").

(The plan's question lists five of the seven. All seven are covered above.)

### 5.5 Which evaluations write state back (R:docs/execution-model.md#L222-L228; R:src/runtime/host-timing.ts#L233-L237)

- `'every evaluation'` (the `advanceFrame` default): FP32 rounds stored displacements once per evaluation, "by
  different amounts at different frame rates". Positions stay within 1.4e-4 px of float64 springs, and within
  1.5e-4 px of the 120 fps run.
- `'events and settle checks'` (template and HandwiredOS): only `'events'`, `'settle check'` and `'snap'` write back.
  `'frame'` runs on a copy. "every stored table and every drawn output at a shared timestamp is identical in every bit
  at every frame rate". Positions stay within 7.4e-5 px of float64. **Scope:** this is a measured result "in the
  same traces" of spring-matrix.test.ts (10, 30, 60 and 120 fps, 500 ms stalls), and it holds "as long as no snap
  runs" and while events arrive in timestamp order (R:docs/execution-model.md#L226, R:docs/behavior-choices.md#L48).
  Say "in the repo's tests, bit-identical", not "always bit-identical".
- Far from the origin: up to 131,072 px, displacements stay within 1.4e-4 px. At 1,048,576 px, FP32 spacing is 1/8 px,
  and displacements differ by up to 0.10 px.
- In code: `const writesBack = kind !== 'frame' || writeBack === 'every evaluation'` (R:src/runtime/host-timing.ts#L331).
  A frame on a copy "leaves it and the clock unchanged" (L344-L346).
- Settle checks: "a spring that is within 0.01 px of its destination and no faster than 0.01 px/s lands on the
  destination and stops. A moving spring stops at no other evaluation, so it stops at the same simulated time at every
  frame rate" (R:docs/tutorial.md#L110). The same line continues: "The one exception is a snap, which pins the thumb
  onto its destination when a frame would need more than 300 steps". So "the only evaluation where a moving spring
  stops" must say "apart from a snap". They cost "one more evaluation per 64 ms of animation, e.g. about one in four
  frames at 60 fps" (R:docs/execution-model.md#L220).

### 5.6 Worked numbers (independent Python port of host-timing.ts; verbatim output)

Command: `python3 -I host_timing_port.py` (cwd films/handwired-explained/research/runs). The port follows
R:src/runtime/host-timing.ts#L57-L404 line for line in float64, with JS `Math.round` emulated as floor(x + 0.5).

```
quantizeTimeMs(16.6667) = 16.671875
countSpringSteps(17.5, 300) = (4, 1.5, False)
countSpringSteps(1300, 300) = (0, 0, True)
springStepMatrix(650,45) = (0.9896, 0.0032800000000000004, -2.6, 0.8200000000000001)
springMatrixBound(650,45) = 10.360516548156738
M^4 = (0.9144878854291458, 0.009702458279854083, -7.690973026713601, 0.41279979876352013)
M^300 = (-1.26e-14, -4.60e-15, 3.65e-12, 2.25e-13)
peak speed px/s = 207.21011536958946  max overshoot px = 0.008904184533964382
first settle check that settles: step 128 = 512 ms        (float64 only, 20 px from rest)
```

How these match the repo's own statements:
- 16.6667 → 16.671875 is the example at R:src/runtime/host-timing.ts#L57.
- "17.5 ms pending runs 4 steps and carries 1.5 ms, and 1,300 ms pending with a budget of 300 snaps" (L120-L121).
- "10.36 for stiffness 650 and damping 45" (R:docs/execution-model.md#L243). The comment at host-timing.ts#L192
  rounds it to "10.4".
- "peaks at 207 px/s … and overshoots by 0.009 px" (R:docs/tutorial.md#L55).
- The step matrix for stiffness 650, damping 45, dt = 0.004 s is `[1 − 650·0.004², 0.004·(1−45·0.004), −650·0.004,
  1−45·0.004]` = `[0.9896, 0.00328, −2.6, 0.82]`. This can be checked by hand on screen.
- After 300 steps the spring has essentially died: M^300 has entries around 1e-12.
- The 512 ms settle time is a **float64 approximation** from the port, not a run of the FP32 template. Label it as
  approximate, or re-run in Bun.

A frame plan, scenario A from the port. Press at t = 1000.3 ms from idle, frame at 1008.2 ms, then 60 fps frames,
policy `'events and settle checks'`:

```
events  t=1000.296875 sim=1000.296875 steps=0 settleCheck=True  writesBack=True   (clock starts at the press)
frame   t=1008.203125 sim=1004.296875 steps=1 settleCheck=False writesBack=False  (7.9 ms -> 1 step, 3.9 ms carried)
frame   t=1024.859375 sim=1024.296875 steps=6  writesBack=False   <- counts from the last commit, not last frame
frame   t=1041.53125  sim=1040.296875 steps=10 writesBack=False
frame   t=1058.203125 sim=1056.296875 steps=14 writesBack=False
settle check t=1064.296875 steps=16 writesBack=True             <- 64 ms after the clock started
frame   t=1074.859375 sim=1072.296875 steps=2  writesBack=False
```

With `'every evaluation'`, the same frames run 5, 4, 4, then a 2-step settle check, then 2, 4, 4 steps. The usual
"about 4 steps per 60 fps frame" (Animation.md; R:docs/behavior-choices.md#L95) applies here.

**Visual takeaway:** under commits-only, a display frame is a *preview* that re-simulates from the last commit, so
its step count climbs 6 → 10 → 14 until a settle check commits.

Scenario C, 10 fps (100 ms frames): each frame holds a settle check at 64 ms, then frame steps of 9.
- At 200 ms: settle checks at 128 and 192, then a frame of 2 steps.
- With no events, the **committed** (settle-check) simulated times land on exact 64 ms multiples from when the clock
  started, whatever the frame rate. Frame previews don't (e.g. the 10 fps frame at 100 ms is simulated to 100 ms).

Scenario D, a 2 s stall: one `'snap'` evaluation (durationMs = 2000, steps = 0, snap = true), then the frame with the
clock stopped. This matches "2,000 ms for the snap after a 2 s stall" (R:src/runtime/host-timing.ts#L252).

Scenario E, the snap threshold (event at 0 ms, frame at 60 ms, then one long gap):

```
gap 1140  commits-only snap: False   every-eval snap: False
gap 1144  commits-only snap: True    every-eval snap: False
gap 1200  commits-only snap: True    every-eval snap: False
gap 1204  commits-only snap: True    every-eval snap: True
```

This reproduces the repo's "a 1,144 ms gap after an event at 0 ms and a frame at 60 ms, where `'every evaluation'`
needs a 1,204 ms gap" (R:docs/execution-model.md#L234).

### 5.7 Iteration across frames: a state machine over queued events (R:docs/patterns.md#L215-L237)

- Familiar form: `for (const event of events) state = nextState(state, event)`, which is k layers deep for k events.
- Handwired's answers:
  1. **The host gives iteration across evaluations.** `advanceFrame` runs one evaluation per distinct timestamp, so
     each evaluation is one turn of the state machine, and the stored state carries to the next. That's how the
     toggle's press → armed → release → flip works over two separate evaluations when the press and the release
     have different timestamps (R:docs/tutorial.md#L84-L93). **Exception:** a press and a release that share a
     timestamp apply in *one* evaluation, in the fixed order down then up (`armedAfterDown`), so the switch arms and
     flips in a single evaluation (R:docs/tutorial.md#L93, #L165; template/toggle.test.ts#L71).
  2. **Within one evaluation, regroup the loop.**
     - *Prefix scan.* Each event becomes a table from state to next state, and two tables compose as
       `combined[state] = later[earlier[state]]`. The doc's 3-state button example: `downOnButton = [armed, armed,
       pressedOutside]`, `moveOutside = [idle, pressedOutside, pressedOutside]`, and their composition is
       `[pressedOutside ×3]`. Sklansky or Brent-Kung networks then give every prefix.
       Costs at 64 events: 897 ops in 10 layers (Sklansky) and 681 in 14 (Brent-Kung), vs 129 in 65 for the loop.
     - *Speculation.* Blocks run from every possible start, then one `indexRead` picks the right one. Keyboard focus:
       1,000 ops in 25 layers vs 193 in 129.
     - *Sets of states* (regex automata). S² index reads per step, e.g. 1,156 ops per step at 32 states in JSON search.
  - Within one evaluation, an event cell keeps only "the last event of its kind". Events with different timestamps
    get evaluations of their own (R:docs/tutorial.md#L143). Events sharing a timestamp apply in the fixed order down,
    then up, then cancel (R:docs/tutorial.md#L165).
  - Don't use the scan on the CPU executor when operations cost more than layers: "at 64 events the loop is about
    7 times fewer operations than the scan" (R:docs/patterns.md#L236).
- Historical alternative from the lab: a fixed-size **event queue** inside one evaluation. Input's window circuit is
  10,196 operations and 281 layers at 32 events written out, or 2,230 ops and 55 layers with prefix counts
  (R:lab/ui-exploration/guide/sections/executor.md#L397-L398).

### 5.8 Art-department description of the apparatus (the "host loop as a clockwork")

The repo has no physical apparatus. The following is a **metaphor**, grounded in the mechanics:
- **The table:** a long tray of numbered cells, one `Float32Array`. Color-coded sections hold inputs, event latches,
  the 4 matrix cells, two bit flags and state.
- **The loom:** one fixed pass through the layers per evaluation, which cannot stop midway.
- **The host:** an escapement and ratchet clockwork beside the loom. It counts 4 ms ticks on a 1/64 ms ruler,
  presets 4 dials (the M^n matrix) and drops event tokens into slots.
  - It pulls the loom's crank once per planned evaluation: tick marks for settle checks at every 64 ms,
    one per event-timestamp group, one for the frame.
  - It latches the "next state" plate back onto the tray only on write-back turns.
  - On frame turns it runs a carbon-copy tray and discards it.
- **The ratchet** has 300 teeth. If more are needed, a spring-loaded pawl releases and every object slams onto its
  mark: the snap. Machines clack, never chime.
- **The DOM:** a shadow-puppet screen fed only by output numbers (`translate3d`, `aria-checked`).

---

## 6. Verified quotes (verbatim)

All repo quotes were read from the clone at 257856e with `cat -n`, and are reproduced here character for character.

1. "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table,
   or the same work on every item." — docs/patterns.md L3, and docs/README.md L9 (the same sentence).
   R:docs/patterns.md#L3. The first part was also confirmed on raw.githubusercontent at the full commit hash:
   https://raw.githubusercontent.com/chenglou/handwired/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/patterns.md
2. "A program can't loop a number of times that is only known at runtime, and the time since the last evaluation
   decides how many fixed 4 ms steps the spring takes." — R:docs/tutorial.md#L106
3. "A program runs each of its layers once, so it can't run a loop a runtime number of times. When one step is linear
   with constant coefficients, any number of steps is one matrix power." — R:docs/patterns.md#L200
4. "You don't write the list itself: you write builder code, i.e. ordinary JavaScript that runs once and appends
   operations to a `Circuit`, so nothing in the program branches or loops at runtime." — R:docs/tutorial.md#L13
5. "The JavaScript around the program is the host: it writes browser inputs into the table and runs the program on
   it, which is one evaluation, then writes the program's next-state values back into the table and its other outputs
   to the DOM." — R:docs/tutorial.md#L13
6. "Event handlers only queue events with their timestamps." — R:docs/tutorial.md#L110
7. "The page requests another frame only while the clock runs, i.e. until an evaluation that writes state back finds
   nothing animating." — R:docs/tutorial.md#L161
8. "A program's size is fixed while building, so every count that JavaScript keeps in a growing array or a loop
   variable becomes a maximum, and what the program does past the maximum is part of the behavior."
   — R:docs/behavior-choices.md#L79
9. "This rule keeps the static bound: no frame runs more than 300 steps, and no time carries into later frames."
   — R:docs/execution-model.md#L235
10. "Before an event with timestamp T is applied, springs step to T toward the destinations in effect before T, and a
    stopped clock starts at T. So a new destination starts pulling within 4 ms of T at any frame rate."
    — R:docs/execution-model.md#L210
11. "Everything here is float64 JavaScript that runs between evaluations. It never builds operations and never
    touches the DOM." — R:src/runtime/host-timing.ts#L3-L4 (code comment, with the `//` markers removed; the line
    break falls after "It never")
12. "Stored state depends only on the events" — R:docs/behavior-choices.md#L48 (sentence start). The fuller line at
    R:docs/execution-model.md#L226 reads: "Stored state then depends only on the events, as long as no snap runs".
13. "Give every maximum an output or a check, e.g. an overflow output like `slotOverflow`: without one, a program past
    a capacity computes wrong values, and no output shows the problem." — R:docs/behavior-choices.md#L95
14. Cheng, as recorded in the repo: "No need to abide by the guide religiously. Back out what didn't"
    — R:lab/status.md#L44. This is a second-hand record inside lab/status.md, not a signed statement, and it isn't
    about the host loop. Use it only if the film needs a line from Cheng.
15. README: "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!"
    — R:README.md#L3, confirmed live at https://github.com/chenglou/handwired

External excerpts (fact-check 2026-10-27: each checked verbatim against the raw file or page HTML. chenguini is
read at `main`, which is unpinned and can change, so re-check before lock):
- chenguini ui.md: "Only events and render's final step can schedule a next render."; "Handle inputs" / "Animation
  tick" / "Commit state changes"; "you can hit test against `dest`, the stable target, instead of the moving `pos`."
  — https://github.com/chenglou/chenguini/blob/main/docs/ui.md
- Animation.md: "N = 300 (1200ms at 4ms/step) is a good default." and "the remaining gap catches up naturally over
  subsequent frames — no time skip." — https://github.com/chenglou/chenguini/blob/main/docs/Animation.md
- Fiedler 2004: "It’s what happens when your physics simulation can’t keep up with the steps it’s asked to take."
  (the page uses curly apostrophes) — https://gafferongames.com/post/fix_your_timestep/

UNVERIFIED — do not use as a quote: any paraphrase such as "a neural net can't take an if-statement", or "Handwired
can't loop". The repo says it can't loop a *runtime* number of times, and loops are rewritten, not banned.

---

## 7. Debates and controversies (design trade-offs, both sides from the repo and its references)

1. **Snap vs carry past the cap.**
   - *Carry* (ui.md, Animation.md): no time skip; the gap "catches up naturally over subsequent frames".
   - *Snap* (host-timing.ts): no time carries, no frame does more than 300 steps, and the snap's result doesn't depend
     on when it runs. The cost is a visible jump after a stall of about 1.2 s
     (R:docs/behavior-choices.md#L87; R:docs/execution-model.md#L234).
   - *No cap* (chenglou.github.io's index.ts) "runs every pending step with no cap" (R:src/runtime/host-timing.ts#L123-L124).
2. **Every evaluation vs commits only at events and settle checks.**
   - Commits-only: replay is bit-identical across frame rates.
   - Every evaluation: never snaps for frame gaps up to 1,200 ms. Commits-only can snap from about 1,140 ms, so
     "whether a snap runs can differ across frame rates, and so can the stored state after it"
     (R:src/runtime/host-timing.ts#L304-L311). Commits-only also worsens read-last-frame lag (60 → 174 px).
3. **Depth vs work.**
   - Prefix scans and read-last-frame cut layers.
   - "today's CPU executor pays per operation" (R:docs/behavior-choices.md#L71), so fewer layers don't always save
     time. A layer itself costs "about 10 µs per 1,000 layers" (R:docs/patterns.md#L7).
4. **Frame-rate independence is partial.**
   - The native list scroll (choice 7) gives up frame-rate independence while scrolling.
   - A viewport written every frame without a resize event brings frame-time dependence back
     (R:docs/execution-model.md#L237).
5. **Exactness of the matrix-power spring.** It is close to the float64 loop, not bit for bit: within 3e-4 px over
   1,000 random springs (R:docs/patterns.md#L211). "Exact settling says nothing about whether gradients through many
   steps stay usable" (R:docs/execution-model.md#L251).

---

## 8. Misconceptions to avoid

- **"Handwired programs can't loop."** Wrong. They can't loop a *runtime-dependent* number of times, or stop early.
  Loops become counts, trees, tables or same-work-on-every-item, and repetition over time comes from the host
  re-running the program.
- **"The host loop is part of the neural net."** No. `host-timing.ts` is float64 JavaScript that "never builds
  operations and never touches the DOM". The program is FP32.
- **"The spring runs n steps inside the program."** No. The host computes M^n in float64. The program applies it once
  with 4 products, 14 ops in 3 layers.
- **"One evaluation per frame."** Not since 2026-09-15 in HandwiredOS. There is one per distinct event timestamp,
  plus settle checks, plus the frame (about 17 for a 60 fps drag frame with 16 moves).
- **"The frame evaluation isn't shown."** It *is* what's drawn. Under commits-only it runs on a copy, and its next
  state is discarded.
- **"Snap is a crash or error."** It is a defined, named fallback: objects land on their destinations with zero
  velocity.
- **"State is bit-identical across frame rates, always."** Only with `'events and settle checks'`, events in timestamp
  order, and no snap. Native scrolling is excluded too.
- **"Durations are always clamped to 1,200 ms."** `quantizeFrameTiming` clamps them. `PlannedEvaluation.durationMs`
  is not clamped, and 2,000 ms after a 2 s stall is possible (R:src/runtime/host-timing.ts#L251-L254).
- **"It runs on the GPU."** All src/runtime execution is JS on the CPU. "Tensor" means layers of sparse matrices
  (R:docs/execution-model.md#L298). **Scope the WebGPU claim:** of the three shipped demos in `src/`, only
  `src/json-search` runs on WebGPU (the doc gives it as "e.g."). Many **lab** experiments also run programs on WebGPU
  (e.g. lab/knuth-plass/gpu, lab/json-search/gpu, lab/ui-exploration/codegen, pixel-output, instanced-items; found
  with a grep for `navigator.gpu` in the clone). The README: "either run it on JS or WebGPU, for fun" (R:README.md#L26).
  Say "only the JSON search demo", never "only JSON search, anywhere in the repo".
- **"Semi-implicit Euler is energy-exact."** Don't claim this. The repo only says one semi-implicit Euler step (velocity
  first, then position with the new velocity) is a 2×2 matrix (R:src/runtime/host-timing.ts#L151-L163). Damping
  removes energy by design.
- **Don't say the commit is dated 2026-10-27.** It is 2026-10-16.
- **Don't state a current HandwiredOS cell or operation count from lab/status.md without a date.** It changed many
  times (e.g. 241, 259, 234 and 438 source cells appear at different points).

---

## 9. Curiosity hooks (true, sourced)

1. A spring of up to 300 steps costs the program the same 14 operations as a spring of 2 steps. The "loop" lives in
   4 numbers the host writes (R:docs/behavior-choices.md#L93).
2. Unrolling that loop honestly would cost 3,301 operations in 902 layers per spring (R:docs/patterns.md#L210).
3. With ui.md's familiar render order, the same session at 10 fps and at 120 fps can disagree by 359 px at the same
   instant (R:docs/execution-model.md#L212).
4. Under commits-only, HandwiredOS replays a timestamped session at several frame rates, and the stored tables come
   out identical in every bit (R:docs/behavior-choices.md#L52).
5. Toasts: hit-testing where things are *going* lets three quick presses close three toasts, and is 35 ops in
   5 layers instead of 205 in 34 (R:docs/behavior-choices.md#L18-L22).
6. Store a clock in an FP32 cell and, about 70 minutes into a session, `performance.now()` can only be held on a
   0.5 ms grid. That's why absolute time stays in float64 JS (R:src/runtime/host-timing.ts#L84-L85).
7. The display frame under commits-only is a dress rehearsal: it computes a whole next state and throws it away
   (R:docs/execution-model.md#L226).
8. Timestamps are rounded to 1/64 ms *before* subtracting, so splitting a time span any way gives durations that add
   up exactly (R:src/runtime/host-timing.ts#L57-L60).
9. Copying 10,000 rows of state back takes one `Float32Array.set`, in about 0.4 µs (R:docs/behavior-choices.md#L141).
10. The cap of 300 steps is about 72 times the roughly 4 steps (16.67 ms ÷ 4 ms = 4.17) that a normal 60 fps
    frame needs. The doc's wording: "300 steps against about 4 per frame at 60 fps" (R:docs/behavior-choices.md#L95).
    Don't say "75 times"; that uses the rounded 4.

---

## 10. Visual and dramatic details

- **Settings:** a browser window at night, the requestAnimationFrame heartbeat as a metronome, a toggle switch (the
  template). Track and thumb: the thumb travels **20 px** (the template's rest position at the end of its test is
  20 px, R:docs/tutorial.md#L169; the travel figure is from L167). Release-to-flip semantics: "a press on the track
  arms it, and a release on the track while it's armed flips it" (R:docs/tutorial.md#L3).
- **Objects for the teaching machine:**
  - a 1/64 ms ruler;
  - a 4 ms tick escapement;
  - a 300-tooth ratchet with a release pawl (the snap);
  - a 4-dial matrix preset (0.9896 / 0.00328 / −2.6 / 0.82 for one step);
  - event tokens stamped with times;
  - a carbon-copy tray for frame previews;
  - a settle-check bell (make it a *clack* stop, per the brief: machines never chime) at every 16th tick.
- **Drama beats:**
  - **The stall.** The tab freezes for 2 s, and on return everything clacks onto its mark at once.
  - **The race.** The same recorded session played at 10 fps and at 120 fps, side by side. Under the familiar order
    they drift up to 359 px apart. Under Handwired's they match in every bit.
  - **The toast trick.** Three presses on one spot.
- **Period details:** 2026. The docs name Bun 1.4.3 on an Apple M5 Max (R:docs/patterns.md#L7), and Bun 1.4.0 with
  headless Chrome 153 on an Apple M5 Max (R:lab/status.md#L44). Keep any hardware on screen generic unless it's tied to a cited measurement.

---

## 11. Sources

1. https://github.com/chenglou/handwired (public repo page: README first line, MIT, ~2.0k stars, 825 commits as fetched 2026-10-27)
2. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/runtime/host-timing.ts (L1-L404, all cited lines)
3. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/tutorial.md (L3, L13, L20-L49, L55, L68, L84-L93, L106-L161, L165-L169)
4. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/execution-model.md (L3, L40, L166-L251, L298)
5. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/behavior-choices.md (L1-L173)
6. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/patterns.md (L3, L7, L198-L237)
7. https://raw.githubusercontent.com/chenglou/handwired/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/patterns.md (live confirmation of the L3 quote)
8. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/README.md (L9)
9. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/toggle.ts (L86-L170)
10. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/template/toggle.test.ts (test names L41, L65, L71)
11. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/tests/runtime/spring-matrix.test.ts (test names L556-L1348, e.g. L788, L877, L1230, L1285, L1348)
12. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/status.md (L3, L12, L14, L36, L44)
13. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/ui-exploration/guide/sections/executor.md (L393-L401)
14. https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/README.md (L3)
15. https://chenglou.me/handwired/ (live demo index: Mini OS, Learned gallery, Search 100,000 JSON documents)
16. https://github.com/chenglou/chenguini/blob/main/docs/ui.md (Render Loop, Hit Testing, Event Handling, State The Browser Keeps)
17. https://github.com/chenglou/chenguini/blob/main/docs/Animation.md (Spiral of Death Prevention, N = 300)
18. https://gafferongames.com/post/fix_your_timestep/ (Glenn Fiedler, "Fix Your Timestep!", 2004-06-10; accumulator, spiral of death)
19. https://www.sofa-framework.org/api/master/sofa/html/classsofa_1_1component_1_1odesolver_1_1forward_1_1_euler_explicit_solver.html (semi-implicit Euler: velocity first, then position)
20. Independent port output (this dossier, §5.6): `films/handwired-explained/research/runs/host_timing_port.py`.

---

## Fact-check log (adversarial pass, 2026-10-27)

**Method.**
- Every repo quote and number was re-read from the clone with `sed -n`. The cited files (docs/patterns.md,
  docs/execution-model.md, docs/tutorial.md, docs/behavior-choices.md, src/runtime/host-timing.ts) were downloaded
  from `raw.githubusercontent.com/chenglou/handwired/257856e…` and are **byte-identical** to the clone.
- GitHub API: `main` = 257856e (2026-10-17T00:33:49Z), 825 commits, 2,034 stars, MIT, public, created
  2026-10-15T02:15Z, i.e. Oct 14 Pacific.
- The spring numbers were recomputed with a fresh float64 script, independent of the dossier's port: the step
  matrix, bound 10.360516548 (after the code's `Math.fround(bound × (1 + 1e-6))`), 207.21 px/s, 0.0089 px,
  16.671875, and 2^22 ms = 69.9 min where the FP32 ulp is 0.5 ms.
- The 1,144 vs 1,204 ms snap thresholds were re-derived by hand: 301 steps from the last commit at 0 ms against
  301 steps from the frame at 60 ms.
- External pages were fetched raw: chenguini `ui.md` and `Animation.md` at `main`, and Fiedler's page HTML.
- No repo code was executed. The FP32 program-side numbers (operation counts, bit-identity, the 38 frames) stand as
  the repo's own documented results.

**Confirmed (key claims 1–20).** All 20 key claims match the repo text at the cited lines, except for the scoping
fixes below:
- 1 (patterns.md L3, README L9)
- 2 (tutorial L13, L106)
- 3 (tutorial L13; toggle.ts L111–131)
- 4 (toggle.ts L111–131, L150–157)
- 5 (tutorial L110; execution-model L214, L220)
- 6 (host-timing.ts L3–4, L35–39)
- 7 (patterns L210; execution-model L178)
- 8 (tutorial L55; execution-model L243; recomputed)
- 9 (execution-model L232–235)
- 10 (behavior-choices L5, L79; ui.md; Animation.md)
- 11 (execution-model L226; behavior-choices L48)
- 12 (execution-model L210–212; behavior-choices L32, L42)
- 13 (execution-model L234; re-derived)
- 14 (behavior-choices: 7 H2 sections, L22, L66–68, L89)
- 15 (behavior-choices L79, L95)
- 16 (patterns L215–236)
- 17 (tutorial L110; execution-model L220)
- 18 (lab/status L14; executor.md L395)
- 19 (host-timing.ts L57–60, L84–85; recomputed)
- 20 (execution-model L298)

**Changes made.**
1. **WebGPU "only" (claim 20; §8): corrected scope.**
   - Of the shipped `src/` demos, only json-search uses WebGPU.
   - Many lab experiments also do: grep `navigator.gpu` finds lab/knuth-plass/gpu, lab/json-search/gpu,
     lab/ui-exploration/{codegen,pixel-output,instanced-items,text-walker,event-time,user-population}.
   - The doc says "e.g.", not "only". Sources: R:docs/execution-model.md#L298, R:README.md#L26, the clone.
2. **"Settle check is the only evaluation where a moving spring stops" (claim 17; §5.5): added the snap exception.**
   R:docs/tutorial.md#L110 continues "The one exception is a snap".
3. **Bit-identity (claim 11; §5.5): scoped.**
   - It is a measured result "in the same traces" (spring-matrix.test.ts at 10/30/60/120 fps with 500 ms stalls).
   - It holds only with no snap and with events in timestamp order (R:docs/execution-model.md#L226,
     R:docs/behavior-choices.md#L48).
4. **Fiedler framing (§2, §4): marked CONTESTED as a "carry" example.**
   - His loop has `if ( frameTime > 0.25 ) frameTime = 0.25;`, so a long backlog is discarded. Only the remainder
     below one dt is carried.
   - The page also says "the so called 'spiral of death'", so he did not coin the term. Date "Jun 10, 2004"
     confirmed. https://gafferongames.com/post/fix_your_timestep/
5. **Hook 10 "75 times": corrected to about 72.** 300 ÷ (16.67 ms ÷ 4 ms) = 72. The doc says "about 4 per frame"
   (R:docs/behavior-choices.md#L95; Animation.md "~4 steps/frame").
6. **Toggle "across two separate evaluations" (claim 16; §5.7): added an exception.** A press and a release that
   share a timestamp apply in one evaluation, down then up (R:docs/tutorial.md#L93, #L165;
   template/toggle.test.ts#L71).
7. **Scenario C "simulated time always lands on 64 ms multiples": corrected.** This holds only for committed
   settle-check times (absent events), not for frame previews. Follows from the port's own scenario and
   R:docs/execution-model.md#L220.
8. **"Event handlers only queue" (claim 3; §5.2): nuance added.** The quote is verbatim, but the handlers also call
   `scheduleRender()` (R:template/toggle.ts#L163-L168).
9. **Quote 11 line-break note: corrected.** The break in host-timing.ts falls after "It never", not after
   "evaluations. It" (R:src/runtime/host-timing.ts#L3-L4).
10. **Read-last-frame "about 5% of frames": added "at 60 fps"** (R:docs/behavior-choices.md#L65).
11. **Timeline "Measured afterwards": removed as unsourced.** lab/status.md L12 only says the absolute-position form
    lasted "until September 14, 2026" and that the text was moved there on 2026-10-15.
12. **Commit date: added the UTC form.** 2026-10-16 17:33 -0700 = 2026-10-17T00:33:49Z (GitHub API). It is still the
    head of `main` as of 2026-10-27.
13. **"ui.md … his own guideline" (§3): demoted to inference.** The repo calls chenguini "a set of engineering and UI
    guidelines" and never states its author. It is only hosted under the `chenglou` account.
14. **Period details (§10): fixed the citation.** patterns.md L7 names Bun 1.4.3 and an Apple M5 Max but no Chrome.
    Headless Chrome 153 and Bun 1.4.0 come from R:lab/status.md#L44.

**Unverifiable (left as-is, flagged).**
- When the absolute-position springs were measured (lab/status.md L12 gives no date).
- Cheng's original wording beyond the repo's second-hand record "No need to abide by the guide religiously. Back out
  what didn't". It is verbatim as recorded in lab/status.md L44. The film may quote it only as "recorded in the repo".
- Authorship of chenguini, from the repo alone.

**Quotes.** All 15 repo quotes in §6 match character for character, once code-comment `//` markers are removed.
The three external excerpts match the fetched pages; chenguini is unpinned at `main`.
