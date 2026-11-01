# Round 1 — fix resolution (bounded finish pass, 2026-11-01)

Author: Claude Code, claude-opus-5-5, high effort, no delegation. Guard owner `director:final-r1`; ledger key
`final-review-r1` (`film.json` `stages.fixes`). The original `verdict.json` and `review.md` are unchanged. This file
regrades nothing and claims no pass: the scores in `verdict.json` describe the movie as reviewed, before these edits.

**The current movie does not yet contain these edits.** Everything below was checked on frames from the film harness
(port 5216), not on a rendered movie.

## Changed shots (exactly eight)

`ch01-s01, ch03-s02, ch03-s03, ch05-s05, ch07-s02, ch07-s06, ch08-s01, ch08-s04`

| shot | guard sha | shot span (film s) |
|---|---|---|
| ch01-s01 | c918848f8e07 | 0 – 29.25 |
| ch03-s02 | 240f13ada8cb | 308.83 – 348 |
| ch03-s03 | eb59cb41c90f | 348 – 389.58 |
| ch05-s05 | 1fe491d497b1 | 801.42 – 825.29 |
| ch07-s02 | 7c6b944238a4 | 1097.5 – 1123.29 |
| ch07-s06 | 372adc849794 | 1248.58 – 1282.71 |
| ch08-s01 | 0c8e98229c45 | 1303.04 – 1343.38 |
| ch08-s04 | 0daec63be4fe | 1409.42 – 1439.42 |

Transitions that straddle a changed shot's edge, for segment invalidation (the neighbour's frames blend with it):
ch03-s01 → ch03-s02 lampChange 1.2 s · ch01-s01 → ch01-s02 lampChange 1.2 s · ch05-s05 → ch05-s06 paperWipe 1 s ·
ch07-s02 → ch07-s03 lampChange 1.2 s · ch07-s05 → ch07-s06 paperWipe 1 s · ch07-s07 → ch08-s01 iris 1.2 s ·
ch08-s03 → ch08-s04 inkBleed 1.4 s. All other edges of these shots are hard cuts.

## Review keys

### Resolved in source (`fixes.shots.*`)

Each outcome below is `fixed` in the ledger; `finalize` reported routed 8, fixed 8, missing 0, downgraded 0, including
the verdict's three `fixChecks` absent strings.

- **ch07-s02.** L1 headland and five lamps raised 48 px, and the tag's hook with them. A moonlit sea band with a bright
  waterline now shows between the ridge and the headland during the relay beat. The tag is `legible: true`, measured at
  22 px cap, whole and above the ridge at 1111 s and 1114 s.
  - Departure from the note: the tag follows its L1 point but is drawn on L4 at `s: 1.2` (was `s: 1.9`). On L1 the
    legibility floor, applied through that layer's blur buffer, made it about three times too large, and it was clipped
    at the frame edge.
  - The sea band fades in with the relay beat; it is not in the other framings of this shot.
- **ch05-s05.** B's clock moved up and right, clear of every pulley line. The hand fades out as the zero inks. The zero
  is dark brass, centred on the face. The snapped thread is kept. Checked at 807.8 s and 808.5 s.
- **ch08-s01.** Title `dur` 3.3 s, `fade` 0.6 s, shorter than the suggested 4.0 s, because a trial `dur` of 3.95 s
  still left the title overlapping the board at local 3.76 s. At 1306.47 s (local 3.43) the board's edge reaches the title's end with the title almost
  gone; it is out of frame by 1306.6 s. The optional board exit was trivial and is included: the board stops at the cut
  to the first close-up, so it is absent at 1326 s and 1335 s.
- **ch03-s03.** Label right-aligned under the date stamp at upper right, clear of the Plate. Same words, same timing.
  Checked at 376 s.
- **ch03-s02.** Keeper B stands 40 px further right. 'Amazon S3' reads whole at 330 s.
- **ch07-s06.** The DOOR push stops about 18 % earlier and recentres. On the last frames the keeper, door and dark
  lantern are whole, with no upper-window sliver.
- **ch08-s04.** The slip moved about 36 px left at 1080p. The tick sits on clear window light, away from the head and
  mullion. The gold trace still starts at the slip. Checked at 1418 s.
- **ch01-s01.** A shot-local, screen-locked iris opens from black onto A's far window over 0.1–1.3 s. Tick staging is
  untouched. Frames at 0.05, 0.5, 0.9 and 1.2 s inspected.

### Resolved as metadata (`fixes.global[0]`, the three additional lines only)

Pending, unsigned entries added to `voice/voice.json` `listening[]`: L0312 'read (noun)', L0519 'A wakes', L0101
'opening line', all with `by`, `at` and `clipSig` null. Nobody has listened to them. No re-take, lexicon or voice-setting
change was made.

### Unresolved here

- **`fixes.global[0]`, human listening:** still pending and unsigned for celld, workerd, Deno, SQLite, S3, epoch, Vogels
  and Litestream, plus the three new lines. This needs a person.
- **`fixes.global[1]`, re-render:** the eight shots' sheets and audits are re-done, but their movie frame ranges are not
  re-rendered. Root owns segment invalidation and reassembly.

## New checks (the eight shots only, on the final source)

- `npm exec -- nx run bookshelf:typecheck`: success.
- Sheets: 8 written to `qa/sheets/`, each newer than its shot file, and all eight read.
- Depth: all pass, minimum 4–5 planes while moving.

| shot | subject texts | under 22 px | blank cards | ghost text | suspect paper |
|---|---|---|---|---|---|
| ch01-s01 | 2 | 0 | 0 | 0 | 0 |
| ch03-s02 | 3 | 0 | 0 | 0 | 0 |
| ch03-s03 | 5 | 0 | 0 | 0 | 3 (the known brass-card warning) |
| ch05-s05 | 4 | 0 | 0 | 0 | 0 |
| ch07-s02 | 2 | 0 | 0 | 0 | 0 |
| ch07-s06 | 2 | 0 | 0 | 0 | 0 |
| ch08-s01 | 1 | 0 | 0 | 0 | 0 |
| ch08-s04 | 6 | 0 | 0 | 0 | 0 |

Not run, by instruction: the full renderer, mix, publish, app build, git commit, push and deploy.

## Remaining visible limits

- **ch08-s04:** moving the slip left tucks its far-left end about 22 stage px behind the window frame. It reads as paper
  held at the frame, and the tick and text rows are clear. Left as routed.
- **ch07-s06:** the keeper, door and lantern are whole, but the end frame still has a lot of dark wall, including below
  them. C's window also passes the top edge briefly during the move (seen at local 31.88 s), before the last frames.
- **ch08-s01:** the title and board meet for a moment at very low title alpha (local 3.43 s).
- **ch07-s02:** the tag is drawn sharper than the far plane it stands for, as the only sharp element tied to L1.
