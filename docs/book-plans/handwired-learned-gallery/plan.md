# Learned Gallery (`handwired-learned-gallery`)

- **Title:** Learned Gallery
- **Subtitle:** A 244-weight network that lays photos out on your sketch and lines them up with a penalty, not a snap.
- **Animal / accent:** magpie, `#4f7cc8`
- **Pin:** chenglou/handwired @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, `lab/learned-gallery` (README only; code in `src/learned-gallery/`, tests in `tests/learned-gallery/`).
- **Status said plainly:** current demo, October 13-14, 2026. It holds on the cases measured (alignment 1.1% stuck edits at the shipped setting). Open: edges on no line can rest off target; no held-out test (`lab/status.md:203`). The lab README describes the page "as it was on October 14, 2026" and its measurement scripts are not in the repo, so every measured number is dated and unrerunnable here. Forty-one tests pass (`bun test ./tests/learned-gallery`, 33 s here).
- **Throughline noun:** the **photo layout** (twelve photos, one rectangle each). Every chapter returns to the same stage, 5 wide by 4 tall, with Story's ghost rectangles.
- **Series note:** re-define relu in one clause (ch1 cap 2) and "gated unit" (ch1 cap 5). One-hot, argmax and "circuit" are not needed; the caption text says "program". Do not re-teach ramps, steps or loops.
- **Pointer conventions:** `TG` = `src/learned-gallery/trainable-geometry.ts`, `LG` = `src/learned-gallery/learned-gallery.ts`, `LAB` = `lab/learned-gallery/README.md`, `SRC` = `src/learned-gallery/README.md`.
- **px scope rule:** every pixel figure is on the 538 x 430 px stage unless the label says 620 x 496 (LAB:13). Say the stage on screen next to every px number.
- **Do not show/say:** "springs", "snap" (as a mechanism of the final design), "production", "1,004 steps a second" as a frame rate, the unsourced status.md numbers (0.20%, 2.8% drags, 11-15 px).

---

## Chapter 1: Photos from a sketch

**Thesis:** A fixed program of 244 weights turns twenty slot positions into rectangles, and Adam steps slide the photos onto the sketch.

**Visual machine:** *The slot-to-rectangle pipeline, running.* Left: a horizontal slot axis from -1 to +1 with 20 ticks, a travelling highlighted slot. Middle: its ten features as ten small bars (constant, position, four sin/cos pairs), then two columns of six gated-unit nodes, then four output bars (left, top, width, height). Right: the 5:4 stage with Story's ten ghost rectangles (dashed) and twelve photo rectangles. A loss curve sits under the stage. The same slot's rectangle is traced from axis to stage. Then the pile of photos slides onto the ghosts as training runs.

**Beat sheet**
1. (cap 1) Stage fades in with Story's ghost sketch (10 dashed rectangles). The photo rectangles are not yet shown. Camera on the stage.
2. (cap 2) Camera pulls to a wide shot: pipeline outline appears over the stage; a tiny relu ramp glyph stamps beside the title "weighted sums + relu" (recap only).
3. (cap 3) The slot axis draws: 20 ticks, 12 coloured (photo slots), 8 grey. A marker scans slot 0 to 19 and rests on slot 7.
4. (cap 4) For slot 7 the ten feature bars grow (1, position, sin and cos at k = 1..4), labelled by name; camera pushes to the features.
5. (cap 5) Two columns of six gated units. One unit zooms: sum A times relu(sum B) as a ramp meeting a line; the unit's output bar appears. Second column fires.
6. (cap 6) Four output bars land (left, top, width, height) and draw a rectangle on the stage. Marker steps through all slots; twenty rectangles fan out to the stage.
7. (caps 7, 8) A weight counter ticks 132 + 84 + 28 = 244 over the layer blocks (heights proportional), then a stacked 6,320 operations bar with 8 depth ticks.
8. (cap 9) Seeded weights: all photos piled in one clump near the centre. Loss curve starts high; step counter runs; photos begin sliding.
9. (cap 10) Zoom to one pair: a photo edge vs its ghost edge; the Huber error curve (quadratic then straight) with the edge's error as a dot; matching lines draw from each ghost to its closest photo.
10. (cap 11) Three presets as race bars: Story 679, Cinema 1,389, Contact sheet 879 steps, with 1.1, 2.3, 1.5 s labels; whiskers show the 24-press ranges.
11. (cap 12) A ghost rectangle is dragged; the photo follows continuously without reset. A Retrain button press flashes and the photos return to the pile.

