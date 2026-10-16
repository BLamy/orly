# ui-exploration

**Question:** How far does HandwiredOS's approach (an interactive UI as one fixed numeric circuit of affine operations, ReLU-gated products and exact bits, with JS only recording inputs and projecting outputs onto the DOM) take us for writing UI?

**Mechanism:** One night of agent-driven exploration, September 12-13, 2026, in three rounds: seven readers mapped the runtime, Cheng's UI doctrine and pretext; thirteen prototypes were each built by one agent and attacked by a second; a third round read the talk "Repeatable breakthrough" and built more. The README is organized as: Short answer; Rewrites that kept working (e.g. count instead of search, one-layer prefix sums, springs as matrix powers); Capability map (a table of UI area, ops/layers, reference, what stayed outside); Where it got awkward; pretext; Findings for the main runtime; Third round; Browser check; Folders; Caveats. 16 of 24 prototype folders remain, about 630 files. Main ones: `text-walker` (pretext's line walker as arithmetic, e.g. `fast-walker.ts` `createFastCircuit`, `buildPointerJumping`), `text-tabulated`, `lists`, `input`, `layout-tree`, `hn-thread`, `codegen`, `numeric-library`, `instanced-items`, `streaming-words`, `event-time`, `pixel-output`, `code-points`, `learned-bits`, `user-population`, `drag-knobs`, plus `guide/`.

**Result:** "Most of the UI logic the prototypes ported became a circuit": a 10,000-row virtualized list in 280 ops / 19 layers; the HN thread 53,703 / 69; the 221-photo gallery 48,411 / 61, or 233 ops per photo as instances (`instanced-items`), with 0 decision mismatches at 10,000 photos. Combining wins was "richer but not cheaper": 18,027 ops versus HandwiredOS's 5,253. Index reads, the biggest win, landed in the runtime. Learning was weak: learned-bits got 0 of 48 runs exact; user-population picked slop 3, 4, 7, 10 px per tremor level over 39,321,600 user-frames; drag-knobs solved 63.6% of moving frames in one gradient step.

**Status:** A historical record. lab/status.md calls it "the record of the September 12-14, 2026 exploration"; "Its measurements describe the code as it was then." Several findings are marked "**Landed**"; others are open decisions. Caveat: "'0 mismatches' always means over the traces and samples each README names, not a proof."

**Visual idea:** The text-walker trick: a paragraph's segments as a bar of widths, a row of fit bits lighting 1 1 1 1 0 0 0 for "segments s..j fit", the count of ones becoming the line break, then a dragged window rectangle squeezing each line's width so the bits recount and the words reflow around it.

**Sources:**
- lab/ui-exploration/README.md:1-221
- lab/ui-exploration/text-walker/README.md:1-12
- lab/ui-exploration/text-walker/fast-walker.ts (function list, lines 46-657)
- directory listing of lab/ui-exploration (17 folders, 633 files)
- lab/status.md:204, 290
- commit 4ea7fcb
