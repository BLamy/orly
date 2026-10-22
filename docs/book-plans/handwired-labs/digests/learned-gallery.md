# learned-gallery

**Question:** Can a tiny network whose weights are the program's source cells learn, live in the browser, to draw photos on the rectangles a visitor sketches, and also learn to line those photos up instead of having ordinary code snap them?

**Mechanism:** This folder has one file, README.md, "the record of how the loss and the training loop of the learned gallery were chosen" on October 13 and 14, 2026; "this folder holds no code" (code is in src/learned-gallery; the measurement scripts are not in the repo). Per the README, fixed features of each of 20 slots go through two ReGLU layers of 6 units to left, top, width and height: 6,320 operations in 8 layers with 244 weights (lab/status.md says "up to 12 photos"). Adam trains until the photos match the sketch. The loss has two parts: a Huber distance from the sketch, and a misalignment penalty that charges every two same-kind photo edges for their gap, with a pull that fades to 0 at one "reach". Per-pair multipliers grow with any gap that stays open (the method of multipliers). `trainOrUndo` rolls back any frame whose steps raised the loss and halves the learning rate. A "Misalignment penalty" slider (off to 8%, default 4%) sets the let-go distance.

**Result:** From README tables (penalty, October 14): presets Story, Cinema, Contact sheet stop after 679, 1,389 and 879 steps, lines within 0.01, 0.11 and 0.04 px. After small edits lines end 0.01 px apart (median), but other photos move 2.8 px. 96 sessions of 40 small edits: 1.1% end neither in line nor a reach apart. A photo "joins a line at half the distance at which it leaves one", so one sketch can end in two layouts.

**Status:** Moved to production: "into src/learned-gallery on October 14, 2026". Tried and not kept: "Straightening the sketch before training" (Cheng: "the spirit of the gallery is to learn something") and plain penalty forms (78%, 47%, 21% of edits left between layouts versus 1.8% for the kept form). Open limit (lab/status.md): "No held-out test: the network is fitted to one sketch at a time."

**Visual idea:** Drag one photo of a row of 4 down 12 px: it stays 9 px above its rectangle while its three neighbors sag 3 px to meet it; keep dragging past 24 px and the photo snaps free onto its rectangle as the neighbors spring back.

**Sources:**
- lab/learned-gallery/README.md:1-69 (the folder's only file)
- lab/status.md:203, 289
- commit 4ea7fcb