**Captions** (verbatim as spoken; source pointers are plan-only)
1. "You sketch ten rectangles on a stage, and ten photos should land in them. Here a small fixed program draws the layout, and training adjusts its weights until the photos fit." [LAB:9, SRC:7; Story has 10 rectangles]
2. "This is the learned gallery from Handwired. Its author wanted the layout learned, not coded, so it comes out of weighted sums and relu, which keeps positive numbers and zeroes the rest." [LAB:13 (Cheng: "the spirit of the gallery is to learn something"); SRC:3]
3. "The program has twenty output slots, and the page uses up to twelve of them, one per photo. A slot is only a position along a line, from minus one to plus one." [LG:15, LG:17; TG:207-225; SRC:3]
4. "Each position becomes ten fixed features: a constant, the position itself, and a sine and a cosine at each of four frequencies. They're computed once, when the program is built." [TG:207-225 `position = item/(slotCount-1)*2-1`, features `[1, position]` + sin/cos(pi k position), k=1..4]
5. "Two layers follow, six gated units each. A gated unit multiplies one weighted sum by the relu of another, so each one is a small branch built from arithmetic." [TG:~233 `circuit.reglu`; TG:187-205 `emitDynamicProjection`; SRC:3 "A ReGLU unit is one weighted sum times the ReLU of another"]
6. "Four weighted sums at the end read the second layer. They give the slot's left edge, top edge, width and height. Twenty slots in, twenty rectangles out." [TG:~270 `parameters.outputWeights`; LAB:9]
7. "Count the weights: a hundred thirty-two in the first layer, eighty-four in the second, twenty-eight at the output. That's two hundred forty-four, and each one is a source cell." [derived 2x(6x10+6)=132, 2x(6x6+6)=84, 4x(6+1)=28; run: parameterCount 244; SRC:3 "Its 244 source cells"]
8. "Unrolled, the whole program is 6,320 operations in eight layers. Its shape never changes. Only those two hundred forty-four numbers move." [run: operations.length 6320, depths max 8; LAB:9; status.md:102 "The network is unchanged"]
9. "From the seeded starting weights, the photos sit in a pile. Training takes steps with a method called Adam, nudging every weight to shrink the gap between photo edges and sketch edges." [TG:471 seed 0x51_7a_9e; TG:703-768 `trainStep`; LAB:20 "The seeded weights put the photos in a pile"]
10. "Each sketch rectangle is paired with a photo by cheapest total matching, then scored edge by edge. Big misses count linearly, so one far-off edge can't dominate." [TG:575 `matchRectangles`, TG:379 `minimumCostAssignment`, TG:451-456 `robustLoss`, TG:82 threshold 0.08. The README does not mention the assignment; it is in the code]
11. "Pick a preset and the first fit stops after 679 steps for Story, 1,389 for Cinema and 879 for Contact sheet, in one run. That's about one, two and one and a half seconds." [LAB:39 table row; scope: one run, ranges 630-750 / 1,360-1,840 / 860-980 over 24 presses; other runs 579-1,932; LG:271 600 steps/s]
12. "Edit the sketch afterward and training continues from the current weights, so a photo follows its rectangle. A preset or the Retrain button starts over from the seeded weights." [LAB:9 "An edit continues training from the current weights"; SRC:7]

