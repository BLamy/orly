# Handwired — Candidate Gallery (plan)

- **Slug:** `handwired-candidate-gallery`
- **Title:** Three Layouts
- **Subtitle:** One program builds every gallery layout at once, and the worst quality gauge picks the winner
- **Animal:** bowerbird (builds an elaborate arrangement, then shows only the best-arranged display)
- **Accent:** `#3fb6a8` (a teal; the sibling books pick their own)
- **Source pin:** chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT, Cheng Lou), `lab/candidate-gallery`
- **Throughline noun:** *the layout* (three at once, one shown).
- **Status of the lab (said plainly in chapter 3):** working demo, moved off the main line; no open or abandoned verdict. "Claims no learning" is an absence in the repo, so the narration says only what the code shows: the scales and formulas are written by hand.
- **Prior knowledge:** relu is re-defined in one clause (ch1 caption 1); one-hot and argmax are defined where used (ch2 captions 6–7); "circuit" is not needed as a word.
- **Arc:** ch1 build every answer → ch2 score and pick → ch3 read the winner, click, honest status, recap. The planted question is the end of ch1 ("how does it pick one?"); it is paid off in ch2 and the last line of ch3 returns to "multiplies the losers by zero".
- **Sound notes:** "relu" is spoken "RAY-loo"; "argmax" is "arg-max"; keep decimals as written (0.87 is spoken "zero point eight seven"). Every number below comes from the research file or from evaluating the lab's own formulas (the scratch probe reproduced all the research scores to 4 digits); those derived numbers are marked "arithmetic from the formulas".
- **Music (if asked):** a slow, low tick-and-clack bed; one motif (three notes, rising) stated in ch1 when the three layouts appear, thinned in ch2, resolved on one held chord at ch3's last caption. Machines clack, never chime.
- **Scene cautions:** keep y ≳ 630 free for the caption pill; stage presets are always one of 1400×680, 984×730, 610×830 (plus the 760/600×517 and 1280×800 callouts in ch2's last beat); the click selection is **not** declared one-hot and is **not** gather-lowered, do not draw it as a gather; thumbnails keep their slot index across layouts, only the rectangle changes; ties pick the left candidate.
- **Verified numbers (scores → winner):**

| stage | Cinema | Contact | Story | winner |
|---|---|---|---|---|
| 1400×680 | 1 | 0.8667 | 0.8400 | Cinema |
| 984×730 | 0.7405 | 0.9361 | 0.9275 | Contact |
| 610×830 | 0.4413 | 0.5625 | 0.9982 | Story |
| 760×517 | 0.5613 | 0.6403 | 0.5548 | Contact |
| 600×517 | 0.4333 | 0.5521 | 0.5548 | Story |
| 1280×800 | 1 | 1 | 1 | Cinema (tie goes left) |

Gauges behind them (arithmetic from the formulas, matching the scores): 1400×680 Contact [width 1.00, height 0.8667], Story [hero w 1.00, hero h 0.8964, thumb w 1.00, thumb h 0.84]; 984×730 Cinema [hero w 0.7405, then 1, 1, 1], Contact [0.9521, 0.9361], Story [1, 0.9623, 1, 0.9275]; 610×830 Cinema [0.4413, 1, 0.8711, 1], Contact [0.5625, 1], Story [1, 0.9982, 1, 1].


---

## Chapter 1: Three Layouts at Once

**Thesis:** With no way to skip work, the program answers "which layout?" by computing every layout and deciding afterwards.

**Blurb:** A Handwired gallery cannot skip work, so it builds Cinema, Contact sheet and Story for twelve photos on every frame.

**Visual machine:** **The layout loom.** Left: a browser-frame stage with a drag handle, labelled `viewportWidth × viewportHeight` (starts 1400 × 680), `gap = 14`. Right of it, three mini-stages are always drawn side by side, each holding the same 12 numbered photo tiles (0–11, one hue per photo so a viewer can follow tile 7 across layouts). Each tile's rectangle is shown as four small readouts (`left top width height`) that are visibly weighted sums of the stage's width, height and gap. The camera pushes in on one Contact cell to show its sum, then pulls back, then the stage handle drags narrow and all 36 rectangles slide together (three layouts × 12 tiles), with relu floors clamping sizes at zero near the end. No layout is "selected" in this chapter; all three are equally bright.

**Beat sheet** (captions carried in brackets):

1. Frame drawn with 12 numbered photo tiles in a pile beside it; question card "which layout fits this stage?". The pile splits into three copies, one per layout slot, labelled by name. A "relu" legend chip (hinge: negatives to 0) appears bottom-left. *(captions 1, 2)*
2. Cinema mini-stage: tiles settle into one big hero plus a 2-column rail (`slot % 2`). Hero outlined in accent. *(captions 3)*
3. Contact mini-stage: tiles settle into a 4 × 3 grid, no hero (`column = item % 4`, `row = floor(item / 4)`). Story mini-stage: hero bar across the top, tiles below in 3 columns (`slot % 3`). All three now stand side by side, same 12 tile hues. *(captions 4)*
4. Camera pushes in on one Contact cell. KaTeX `\text{cellWidth}=\tfrac14\,\mathrm{relu}(W-5g)` assembles from three tokens flying out of the stage readout (W, five gap ticks, a quarter). Gap ticks are drawn as five little 14 px slivers across the stage width. *(captions 5)*
5. Numbers fill in for the 1400 × 680 stage: Contact cell 332.5 × 208 (the width bracket and height bracket light on the stage). Camera pulls back. *(captions 6)*
6. Cinema readouts: rail capped at 280 (a `min(280, 0.28·W)` bar hits its ceiling), hero 1078 × 652. Story readouts: hero height 394.4 (a `min(0.72·W, 0.58·H)` pair of bars, the shorter wins), thumbnails just over 50 tall. *(captions 7)*
7. Stage handle drags from 1400 to ~600 wide and then to a 20 px sliver: all 36 rectangles slide in lockstep; where a sum would go negative a small relu hinge pins it flat at 0 (tiles collapse to dots, never invert or go NaN). *(captions 8)*
8. Closing: the three layouts dim a little, a counter ticks up "417 operations · 60 layers", a question mark rests over the three layouts: which one? *(captions 9, 10)*

**Captions** (spoken verbatim; pointers are plan-only):

1. When a gallery's window resizes, twelve photos need a layout. But a Handwired program is fixed weighted sums and relu, which zeroes negatives. It cannot skip work the way an if statement does.  
   `[README.md:1; lab/candidate-gallery/candidate-gallery.ts:19; lab/status.md:9]`
2. So this lab builds all the answers. On every frame it computes three complete layouts, and only afterwards decides which one to show.  
   `[README.md:1; lab/candidate-gallery/candidate-gallery.ts:324-332]`
3. Cinema is a hero photo with a rail of thumbnails beside it, two columns wide. The hero is the photo in focus.  
   `[README.md:1; lab/candidate-gallery/candidate-gallery.ts:240, 256-266]`
4. The Contact sheet has no hero: twelve equal thumbnails in four columns and three rows. Story lays the hero across the top, with thumbnails below in three columns.  
   `[README.md:1; lab/candidate-gallery/candidate-gallery.ts:176-178, 296]`
5. Positions are sums of the stage's width, its height and a 14 pixel gap, with clamps along the way. A Contact cell's width is the width minus five gaps, divided by four.  
   `[lab/candidate-gallery/candidate-gallery.ts:166-185]`
6. On a 1,400 by 680 stage, that makes a Contact cell 332 and a half pixels wide and 208 tall.  
   `[lab/candidate-gallery/candidate-gallery.ts:166-185; arithmetic from the formulas (research probe)]`
7. Cinema caps its rail at 280 pixels, leaving a hero 1,078 by 652. Story's hero is 394 tall, so its thumbnails get just over 50 pixels of height.  
   `[lab/candidate-gallery/candidate-gallery.ts:211-239, 290-310, 402-414; research candidate-gallery.md C2 case 1 (133 × 97 thumbnails)]`
8. Drag the stage narrower and every number slides along. Where a subtraction would go negative, a relu pins it at zero, so even a 20 pixel sliver gets finite sizes.  
   `[lab/candidate-gallery/candidate-gallery.ts:166-173; candidate-gallery.test.ts:100-122]`
9. Nothing is chosen yet. All three layouts, plus the click and focus logic, are 417 operations in 60 layers, and every frame computes every one.  
   `[lab/ui-exploration/guide/patterns/run-every-candidate.md:52; research probe (60 layers)]`
10. Building every answer is the price of having no branch. The next question is how to pick one.  
   `[README.md:1]`

**On-screen labels:**

- `viewportWidth` 1400, `viewportHeight` 680, `gap` 14
- `photoCount = 12`
- `layoutNames`: Cinema, Contact, Story (`layout.cinema 0`, `contact 1`, `story 2`)
- Contact: `contactInnerWidth = relu(W − 5·gap)`, `contactCellWidth = inner/4`; `contactInnerHeight = relu(H − 4·gap)`, `contactCellHeight = inner/3`; result 332.5 × 208
- Cinema: `cinemaRailMaximum = 280`, rail = `min(280, 0.28·W)`, hero 1078 × 652, thumbnail 133 × 97
- Story: hero height `min(0.72·W, 0.58·H)` = 394.4, hero width 1372, thumbnail 448 × 50.4
- Counter: `417 operations · 60 layers`

---

## Chapter 2: The Worst Gauge Wins

**Thesis:** A layout scores as high as its weakest size, so one bad gauge sinks it; the argmax picks the highest score and ties go left.

**Blurb:** Each layout is scored by its smallest quality gauge, and a tournament of two comparisons lights a single one-hot bit.

**Visual machine:** **The gauge board and the tournament.** Three columns (Cinema 4 gauges, Contact 2, Story 4), each gauge a vertical thermometer filled to `min(1, size × scale)` with a small tick at 1 and its target size printed under it (900, 560, 90, 240, 560, 440, 60). The shortest thermometer in each column glows and a horizontal "waterline" drops to its level; that level becomes the column's score bar on a shared score rail at the right. Below the rail a two-match bracket: Cinema vs Contact, winner vs Story; each match shows its comparison sum landing above or below 0.5 and a bit flipping. The exit of the bracket is a three-slot one-hot column [1,0,0]. A small stage-frame thumbnail in the corner is dragged between three presets (1400×680, 984×730, 610×830) and the whole board re-fills with a clack.

**Beat sheet** (captions carried in brackets):

1. One gauge fills in isolation: Contact cell height 208 × (1/240) = 0.87, tick at 1 unreached; its target (240 px) shown as a ruler. A formula chip `min(1, size × scale)` with scale = reciprocal of target. *(captions 1, 2)*
2. Whole board at 1400 × 680 fills: Cinema four gauges all at 1.00, Contact [1.00, 0.87], Story [1.00, 0.90, 1.00, 0.84] (hero height 394.4/440 = 0.896 is also below 1, but thumbnail height 50.4/60 = 0.84 is the weakest). *(captions 3)*
3. Waterlines drop to each column's shortest thermometer; the algebra shown beside Cinema: min(a, b) = a − relu(a − b), a tiny hinge sliding. Scores land on the rail: 1, 0.87, 0.84. *(captions 4)*
4. Bracket: Cinema vs Contact. Comparison sum `0.4999999·left − 0.4999999·right + 0.5000001` lands above 0.5; a bit flips to "left wins"; Cinema vs Story the same. A ghost "bias = one 32-bit step above ½" label marks the tie rule. The winning path lights and a one-hot column appears [1, 0, 0] with Cinema highlighted. *(captions 5, 6)*
5. Drag to 984 × 730: Cinema hero width 666.5 against target 900 drops its gauge to 0.74 and the waterline sinks; Contact 0.94 and Story 0.93 on the rail; bracket re-runs, Contact lit, one-hot [0, 1, 0]. *(captions 7)*
6. Drag to 610 × 830: Contact cell width 135 against 240 gives 0.5625 while its height gauge is 1.00 (shown full but dimmed, irrelevant); Story's gauges are [1.00, 0.998, 1.00, 1.00]. Bracket picks Story, one-hot [0, 0, 1]. *(captions 8, 9)*
7. Closing: a score-versus-width sweep for height 517: three score curves crossing, the winner switching Contact → Story between 760 and 600; 0.555 vs 0.552 shown at 600; a dim tie marker at 1280 × 800 where all three stand at 1.00 and Cinema wins. *(captions 10)*

**Captions** (spoken verbatim; pointers are plan-only):

1. A layout is good when its pieces are big enough to see. Each size gets a gauge: the size times a scale, one over a target size, capped at 1.  
   `[README.md:1; lab/candidate-gallery/candidate-gallery.ts:150-153, 402-414]`
2. A Contact cell targets 240 pixels. At 1,400 by 680 its width gauge is full, but its 208 pixel height reads 0.87.  
   `[lab/candidate-gallery/candidate-gallery.ts:407; arithmetic from the formulas]`
3. Cinema's four gauges all read 1 there. Story's thumbnails are 50 tall against a target of 60, so its weakest gauge reads 0.84.  
   `[lab/candidate-gallery/candidate-gallery.ts:402-414, 256-322; arithmetic from the formulas]`
4. A layout is only as good as its worst gauge, so its score is the smallest one. A minimum is the smaller number minus a relu of the difference.  
   `[lab/candidate-gallery/candidate-gallery.ts:155-163; src/runtime/numeric-ui-core.ts:1955-1963]`
5. The picker, argmax, compares two scores at a time: Cinema against Contact, then the survivor against Story. A bias one float step above a half sends exact ties left.  
   `[src/runtime/numeric-ui-core.ts:2710-2762; lab/status.md:170]`
6. What leaves the tournament is a one-hot: a 1 for the winner, a 0 for each loser. Here that is 1, 0, 0, and Cinema wins with a score of 1.  
   `[src/runtime/numeric-ui-core.ts:2757-2762; candidate-gallery.test.ts:31-43; research "What runs" table]`
7. Narrow to 984 by 730. Cinema's hero shrinks to 666 pixels against a 900 target, so its gauge falls to 0.74. Contact wins, 0.94 over Story's 0.93.  
   `[lab/candidate-gallery/candidate-gallery.ts:211-239; candidate-gallery.test.ts:31-43; research probe]`
8. At 610 by 830, Contact's cells are 135 wide, a gauge of 0.56. Its height gauge is a perfect 1, but only the worst gauge counts.  
   `[lab/candidate-gallery/candidate-gallery.ts:166-185, 198-206; research probe]`
9. Story's hero is 439 tall against a 440 target, and its other gauges are full. Story scores 0.998 and takes over.  
   `[lab/candidate-gallery/candidate-gallery.ts:290-322; research probe]`
10. The flip is tight. At 517 tall, 760 wide picks Contact, but at 600 wide Story wins, 0.555 against 0.552. A three-way tie, as at 1,280 by 800, goes to Cinema.  
   `[candidate-gallery.test.ts:45-52; lab/status.md:170; research probe (1280×800 tie)]`

**On-screen labels:**

- `scaledQuality(size, scale) = min(unit, size·scale)`
- scales: `contactCellScale 1/240`, `cinemaHeroWidthScale 1/900`, `cinemaHeroHeightScale 1/560`, `cinemaThumbnailScale 1/90`, `storyHeroWidthScale 1/560`, `storyHeroHeightScale 1/440`, `storyThumbnailScale 1/60`
- `bottleneck([...])` → `emitMinimum` fold; `assumeRange(0, 1)`
- `emitArgmax(circuit, scores, unit)`, `comparisonBias 0.5000000596046448`
- scores 1400×680: 1, 0.8667, 0.8400 → Cinema; 984×730: 0.7405, 0.9361, 0.9275 → Contact; 610×830: 0.4413, 0.5625, 0.9982 → Story
- 760×517: 0.5613, 0.6403, 0.5548 → Contact; 600×517: 0.4333, 0.5521, 0.5548 → Story
- `selectedLayout`: [1,0,0] / [0,1,0] / [0,0,1]

---

## Chapter 3: Everyone Reads the Winner

**Thesis:** A winning bit times each candidate's rectangle, summed, gives every photo its position; clicks and focus run in the same program. It is a working demo, with nothing learned.

**Blurb:** The one-hot multiplies every layout's geometry and sums, so twelve thumbnails and the hero follow the winner, and clicks follow them.

**Visual machine:** **The selector rack.** Centre: one thumbnail tile (photo 0) with its `left` readout, fed by three lanes, one per layout, each carrying that layout's value for `left` through a multiplier gate sitting on the one-hot bit above it. A lane with bit 0 shows its value being zeroed (the number drains to 0); the lane with bit 1 passes it. The three gated values meet at a summing node (`circuit.affine`) and the total drives the real tile in a full-size stage on the right. Pull back and the same rack replicates for all 12 tiles and the hero as a cloud of lanes; the stage handle drags between the three presets and the 12 photo tiles fly (eased, hues preserved) from slot to slot. For the click: a cursor lands on tile 7, its four edge distances shine, a distance bar runs through two relu hinges (clamp 0..1) and rounds to a bit; the focus row of 12 cells lights one cell.

**Beat sheet** (captions carried in brackets):

1. Camera on one tile: one-hot [1,0,0] hangs above three lanes. Each lane carries thumbnail 0's left edge for that layout (Cinema 1106, Contact 14, Story 14). The two zero-bit lanes drain to 0; the sum reads 1106. The tile settles at left 1106, top 14, 133 × 97 in the 1400 × 680 stage. *(captions 1, 2, 3)*
2. Pull back: the rack replicates for four values × 12 tiles + the hero (+ hero-present flag); Contact's hero lane is all zeros and the hero box shrinks to nothing when Contact wins, a flag reading 0. *(captions 4)*
3. Stage drag to 984 × 730: bit slides to [0,1,0]; 12 tiles fly into the 4 × 3 sheet. Thumbnail 0 readout: left 14, top 14, 228.5 × 224.67. Hero gone. Then drag to 610 × 830: bit slides to [0,0,1]; tiles rise into 3 columns under a hero. Thumbnail 0 readout: top 467.2, width 184.67. *(captions 5)*
4. Zoom on the gather: the three-lane multiplier collapses into a single pick-one wire per read; counter "26 reads · 1 one-hot group" and "stored weights 940 → 848" in two stacked bars. *(captions 6)*
5. Click: a pointer lands on thumbnail 7 (1400 × 680 stage). Four edge distances, min of them = distance; two relu hinges clamp it into 0..1; a bit lights. Focus row of 12 cells: cell 7 goes to 1, 0 drops, hero swaps photo 7 in. *(captions 7)*
6. Edge test: two pointer taps near the left edge of thumbnail 7: one pixel inside (hit, check) and a quarter pixel inside (miss, focus unchanged). *(captions 8)*
7. Rounding-points reveal: the circuit dims to a faint grid and 14 small gate marks light up, 12 on the thumbnail hit tests, 2 in the bracket; a label "boolean atoms: 14". *(captions 9)*
8. Status card, quiet stage: "working demo", "moved from repo root Sept 17, 2026", "benchmark subject for lab/runtime-cost", a plain "nothing here is learned: scales are written by hand". Then recap: the three layouts, the gauges, the bit, the zeroed losers, as a faint one-line chain. *(captions 10, 11)*

**Captions** (spoken verbatim; pointers are plan-only):

1. The winner is just a 1 and two 0s. Twelve thumbnails and a hero still need rectangles, and they get them by multiplication, not an if.  
   `[lab/candidate-gallery/candidate-gallery.ts:334-365]`
2. Take thumbnail zero's left edge. Each layout offers a value; multiply each by its own bit and add. Two of the three products are multiplied by zero.  
   `[lab/candidate-gallery/candidate-gallery.ts:334-347]`
3. On the 1,400 by 680 stage, the sum is Cinema's rectangle: left 1,106, top 14, 133 wide, 97 tall. The other two layouts were computed too, then erased by zero.  
   `[research candidate-gallery.md C2 case 1; lab/candidate-gallery/candidate-gallery.ts:334-347]`
4. Every thumbnail and the hero run the same four sums. The Contact sheet has no hero, so its hero flag is zero.  
   `[lab/candidate-gallery/candidate-gallery.ts:349-365, 198-206]`
5. At 984 by 730 the bit moves to Contact and thumbnail zero flies to the corner. At 610 by 830 it moves to Story and drops below the hero.  
   `[research C2 cases 2-3; lab/candidate-gallery/candidate-gallery.ts:334-365]`
6. Declared a one-hot, these products lower to gather reads: 26 in one group, and the stored weights fall from 940 to 848.  
   `[gather-lowering.test.ts:53-96; lab/status.md:228; src/runtime/numeric-ui-core.ts:2757-2762]`
7. A click uses the same rectangles. Each thumbnail turns the click's distance from its nearest edge into a bit, and the first hit sets that photo's focus cell to 1.  
   `[lab/candidate-gallery/candidate-gallery.ts:466-488, 367-385]`
8. At 1,400 by 680, a click one pixel inside thumbnail seven hits it. A quarter pixel inside misses, and focus stays put.  
   `[research candidate-gallery.md C3 cases 2-3 and "Click probe"; lab/candidate-gallery/candidate-gallery.ts:466-488]`
9. The tests count exactly 14 rounding points: twelve thumbnail hit tests and two argmax comparisons. The rest is plain arithmetic.  
   `[comparison.test.ts:7-14; src/runtime/numeric-ui-core.ts:385-392]`
10. The status is plain: a working demo, moved into the lab folder on September 17, 2026, and a subject of runtime cost measurements. Nothing is learned; the scales are written by hand.  
   `[README.md:5; lab/status.md:289; lab/candidate-gallery/candidate-gallery.ts:402-414]`
11. So the program never branches. It builds every layout, scores each by its worst gauge, and multiplies the losers by zero, every frame.  
   `[README.md:1; lab/candidate-gallery/candidate-gallery.ts:155-163, 324-365]`

**On-screen labels:**

- `selectValue(values)`: `emitMultiply(winner.selected[i], values[i])` summed by `circuit.affine`
- thumbnail 0 @ 1400×680 (Cinema): `{left: 1106, top: 14, width: 133, height: 97}`
- thumbnail 0 @ 984×730 (Contact): left 14, top 14, width 228.5, height ≈ 224.67
- thumbnail 0 @ 610×830 (Story): top ≈ 467.2, width ≈ 184.67
- `heroPresent` (Contact 0, Cinema and Story 1)
- `gatherReads=26 slots=1 storedWeights=848 (dense compile of the same roots: 940)`
- `emitRectangleHit` → `circuit.boolean`; `emitFirstActive(clickActive, thumbnailHits)`; `focusField(item)`, `nextFocus`
- thumbnail 7 @ 1400×680: left 1253, top 347, 133 × 97; left+1 hits, left+0.25 misses
- `comparison.test.ts`: 14 boolean atoms = 12 hits + 2 argmax comparisons
- `README.md:5` status; `bun test ./lab/candidate-gallery` → 8 pass
