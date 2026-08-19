# Electric Stream Protocol — visual plan

The book explains one product decision from five angles: the stream is the
authoritative, replayable event substrate; everything else is a projection or a
compatibility surface. The visual language borrows the reference's light paper
canvas, restrained mono labels, fine routed edges, colored typed cards, and
small stateful grids. The diagrams are explanatory scenes, not screenshots of a
console.

## Chapter 1 — The stream is the product

- **Question:** What changes when a stream owns the mutation rather than merely
  carrying it?
- **Centerpiece:** a mutation travels from an actor into a durable append-only
  log, then fans out to two readers. The log remains while one reader refreshes.
- **Motion:** direct request → append with offset → readers tail from bookmarks →
  one reader disappears → the log continues → the reader resumes at the exact
  gap.
- **Reusable VizEngine primitives:** `ArchitectureFrame`, `ArchitectureCard`,
  `ArchitectureEdge`, and `ArchitectureGrid`.

## Chapter 2 — One event, many views

- **Question:** How can the same durable event become a UI, an audit trail, and
  a replay?
- **Centerpiece:** the dispatch door and reducer fan-out. One numbered event
  crosses the frame; canonical state, a projection, and an evidence log update
  from the same source.
- **Motion:** event enters → validation → append-only stream → three projections
  light up at the same offset → a digest chip proves deterministic replay.

## Chapter 3 — Convergence is visible

- **Question:** What does two-client collaboration look like when the stream is
  authoritative?
- **Centerpiece:** coordinator, five clients, quorum rail, and one offline
  participant. The scene makes “runs next” and “caught up” visible rather than
  leaving them implied by a spinner.
- **Motion:** clients prepare → coordinator broadcasts one commit → four peers
  converge → the offline peer reconnects and replays the missing suffix.
- **Reference:** the attached consensus diagram's phase rail and status cards,
  translated into the book's own palette and vocabulary.

## Chapter 4 — Branches are views, not copies

- **Question:** Why is this not just a better Git object store?
- **Centerpiece:** commit DAG → materialized tree → object/key-value grid. Two
  branches share immutable history and diverge only in their event suffixes.
- **Motion:** main and feature fork → both read shared objects → feature appends a
  conflicting write → the conflict is an explicit state, not a hidden merge.
- **Reference:** the attached commit-DAG/tree/network/key-value diagram's layered
  layout, sparse connector routing, and active-cell treatment.

## Chapter 5 — Git at the edge

- **Question:** Can a normal Git CLI still participate?
- **Centerpiece:** an ordinary clone/commit/push adapter at the edge of an
  authoritative stream. Post-clone activation discovers the stream, installs a
  local bridge, and turns Git-origin changes into normal events.
- **Motion:** `git clone` lands a working tree → activation handshake → CLI
  writes enter the stream → peers receive the same event → export/mirror flows
  back to Git when needed.
- **Closing claim:** Git remains a compatibility substrate and escape hatch; the
  stream is where identity, evidence, convergence, and replay live.

Every chapter uses captions as its narration script. Labels carry identifiers,
offsets, and protocol vocabulary; captions explain the idea in spoken language.
The generated blog will use two short muted autoplay clips per chapter, plus the
full chapter links, so the reader can see the protocol change while reading.