**On-screen labels:** `slotCount = 20`, `photoCount = 12`, `position = item/(slotCount-1)*2-1`, `[1, position, sin(πk·position), cos(πk·position)]`, `k = 1..4`; "10 features"; "layer 1: 6 ReGLU units", "layer 2: 6 ReGLU units"; outputs `left, top, width, height`; "132 + 84 + 28 = 244"; "6,320 operations (4,080 reglu, 2,240 affine) · 8 layers"; seed `0x51_7a_9e`; `learningRate 0.008`; `geometryLossThreshold 0.08`; `matching: 'assignment'`; "Story 10 · Cinema 9 · Contact sheet 11 rectangles"; stage "5 x 4"; "679 / 1,389 / 879 steps (one run)".

---

## Chapter 2: Lining up without snapping

**Thesis:** The photos line up because training lowers a penalty on near-aligned edges, with multipliers closing the last sliver, and no code moves a rectangle onto a line.

**Visual machine:** *A row of four photos' tops on a zoomed ruler, over a live pull curve.* Top panel: four photo tops as short bars at slightly different heights, with the gap between a chosen pair drawn as a bracket. Bottom panel: the plot of `pairPull(gap, m, reach)` against gap from -reach to +reach, a dot riding it at the pair's current gap. A multiplier gauge for the pair fills as steps tick. Right: a "Misalignment penalty" slider 0..8, value 4.

**Beat sheet**
1. (cap 1) A row of four ghost rectangles with tops a few px apart; a ruler line highlights the crooked tops. Quote card: "a bigger penalty or adjustable one for learned gallery for grid being unaligned".
2. (cap 2) A code box labelled `alignRectangles` sweeps the sketch and the tops jump to one line; the box then greys and gets a "tried, not kept" stamp; Cheng's quote card: "Snapping to some alignemtn is just a simple thought."
3. (cap 3) The loss bar splits into two halves: "distance from the sketch" and "misalignment penalty". The sketch drops out of the penalty half (a dashed link to the sketch is cut).
4. (cap 4) Two tops (A, B) highlighted; gap g = A - B bracket; a charge area fills as the gap grows.
5. (cap 5) The pull curve draws: slope 5·gap near zero, rising to its peak, falling to 0 at one reach. Real values: with reach 0.02, pull(0.005) = 0.015, pull(0.01) = 0.01, pull(0.02) = 0. The dot slides along; a dashed label "5 x gap" then "reach - gap".
6. (cap 6) The slider appears; moving it 0 to 8 stretches the plot's reach marker. At 4 the reach is 2% = "10.8 px on 538 px". The ruler shows the reach.
7. (cap 7) Four tops on one line with a count chip "4 edges on the line"; a row of two shows "2". Both pull equally hard on a photo (equal bars).
8. (caps 8, 9) Multiplier gauge for pair AB fills at 0.1·gap per step; the dot's gap closes to zero. Chip "multipliers are not in the displayed loss". Then a replay of the pile: penalty lamp off ("every edge is within reach of every other"), switches on near the sketch, ramps 0 to 2 over 200 steps.
9. (cap 10) Two bars compared: "Penalty (Oct 14)" 0.01 median / 0.16 largest versus "Straightening (Oct 13)" 0.04 / 0.52, px apart, 372 edits of 5 and 11 px, slider 4%, stage 538 px.
10. (cap 11) Row of four; one rectangle drags 12 px down; its photo ends 9 px above it, the others end 3 px down. Arrows measured.
11. (cap 12) Two-lane hysteresis: a rectangle dragged 14 px out of the row; photo stays in the row. Slider toggles off then on (the pull curve flattens, returns); photo sits on its rectangle. Labels "joins at half the distance it leaves".

