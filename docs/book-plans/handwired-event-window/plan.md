# Event Window — plan

- **Slug:** handwired-event-window · **Title:** Event Window
- **Subtitle:** Drag, click and focus as latches and one narrowing ramp, checked against plain code
- **Animal:** hummingbird (hovers, then darts to one exact spot) · **Accent:** `#7b61d1` (violet; siblings use teal, amber, copper)
- **Lab:** `lab/event-window` @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46. Status: **holds for the hand-authored circuit; the training result is narrowed** (training supplies the oracle's correct internal state and decision labels; persistent state and temporal dependencies remain). Historical: the move-compression bug (fixed) and the fixed-ramp failure, kept as the lesson that motivated annealing. Open: double-click and flick velocity from the archive, training on rollouts, fractional and batched inputs, discovering the latches.
- **Throughline noun:** the press (a pointer press and the record it writes).
- Paths are relative to the clone `lab/event-window/` unless stated. Pointers live here only, never in captions. Numbers come from the research file `.orly-work/hw-books/inputs/event-window.md` (live runs of `bun test`, `training-sweep.ts`, `measure-cost.ts` and a scratch fixed-ramp check).
- Re-defined briefly, not re-taught: relu (ch1 cap 1, only named), circuit (ch1 cap 1-2), one-hot (on screen only, `pressRectangle`). Argmax does not appear.
- **Corrections taken from the research and `caption-review.md`:**
  - Cost: use the live **480 ops, depth 52, +36 ops and +72 stored weights per extra press record** (K = 1, 2, 4, 8, 16 → 480, 516, 588, 732, 1020). The README and the earlier plan say 502 / depth 38 / +60; those are stale. Never show 502 or 38 except as the crossed-out README figure in ch3 beat 6.
  - **120,000 frames is the hand-authored circuit.** Trained circuits: 30,000 frames each (3 held-out traces × 10,000). Never put one stamp over both.
  - Ramp, not sigmoid: the threshold is `clamp01(diff × sharpness + 0.5)`, a linear ramp. Its width is `1/sharpness`. Draw a straight-sided ramp, not an S-curve.
  - The two thresholds have opposite signs: title `difference = titleBoundary − (eventY − hitTop)`, slop `difference = chebyshev − slopBoundary`. Do not put one formula on screen for both; show the generic shape `bit = clamp01(difference × sharpness + 0.5)` only.
  - The probe checks K ∈ {1, 4, 16, 64, 256} in two framings (empty frames, identical hover moves). Say "for every length tested", never "for all K".
  - The demo bug is fixed; present it as history.
- Scene look: house look of `handwired/chapter-1.tsx` and `chapter-4.tsx`. Each chapter declares `tl.channel('cam', CAMERA_HOME, cameraInterp)`. Keep y ≳ 630 free of content (caption pill).
- Real geometry (probe config, `boundary-probe.test.ts:31-50`): stage 1280×800; rectangle 0 is 300×200 at (400, 300); rectangle 1 250×180 at (900, 100); rectangle 2 200×150 at (100, 550); rectangle 3 320×240 at (850, 480). Title bar = top 30 px. Slop 4 px. Authored boundaries: slop 4.5, title 29.5.

---

## Chapter 1 — Latches, Not History

**Thesis:** A window's memory is a few latches written only on events; a bounded window of raw inputs provably cannot hold it.

**Visual machine: the latch bank beside a live window.** Left: the 1280×800 stage scaled down, four rectangles with title bars, a pointer dot, a ghost outline of the stored position. Right: the **latch bank**, a column of labelled cells that each light only when written, with a "last written" tick showing which event wrote them. Below the stage a thin event strip (down / move / move / up) with a playhead. The persistent object is rectangle 0: it is dragged from left 400 to 460, clicked, and finally appears twice in the probe split-screen.

**Beat sheet**
1. (cap 1) Camera wide on the stage. Four windows; the latch bank is an empty grey column. Chips float in: `drag?`, `focus?`, `maximized?` pulling toward the empty bank. The word "relu" appears as a small ramp glyph on the bank edge.
2. (cap 2) The event strip fills with four slot types (`down`, `move`, `up`, `empty`); a pointer dot rides each. A tag `1 event per frame`. A dashed output arrow: "where every window is drawn".
3. (cap 3) A second stage, grey, mirrors the first labelled `oracle.ts · oracleTick`; the circuit's stage is labelled `circuit.ts`. A `===` comparator sits between them (equality drawn as a bridge turning green).
4. (cap 4) Camera pushes on rectangle 0. The pointer lands at (410, 305), inside the 30 px title strip (bracket labelled `30 px`). On the `down` tick, the press record cells flash in together: `pressActive`, `pressX = 410`, `pressY = 305`, `pressRectangle` (one-hot, slot 0 lit), `grabLeft = 400`, `grabTop = 300`, `pressOnTitle`, `pressWasFocused`, `pressOnMaximized`. A pencil icon says "written on down only".
5. (cap 5) Moves: the pointer slides right. A square "Chebyshev" gauge (max of |dx|, |dy|) grows from the press point and a ring of radius 4 px is drawn around it. When the gauge crosses the ring, `slopLatch` lights. Record cells stay dark.
6. (cap 6) The window itself follows the pointer to left 460 (pointer at 470, 305). Equation chip `displayed left = grabLeft + pointerX − pressX = 400 + 60 = 460`, with a clamp bracket `0 … 980`.
7. (cap 7) A ghost outline stays at left 400 labelled `stored left`. On the `up` tick, a commit arrow fires: ghost slides to 460 and `stored left = 460` flashes. Gate chip `commit = up · slopLatch · dragEnabled · (1 − pressOnMaximized)`.
8. (cap 8) Reset. Pointer presses on the body of an unfocused window: only the `focused` cell changes (focus ring moves onto it); nothing else moves. A line labelled `focus changes on down only`.
9. (cap 9) Press again on the focused window's body; `up` with `slopLatch = 0`; the window jumps to full stage. Chip `maximized′ = maximized + toggle × (1 − 2 × maximized)`; one-line trace 0 → 1.
10. (cap 10) Replay a press where the pointer goes out 9 px, then back to the press point. The Chebyshev gauge returns to 0 but `slopLatch` stays lit; the toggle gate shows `1 − slopLatch = 0` and the click dies. Release clears the latch.
11. (cap 11) Camera pulls back; the screen splits. Top lane: trace A `down, move +60, up, then 256 more inputs`; bottom lane: trace B `256 empty slots × 3, then the same 256 inputs`. A bracket marks the identical last 256 inputs, tagged `same last K inputs`. Small K selector ticks 1, 4, 16, 64, 256.
12. (cap 12) Both lanes end in a window: top at left 460, bottom at left 400, marked different. A question-mark map `f(last K inputs)` points at both and is struck out; the `stored left` latch is highlighted as the thing that differs. Quiet frame: dim the lanes to ≤ 0.15 under a one-line summary: `latches hold committed aggregates; written on events, not every frame`.

**Captions** (numbers are spoken words; see book.json)
1. A window has to remember things… relu. `[README.md:3,7 (what recurs between frames); lab/status.md:200]`
2. Four windows sit on a twelve-eighty by eight-hundred stage… `[trace.ts:37-38,49; oracle.ts:37; research: "A frame carries at most one event"]`
3. Plain code already does this job… oracle… `[oracle.ts oracleTick; harness.ts:21-112 runClosedLoop compares with ===]`
4. Press on a title bar, the top thirty pixels… press record… `[oracle.ts:151; circuit.ts:266-284 latchOnDown; circuit.ts:38-80 cell layout]`
5. Moves never touch that record… Cross four pixels… `[oracle.ts:164-170 "distance > config.slop"; circuit.ts:288-302 chebyshev, slopLatch]`
6. While that latch is on, the window is drawn at… four hundred sixty. `[oracle.ts:251-265; circuit.ts:403-423; boundary-probe.test.ts:59-67 (down at 410,305; move +60)]`
7. But the stored position hasn't changed… release commits. `[oracle.ts:174-178; circuit.ts:346-388; boundary-probe.test.ts:85-86]`
8. Now a click… focus changes on a pointer down… `[oracle.ts:180-187 (pressWasFocused); circuit.ts:390-398]`
9. Click the focused window's body… arithmetic… `[circuit.ts:346-388 toggle, maximized′; oracle.ts:180-187; relations: authoredRelations in trace.ts (body = click-toggle)]`
10. Cross the four pixels and drift back… `[pointer-input.ts:9 "Returning to the press point must not erase an earlier drag-threshold crossing."; circuit.ts:295-302; pointer-input.test.ts:7-32]`
11. Could the circuit skip the latches… probe… `[boundary-probe.test.ts:1-20,56-89 (K list at :69; two framings)]`
12. Yet the window ends in two places… `[boundary-probe.test.ts:85-86 (460 vs 400), :1-20 (aggregate latch argument)]`

**On-screen labels (exact):** `oracle.ts · oracleTick`, `circuit.ts · buildEventWindowCircuit`, `pressActive`, `pressX = 410`, `pressY = 305`, `pressRectangle` (one-hot ×4), `grabLeft = 400`, `grabTop = 300`, `pressOnTitle`, `pressWasFocused`, `pressOnMaximized`, `slopLatch`, `slop = 4 px`, `titleHeight = 30 px`, `stored left`, `displayed left = 400 + 60 = 460`, `commit = up · slopLatch · dragEnabled · (1 − pressOnMaximized)`, `maximized′ = maximized + toggle × (1 − 2 × maximized)`, `focused′ = down ? hitRectangle : focused`, `1280 × 800`, probe K ticks `1 · 4 · 16 · 64 · 256`, `460 ≠ 400`.

---

## Chapter 2 — A Ramp That Narrows

**Thesis:** Every threshold is one ramp; annealing its width from 32 px to a quarter pixel recovers six parameters in 20 of 20 starts, while a fixed ramp drifts off and fails.

**Visual machine: the title-boundary axis.** One vertical pixel axis (offset below the window top, 20 → 40, with ticks at 29 and 30 and the band `[29, 30)` shaded) with a draggable boundary line and a translucent ramp band around it. Press dots sit on the axis at integer offsets: red = title presses (offsets ≤ 29), green = body presses (offsets ≥ 30). A loss/divergence readout sits on the right. A second identical axis, lower on the stage, hosts the fixed-ramp run for beats 11–13. A small slop axis (3 → 6, band `(4, 5]`) is a thin companion under the main axis.

**Beat sheet**
1. (cap 1) A ramp curve is drawn alone: diagonal between 0 and 1, clamped flat on both sides. Equation `bit = clamp01(difference × sharpness + 0.5)`; slider glyph for sharpness. Camera on the curve.
2. (cap 2) Slide the curve onto the title axis. Boundary line at 29.5. Dots at offsets 29 (red) and 30 (green) land either side of the line. Label `titleHeight = 30`; `oracle: title if offset < 30`.
3. (cap 3) Two ramps stack: top "shipped" with a staircase snapped to 0/1 (`circuit.boolean`), bottom "training copy" with the sloped ramp, `0 boolean atoms`. A small gradient arrow rides the slope, and is absent on the step.
4. (cap 4) Six cells light on a strip: `titleBoundary`, `slopBoundary`, `dragFromTitle`, `dragFromBody`, `clickTogglesFromTitle`, `clickTogglesFromBody`. Everything else (the latch bank from ch1, dimmed) is locked with a padlock.
5. (cap 5) A single frame becomes a card: `input + oracle state → 21 decision bits`. A pile of 15,844 such cards (two traces of 10,000 frames, kept frames only) stacks beside the axis. Tag `single frames · no backprop through time`.
6. (cap 6) Scramble: boundary line jumps to 85.95; slop line to 12.86 on the slop axis. The ramp band is drawn 32 px wide, wide enough to cover the far dots; arrows from covered dots pull the line.
7. (cap 7) Four snaps, each with a phase chip: `sharpness 1/32 → width 32 px`, `0.25 → 4 px`, `1 → 1 px`, `4 → 0.25 px`. The line slides down toward the dots at each; the band narrows with a ease.pop on each snap. A ticking `learning rate × 1, ×1, ×0.3, ×0.1` strip and a small "moments reset" flash on each snap. Camera pushes in as the band narrows.
8. (cap 8) Line settles at 29.702 inside `[29, 30)`; slop line at 4.500 inside `(4, 5]`. Both bands glow green.
9. (cap 9) Relation cells round: `1001` bit-string chip (`dragFromTitle, dragFromBody, clickTogglesFromTitle, clickTogglesFromBody` = 1, 0, 0, 1). Three held-out traces flash by; counter `0 / 30,000`.
10. (cap 10) Camera pulls back: 20 faint lines start scattered (initial title 49.91 … 85.95) and all converge into the band; endpoints stamped as a dot cloud spanning 29.390 … 29.821 on the title axis and 4.174 … 4.842 on the slop axis. Counter `20 / 20 recovered`.
11. (cap 11) Clear. Second axis opens below: line starts exactly at 29.5, band fixed at 4 px. Over the beat the line drifts to 30.014 and the slop line to 3.967 (small readout `title 30.0138 · slop 3.9671`).
12. (cap 12) A seven-point loss U-curve (title 29 … 30.5; fixed ramp) draws on the right: values 0.002749, 0.002679, 0.002629, 0.002599, 0.002590, 0.002598, 0.002621. The minimum at 30 gets a marker; the true 29.5 is labelled with `0.002629`.
13. (cap 13) A 10,000-frame bar: 9,120 frames fill red, first red tick at frame 135, counter `9,120 / 10,000`. The earlier axis is dimmed to ≤ 0.15 behind a short summary: `anneal: 20 / 20 · fixed ramp: 9,120 / 10,000 diverge`.

**Captions**
1. The title test and the slop test share one shape: a ramp… `[circuit.ts:152,161-164 thresholdBit; uses at circuit.ts:264, 294]`
2. Is a press on the title?… twenty-nine and a half… `[circuit.ts:259-264 titleDifference; circuit.ts:599-608 titleBoundary = titleHeight − 0.5; oracle.ts:151]`
3. In the shipped circuit a rounding step… `[circuit.ts:152 bit = exact ? circuit.boolean : identity; training.test.ts:39-45 boolean = 0]`
4. Training adjusts six numbers… `[circuit.ts:590-597 behaviorParameterCells; train.ts:131-138; README.md:7 (structure not learned, README:132 per research)]`
5. It trains on single frames… twenty-one decision bits… `[train.ts:40-56 supervisedBitCount = 21; train.ts:66-97 harvestTrainingPairs; train.ts:80 writeOracleStateToSource; boundary-probe.test.ts:15-19 "event-triggered… which is why training needs no backpropagation through time"]`
6. Start far off… near eighty-six… near thirteen… thirty-two pixels wide, so frames within sixteen px of a far boundary still pull on it… `[training-sweep.ts seed 1: initial slop 12.86, title 85.95; train.ts:142-144, 152-157; inference ("frames within sixteen px of a far boundary still pull on it") supported by the stall check: at fixed sharpness 0.25 a slop boundary starting at 12.857 never moves]`
7. Then the ramp narrows in three snaps… `[train.ts:152-157 phases; train.ts:182-189 and :202-207 optimizer moments reset; learningRateScale 1, 1, 0.3, 0.1]`
8. The title boundary lands at twenty-nine point seven… `[training-sweep.ts seed 1: learned slop 4.500, title 29.702; README.md:81-91; band: README slop in (4, 5], title in [29, 30)]`
9. Round the relation cells… zero in thirty thousand. `[train.ts:265-274 hardenParameterValues; train.ts:285-305 verifyHardenedParameters; training-sweep.ts:23,36 (3 traces × 10,000); seed 1 row: `1001 ✓`, `0/30000`]`
10. Repeat from twenty scrambled starts… `[training-sweep.ts output: recovered 20/20; learned title 29.390 … 29.821 (seed 16 … seed 2); slop 4.174 … 4.842 (seed 19 … seed 13)]`
11. Now hold the ramp fixed at four pixels wide… `[README.md:69-71 "starting FROM THE AUTHORED TRUTH drifts the title boundary to ≈30.01"; train.ts:105-109 constantSharpness; research §5 scratch check: title 30.0138, slop 3.9671; ramp width 1/0.25 = 4 px]`
12. Why? … lowest at thirty… `[research §5 grid: loss 0.002590 at 30, 0.002629 at 29.5 (sharpness 0.25); train.ts:315-340 measureMeanLoss; training.test.ts:93]`
13. Hardened, that drifted circuit diverges… `[README.md:71 "diverges from the oracle 9,120 times over a 10,000-frame held-out trace"; research §5: first divergence 135; training.test.ts:79-123]`

Scope notes for the scene: the "three snaps" cap 7 line widths are `1/sharpness` computed from the four phase sharpness values; do not label the ramp "sigmoid". Do not show the README's 30.33 estimate (not checked). The 4 px width in beats 11–13 is the sharpness 0.25 of the second phase, held for the whole run.

**On-screen labels (exact):** `bit = clamp01(difference × sharpness + 0.5)`, `titleBoundary = 29.5`, `slopBoundary = 4.5`, band `[29, 30)` and `(4, 5]`, `titleHeight = 30`, `behaviorParameterCells` (6 chips), `supervisedBitCount = 21`, `15,844 pairs`, `sharpness 1/32 · 0.25 · 1 · 4`, widths `32 px · 4 px · 1 px · 0.25 px`, `learning rate ×1 · ×1 · ×0.3 · ×0.1`, `85.95 → 29.702`, `12.86 → 4.500`, `1001`, `0 / 30,000`, `20 / 20 recovered`, `29.390 … 29.821`, `4.174 … 4.842`, `title 30.0138 · slop 3.9671`, loss values (the seven above), `9,120 / 10,000`, `first divergence: frame 135`.

---

## Chapter 3 — Exact, Within Limits

**Thesis:** Each result has a scope: exact for the hand-set circuit, recovered for six trained cells that were handed the oracle's state; cost is linear in press records; what remains open is named.

**Visual machine: the scorecard ledger.** A ledger of stamped rows that fills one at a time, each row showing the claim, its scope chip (what was run) and a stamp (green `holds`, amber `narrowed`, grey `open`, struck-through `stale`). Beside it, a bar chart of operation count per number of press records (K = 1, 2, 4, 8, 16) that grows bar by bar. The persistent object is the closed-loop strip: a long frame tape (10,000 frames per seed × 12 seeds) that is first laid out, then reused as the "30,000" trained strip, then dimmed.

**Beat sheet**
1. (cap 1) The tape of frames; a loop arrow from the circuit's output state back into its next-frame input (closed loop), and an oracle comparator under every frame. Row 1 header opens: `hand-authored parameters`.
2. (cap 2) 12 stacked strips (seeds 1–12), each 10,000 frames, filling green left to right. Counter `120,000 frames · 0 divergences`. Chip `exact equality (===)`, `integer coordinates`.
3. (cap 3) A 4×4 grid of relation settings lights up cell by cell (2,000 frames each, `32,000 frames`). Then a staircase of 200 drags: left after each release, alternating +7 and −6, climbing to 500. Row stamp `holds`.
4. (cap 4) A shorter strip (3 × 10,000) is drawn beneath, labelled `trained circuits · 30,000 frames each`; a second chip `committed test: ≥ 5 of 6 starts`. The 120,000 stamp is moved above and labelled `hand-set`. The two strips are drawn to the same scale, so the length difference shows.
5. (cap 5) Bars appear for K = 1 … 16 with heights 480, 516, 588, 732, 1020; slope annotated `+36 ops per press record`; a depth strip of `52` repeated under every bar.
6. (cap 6) Camera pushes on the K = 1 bar. A struck-out chip `README: 502 ops · depth 38` slides in; a green chip `measure-cost.ts at 4ea7fcb: 480 ops · depth 52` replaces it. Tag `live build`.
7. (cap 7) The press-record stack from ch1 is drawn as a shift-register: the newest record feeds behavior (lit), older records sit grey with a `not read` tag. The `+36` is highlighted on the grey ones.
8. (cap 8) The six trained cells re-appear (from ch2) in a bright box. Around them, the dimmed latch bank is padlocked and labelled `authored`. An arrow marked `oracle state + decision labels` enters the training box. Chip: `recovers parameter cells, not structure`.
9. (cap 9) Ledger row: the status quote scrolls in: `Training supplies correct internal state and decision labels. Persistent state and temporal dependencies remain.` An amber `narrowed` stamp on the training row; a green `holds` stamp on the hand-authored row.
10. (cap 10) A small history strip: a moves tape where five consecutive moves are collapsed to one (old behavior) shown dim and struck; the new tape keeps all five. Chip `fixed · pointer-input.test.ts`. Grey `historical` stamp.
11. (cap 11) Four grey open cards slide in: `double-click` and `flick velocity` (arrows from the archive), `training on rollouts`, `fractional + batched inputs`, `discovering the latches`; each carries `not built`.
12. (cap 12) Everything dims to ≤ 0.15. A three-step recap line draws left to right under a quiet frame: `latches written on events` → `one ramp, narrowed` → `exact on the traces tested`. Final line: `the memory is real · learning the memory is not shown`. Nothing under the text.

**Captions**
1. Now the scorecard… closed loop… oracle checked after every frame. `[harness.ts:21-112 runClosedLoop; exactness.test.ts:13-25]`
2. Twelve seeds of ten thousand frames… `[exactness.test.ts:14 "seed <= 12"; README.md:44-50; README.md:39-40 integer coordinates, === compare]`
3. All sixteen settings… two hundred drags… a hundred pixels right. `[exactness.test.ts:50-73 (16 settings × 2,000 frames); boundary-probe.test.ts:91-120, :119 (rectangle.initialLeft + dragCount / 2); +7/−6 alternation per research fact 19]`
4. The trained circuits were checked on thirty thousand frames… `[training-sweep.ts:23,36; training.test.ts:47-77, :76 "toBeGreaterThanOrEqual(5)"]`
5. Now cost… four hundred eighty… thirty-six… fifty-two. `[measure-cost.ts live output: 1 | 55 | 480 | … | 52; K = 2 → 516; window-depth.test.ts:94-115 (linear in K; the +36 value is from the live output, not pinned by the test)]`
6. The README's own table says five hundred two… `[README.md:31,116 ("502 ops, depth 38"); measure-cost.ts live output 480 / 52; research "Contradictions" 1]`
7. Those extra records form an archive… behavior never reads it… `[circuit.ts:425-452 archive shift register; circuit.ts:425-429 "behavior never reads it"; README.md:133]  (the last clause is an inference: "which means…")`
8. So what did training learn?… cells, not structure. `[train.ts:80 writeOracleStateToSource; circuit.ts:590-597; README.md "Training recovers parameter cells, not structure."; README.md:132 (which latches exist is authored); reassessment-2026-09-03.md:107]`
9. The status file puts it plainly… `[lab/status.md:200 (verbatim: "Training supplies correct internal state and decision labels. Persistent state and temporal dependencies remain.")]`
10. An earlier review found a demo bug… fixed… `[reassessment-2026-09-03.md:86-88; demo.ts:407-408 getCoalescedEvents; pointer-input.ts:5-13; pointer-input.test.ts:7-32]`
11. Still open: double-click (reads the archive), flick (needs a move archive)… `[README.md:137-140 (double-click, flick velocity, rollouts, fractional and batched inputs); README.md:130,132 (batched untested; structure authored)]`
12. So: a few latches… one ramp that narrows to recover six parameters… `[recap of ch1 circuit.ts:266-302; ch2 train.ts:152-157, training-sweep.ts; ch3 exactness.test.ts:13-25]`

**On-screen labels (exact):** `120,000 frames · 12 seeds × 10,000 · 0 divergences · hand-authored`, `16 relation settings × 2,000 frames`, `200 sequential drags: left 400 → 500`, `trained: 3 × 10,000 = 30,000 frames each · 20 / 20`, `committed test: ≥ 5 of 6 starts`, K bars `480 · 516 · 588 · 732 · 1020`, `+36 ops per press record`, `depth 52 at every K`, `+72 stored weights per record` (small), `README: 502 · depth 38 (stale)`, `measure-cost.ts: 480 · depth 52`, `archive · not read by behavior`, `oracle state + decision labels`, `lab/status.md:200` quote, `holds`, `narrowed`, `historical`, `open`.

---

## Claim → source (for sources.json)
Repo: `chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46`, paths under `lab/event-window/` (README.md, oracle.ts, circuit.ts, train.ts, harness.ts, trace.ts, boundary-probe.test.ts, exactness.test.ts, training.test.ts, window-depth.test.ts, pointer-input.ts, pointer-input.test.ts, training-sweep.ts, measure-cost.ts) plus `lab/status.md` and `lab/reassessment-2026-09-03.md`. Every caption above carries its pointer. Verbatim quotes available:
- `lab/status.md:200` "Training supplies correct internal state and decision labels. Persistent state and temporal dependencies remain."
- `oracle.ts:169` `if (distance > config.slop) state.slopExceeded = true`
- `oracle.ts:151` `state.pressOnTitle = input.y - seen.top < config.titleHeight`
- `circuit.ts:599-608` `slopBoundary: config.slop + 0.5,` / `titleBoundary: config.titleHeight - 0.5,`
- `train.ts:152-157` the four `{untilProgress, sharpness, learningRateScale}` phases
- `training.test.ts:44` `expect(cost.boolean).toBe(0)`; `training.test.ts:76` `expect(recovered).toBeGreaterThanOrEqual(5)`
- `pointer-input.ts:9` "Returning to the press point must not erase an earlier drag-threshold crossing."
- `boundary-probe.test.ts:69` `for (const suffixLength of [1, 4, 16, 64, 256]) {`
- Measured (not in the README): `measure-cost.ts` row `1 | 55 | 480 | 230 | 244 | 6 | 52 | 52 | 883 | 85`; `training-sweep.ts` "recovered 20/20 seeds"; the scratch fixed-ramp check (30.0138, 3.9671, 9120/10000, first at 135, loss grid). The fixed-ramp numbers match README:69-71.

**Do not claim:** the unverified reviewer claim "320,000 verification frames" (reassessment:105); README:172 "all 4 seeds" integer-bit result; the README's 30.33 estimate; the +60 weights per record; 502 ops / depth 38 / 496 soft ops as current; that the demo loads trained parameters (it does not).