**Captions**
1. "Hand-drawn sketches are crooked, so a row of photos has tops a few pixels apart. Cheng asked for a bigger or adjustable penalty for a grid that was unaligned." [LAB:13 (request quote: "a bigger penalty or adjustable one for learned gallery for grid being unaligned")]
2. "The first answer was ordinary code that straightened the sketch before training. Cheng's verdict: snapping to alignment is just a simple thought, and the gallery should learn something." [LAB:13 (Oct 13 `alignRectangles`; "the spirit of the gallery is to learn something. Snapping to some alignemtn is just a simple thought."); LAB:60 "ordinary code decided where every line is, and training only copied the result"]
3. "So since October fourteenth nothing straightens the sketch. The loss gets a second part, a misalignment penalty, and photos line up only because training lowers it." [LAB:13 "Since October 14 nothing straightens the sketch"; SRC:12 "No code moves a rectangle or a photo onto a line"]
4. "The penalty never reads the sketch, only the photos. For every two photo edges of one kind, say two tops, it charges for the gap between them." [LAB:15 "reads only the photos and never the sketch"; TG:148-156 `pairCost`]
5. "The pull on a pair is five times the gap, capped at the reach minus the gap. So it's strongest between nearly aligned edges, and gone once the gap reaches one reach." [TG:90 `penaltyStiffness = 5`; TG:138-141 `pairPull`; LAB:15; run: pairPull(0.01,0,0.02)=0.01, (0.005)=0.015, (0.02)=0]
6. "Reach is half the slider's number. The slider runs from off to eight percent of the stage width and starts at four, so reach is two percent: about eleven pixels on a stage 538 pixels wide." [LG:436, LG:657; assets/learned-gallery.html:68 `max="8" step="0.5" value="4"`; LG:243; SRC:11 "4% ... is 21.5 px, and the penalty's reach is 10.8 px"]
7. "A pair's charge is divided by how many edges share the line, so a row of four holds a photo no harder than a row of two. Ordinary code counts those lines at the start of each frame." [TG:603-607 `lineCount`; TG:613 `startFrame`; LAB:15]
8. "A pull alone stalls with a sliver of gap left. So ordinary code keeps one extra number per pair, a multiplier, and grows it by a tenth of the gap each step until the gap closes." [TG:646 (0.02 x steps x 5 x gap = 0.1 per step); LAB:16 "grows it by a tenth of the pair's gap per training step"; method of multipliers]
9. "The multipliers aren't part of the loss the page shows. And the penalty waits, because the seeded pile has every edge within reach of every other. It switches on near the sketch, then ramps up over two hundred steps." [LAB:16 "The multipliers aren't part of the loss"; LAB:20 pile; TG:114 `penaltyOnsetDistance = 1e-6`, TG:115 `penaltyOnsetSteps = 1000`, TG:116 `penaltyRiseSteps = 200`; presets 150-180 steps, LAB:20; strength 0 to 2, TG:100]
10. "After 372 small edits at four percent, a line of photos ends one hundredth of a pixel apart at the median and sixteen hundredths at worst. Straightening gave four hundredths and fifty-two hundredths." [LAB table row 1 ("median and largest"; "0.04, 0.52 px" vs "0.01, 0.16 px"); stage 538 px, LAB:13; scope: 372 single edits of 5 and 11 px]
11. "Photos meet in the middle. Drag one rectangle of a row of four twelve pixels down, and its photo stays in the row, nine pixels above the rectangle, while the other three move three pixels down." [LAB:19 "Photos meet in the middle ... 9 px above its rectangle, and the row's other photos move 3 px down"]
12. "A photo joins a line at half the distance at which it leaves one. A rectangle dragged fourteen pixels out of its row keeps its photo there, yet with the slider off and back on, the photo sits on its rectangle." [LAB:18 (hysteresis, same quote); test `a photo joins a line at half the distance at which it lets go of one`, tests/learned-gallery/learned-gallery.test.ts:1016]

**On-screen labels:** `penaltyStiffness = 5`, `penaltyStrength = 2`, `pairPull(gap, m, reach) = clamp(m + 5·gap, ±max(0, reach − |gap|))`, `pairCost` (integral of the pull), `lineCount`, `lineGap = 1/8 reach`, `penaltyOnsetDistance = 1e-6`, `penaltyOnsetSteps = 1000`, `penaltyRiseSteps = 200`, multiplier update `m ← clamp(m + 0.02·steps·5·gap, ±(reach − |gap|))`, slider "Misalignment penalty 0 – 8%, default 4%", reach = slider / 2 = 2%, "10.8 px on 538 px", `alignRectangles` (Oct 13, dropped), the Cheng quotes, the table figures "0.01 / 0.16 px" vs "0.04 / 0.52 px", "joins at half the distance it leaves". (Keep the 538 px basis; do not mix in the 24.8 px / 620 px figures.)

---

## Chapter 3: Taking steps back

**Thesis:** Every frame of training is a bet that gets rolled back when it raises the function it follows, and the loop watches photos, not the loss, to decide it is done.

**Visual machine:** *A frame belt with a learning-rate ladder.* A horizontal belt of frames, each frame a short block of step ticks. Kept frames glide forward in the accent colour; undone frames flash red and slide back on the belt, rewinding a weight strip underneath and dropping a rung on the vertical learning-rate ladder (1, 1/2, ... 1/64, then 1/128 ... 1/4096). A frame-budget row of four capped bars sits at the top (cap 20, time budget, owed time, "2 or none").

**Beat sheet**
1. (cap 1) A fixed-rate Adam trace: loss low but a photo jitters; six small drags and a photo jumps 14 px (stage 538 px) on a ghost timeline labelled "before Oct 13".
2. (cap 2) The belt appears with ticks at 600 steps a second. A 60 Hz row shows 10 steps a frame, a 120 Hz row shows 5. The four budget bars show the cap 20 and 6 ms limits.
3. (cap 3) One frame zooms: "f before" and "f after" gauges for the same function; padlocks on multipliers, line counts, penalty weight.
4. (cap 4) After rises: the frame blocks slide back; the weight strip and both moment strips rewind; the ladder drops one rung (1 to 1/2 ... to 1/64).
5. (cap 5) After falls: the frame glides forward; ladder climbs x1.15 per frame; a counter 1/64 to 1 reaches "about 30 kept frames" (computed 29.75).
6. (cap 6) Ladder below 1/64: five red frames in a row at 1/64, the ladder extends to 1/4096; kept frames double. Companion: a new rectangle appears 30 px from a stalled photo; it starts moving again.
7. (caps 7, 8) The "2 or none" rule: a one-step frame is undone and the next one-step frame repeats the same step uphill (momentum arrow). The belt freezes. Side-by-side fits at 5 ms/step: one-step frames 529 steps, 0.47 px; two-step frames 874 steps, 0.03 px (stage 500 px).
8. (cap 9) A time bar: 6 ms budget versus 10 ms for two steps at 5 ms each ("up to twice").
9. (cap 10) Loss curve flattens at about 1e-5 while a photo hangs 9 px from its rectangle: no "done" value.
10. (cap 11) A rest meter: each photo edge's movement over a 100-step window against the 0.01% threshold; at least 500 steps, at most 2,000.
11. (cap 12) A heat belt of 300 frames after Story's first fit: 238 red, with a run of 171 identical frames highlighted.

**Captions**
1. "Adam at a fixed rate doesn't come to rest once the loss is low. Its steps keep their size while gradients shrink, and before October thirteenth six small drags made photos jump up to fourteen pixels." [LAB:22 (`The training loop`); SRC:19]
2. "Training runs at six hundred steps a second at any frame rate: ten steps a frame at sixty frames a second, five at a hundred twenty. A frame trains at most twenty, and no more than fit in six milliseconds." [LG:271 `msPerTrainingStep = 1000/600`; LG:696-701; LAB:9; run constants maximumTrainingStepsPerFrame 20, trainingMsPerFrame 6]
3. "Each frame is a bet. The program measures one function before the frame's steps and after them, with the multipliers, line counts and penalty weight frozen for that frame." [TG:864-900 `trainOrUndo`; TG:667 `measure`; LAB:22]
4. "If the function went up, the frame is taken back. The weights and both of Adam's running averages are restored, and the learning rate halves, down to a sixty-fourth." [TG:877-881 restore; TG:883 halve; TG:742-743 beta1 0.9 beta2 0.999]
5. "If it went down, the frame is kept and the rate grows by fifteen percent, or doubles below a sixty-fourth. Climbing from a sixty-fourth back to full takes about thirty kept frames." [TG:887; derived ln(64)/ln(1.15) = 29.75, which matches the code comment above `trainOrUndo`]
6. "At the floor there's a trap. After five frames in a row are taken back at the low rate, it keeps halving, to one four-thousand-ninety-sixth, and kept frames double it. Otherwise a photo could stall thirty pixels off." [TG:882-888; LAB:22 "stand still 30 px away" (paraphrased: "can stand still")]
7. "A frame trains two steps or more, or none. After an undone one-step frame, the restored momentum can make the same step uphill at any rate, and every frame gets taken back while the photos freeze." [LAB:23 "A frame trains 2 steps or more, or none"; LG:704]
8. "On a device taking five milliseconds a step, one-step frames stopped Contact sheet's first fit at 529 steps, with a line nearly half a pixel apart. Two-step frames reached 874 steps and three hundredths of a pixel." [LAB:23 ("stopped after 529 steps with a line of photos 0.47 px apart on a stage of 500 px ... With frames of two steps it is 874 steps and 0.03 px"); scope: a device at 5 ms a step, stage 500 px]
9. "The price is time. Where a step takes over three milliseconds, a frame's training can take up to twice the six millisecond budget, and the lab accepts that." [LAB:23 "The price: where a step takes over 3 ms, a frame's training takes up to twice the 6 ms, e.g. 10 ms at 5 ms a step"]
10. "Stopping is trickier than it sounds. With the penalty on, the loss has no value that means done. It rests where its two parts balance, say at one hundred-thousandth, with a photo held nine pixels from its rectangle." [LAB:24 "it rests where its two parts balance, e.g. at 1e-5 with a photo held 9 px from its rectangle"]
11. "So the page watches the photos. A change gets at least 500 more steps, and training stops once no edge has moved more than a hundredth of a percent of the stage in 100 steps, or after 2,000." [LG:247, LG:255, LG:257-259 `restDistance = 0.0001`, `restSteps = 100`; LAB:24]
12. "Once photos rest, most frames are taken back: 238 of the 300 after Story's first fit. Many redo the same ten steps from identical weights, up to 171 in a row, until the multipliers change." [LAB:56 open-limit paragraph "238 of the 300 frames", "203 of the 300 start from the same weights ... up to 171 in a row"; the slider-off comparison (34 of 300) is optional on screen]

**On-screen labels:** `trainOrUndo`, "followed function = loss with the multipliers in the pulls (not the loss the page shows)", Adam `β1 0.9 · β2 0.999 · ε 1e-8`, `weightDecay 0.000_000_2`, gradient-norm cap `min(1, 1/‖g‖)`, weights clamped to ±6 (both from code only, TG:753, TG:767; optional), rate ladder `1 → 1/2 → … → 1/64 → … → 1/4096`, "×1.15 per kept frame", "5 frames in a row at ≤ 1/64", "600 steps/s · 10 @ 60 Hz · 5 @ 120 Hz", `maximumTrainingStepsPerFrame = 20`, `trainingMsPerFrame = 6`, "2 or none", `restDistance = 0.0001`, `restSteps = 100`, "500 – 2,000 steps after a change", "529 steps · 0.47 px (1 step/frame)" vs "874 steps · 0.03 px (2 steps/frame)", "238 of 300 frames taken back".

---

## Chapter 4: What held, what didn't

**Thesis:** The kept penalty form took stuck edits from 78% in the plainest version to about 1% in the shipped one; edges on no line and generalisation remain open.

**Visual machine:** *A ledger of experiments as a horizontal bar race, then a scatter of 200 Story variants.* Left: four bars (78, 47, 21, 1.8%) labelled by form, each filling as its caption speaks; the kept form glows. Middle: a before/after pair of tiles for straightening versus penalty. Right: a 200-dot field of Story variants; most dots in the "within 0.15 px" band, 26 ringed ("all 2,000 steps"), 12 dots displaced and linked to a stage with an edge 2-4 px off its ghost. Final: a status board with two rows (OPEN: edges on no line; OPEN: no held-out test) and a recap strip tracing the book.

**Beat sheet**
1. (cap 1) The probe grid: 24 sessions x 40 small edits; a pair of edges 0.5 to 8 px apart is highlighted as "stuck".
2. (cap 2) Bars fill: 78% (fixed pull, rounded near 0, no multipliers), 47% (rounded less), 21% (multipliers with limit full for the first 2 px).
3. (cap 3) The 1.8% bar fills and glows: "limit falls from a gap of 0". Footnote chip "probe reach 8 px on 538 px = 1.5%; shipped reach 2%".
4. (cap 4) The 1.1% result bar with batch whiskers 0.7 to 1.4%, next to straightening 2.5% / 2.7%.
5. (cap 5) Mixed-edit tiles: "8 sessions of 200: 0 of 1,600", "reviewer: 5 of 1,600", "reviewer 0.5% of 1,920 mixed edits". A "rare, not zero" tick.
6. (cap 6) The 200-dot field resolves: all within 0.15 px; 26 dots ringed.
7. (cap 7) A 22 px drag on a row: photo leaves every line (151 of 180); histogram median 0.12 px, max 2.3 px from the rectangle, 11 of 151 over 1 px.
8. (cap 8) Twelve dots drift out of the band; a stage inset shows an edge 2 to 4 px off its ghost; five dots ringed for "after all 2,000 steps". Shared-weights web linking edges to the 244 cells.
9. (cap 9) Story's one edge: two arrows at the weights (its own error gradient 6.7e-5 vs total 2.3e-6, "29 times as much") pulling opposite ways; resting at 0.6 px.
10. (cap 10) Status card: "Status: current; limit open." Chips: "41 tests pass", "scripts not in repo", "numbers dated Oct 14, 2026".
11. (cap 11) Card: "No held-out test" with the line from `lab/status.md:203`. One sketch is shown, fitted; an unseen-sketch panel stays blank with a question mark.
12. (cap 12) Quiet-stage recap strip (stage faded to ≤ 0.15 opacity): four tiles in order (slots to 244 weights to rectangles; penalty with multipliers; undoable frames; open limits), each lighting as the line mentions it.

**Captions**
1. "How was the penalty chosen? A probe compared four forms over 24 sessions of 40 small edits, counting edits that end with two photo edges stuck between half a pixel and eight pixels apart." [LAB:61 "Plain forms of the penalty" (probe, Oct 14; 24 sessions of 40 small edits; 0.5-8 px)]
2. "A fixed pull without multipliers left seventy-eight percent of edits stuck. Rounded less, forty-seven. Multipliers with a limit that stays full for two pixels, twenty-one percent." [LAB:61: "78%", "47%", "Multipliers with a limit that stays full for the first 2 px of a gap, 21%"]
3. "Multipliers with a limit that falls from a gap of zero, the form that was kept, got it to one point eight percent. That probe used a reach of about one and a half percent, a little under the shipped two." [LAB:61 "1.8%"; TG:~92-98 comment "a reach of 8 px on a stage of 538 by 430 px" (= 1.5%); shipped reach 2% (LG:436, reach = slider/2)]
4. "At the shipped setting, 96 sessions of 40 small edits ended stuck one point one percent of the time, between 0.7 and 1.4 by batch, against about two and a half percent for straightening." [LAB table row "96 sessions of 40 small edits": penalty "1.1%, and 0.7% to 1.4% by batch of 24"; straightening "2.5% and 2.7%"]
5. "In 8 sessions of 200 random edits the lab saw none in 1,600. A reviewer's own generator saw five in 1,600, and half a percent of 1,920 mixed edits. So read it as rare, not zero." [LAB table "8 sessions of 200 random edits: none of 1,600"; LAB:45 reviewer paragraph "after 5 of 1,600 edits", "0.5% of 1,920 mixed edits in 48 sessions"]
6. "Fitting 200 variants of Story's proportions, every line ended within fifteen hundredths of a pixel when training stopped. Twenty-six variants used all 2,000 steps to get there." [LAB table "200 variants of Story's proportions": "200 when training stops, the widest line at 0.15 px. 26 train all 2,000 steps" (straightening: 131 within 0.25 px after 500 steps)]
7. "Edits of 22 pixels pulled a photo off every line in 151 of 180 cases. Those photos ended a median twelve hundredths of a pixel from their rectangles, and 2.3 pixels at worst." [LAB table rows for 180 edits of 22 px: "151", "0.12, 2.3 px, with 11 of the 151 over 1 px" (median and largest by the row's label)]
8. "The open problem is an edge on no line. Twelve of those 200 variants end with one two to four pixels off, five after all 2,000 steps. Edges share 244 weights, and rest where all the slopes balance." [LAB:49 "12 end with such an edge 2 to 4 px off, 5 of them after all 2,000 steps"; LAB:51-54]
9. "Story shows it: one edge rests six tenths of a pixel from where it's drawn. Its own error pulls 29 times harder than the total gradient, but the other edges pull the shared weights the other way." [LAB:53 "Story's own edge ... 0.6 px"; traced "6.7e-5 long, 29 times as much" vs total 2.3e-6]
10. "Status: current, with that limit open. Forty-one tests pass, but the scripts behind the measurements aren't in the repo, and the numbers describe the page as it was on October fourteenth." [run: `bun test ./tests/learned-gallery` 41 pass, 0 fail; LAB:1 "The measurements were made with scratch scripts that aren't in the repo"; LAB:1 "describes the page as it was on October 14, 2026"]
11. "And there's no held-out test. The network is fitted to one sketch at a time, so the lab shows how well it fits a sketch, not how it handles one it never saw." [lab/status.md:203 "No held-out test: the network is fitted to one sketch at a time."; second clause is an inference from that line]
12. "To recap: twenty slots feed 244 weights that output rectangles, a penalty with multipliers lines them up, and undoable frames keep them still. Alignment is learned and mostly holds; off-line edges remain open." [recap of chapters 1-3 and LAB:48-56; status.md:203]

**On-screen labels:** "probe: 24 sessions x 40 small edits · stuck = two edges 0.5–8 px apart", bar labels "fixed pull, no multipliers 78%", "rounded less 47%", "limit full for first 2 px 21%", "limit falls from gap 0 (kept) 1.8%", footnote "probe reach 8 px / 538 px = 1.5% · shipped reach 2%", "96 sessions · penalty 1.1% (0.7–1.4%) · straightening 2.5% / 2.7%", "8 sessions of 200 · 0 of 1,600", "reviewer: 5 of 1,600 · 0.5% of 1,920 (620 px stage)", "200 Story variants · widest line 0.15 px · 26 train all 2,000 steps", "151 of 180 edits (22 px) · 0.12 / 2.3 px", "12 of 200 · edge 2–4 px off · 5 after all 2,000", "Story edge 0.6 px · 6.7e-5 vs 2.3e-6 (29x)", "41 tests pass · scripts not in repo · describes Oct 14, 2026", `lab/status.md:203` "No held-out test: the network is fitted to one sketch at a time." Status chip text: "current · limits open".
(If Opus needs to show the pre-penalty tried-and-dropped items, only the four-form probe is in captions; the straighten-first, charge-later-edge-only (37% / 68%), reach-as-slider and fixed-200-step-wait items are optional on-screen footnotes, each from LAB:60-68.)
