# durable-objects-unbound — shots stage report (2026-11-01)

Director: Claude Code, claude-opus-5-5, high effort. Shot authors: three claude-opus-5-5 high-effort agents (one forked
two further Opus 5.5 agents for ch07-s01..s05 in its first pass). Reviewer: one fresh claude-opus-5-5 high-effort
art/technical reviewer. No other model was used.

Clock: the locked audio clock from `.orly-work/durable-film-audio-locked.json` (1439.4167 s, 42 shots, 203 lines,
timelineSha256 2482f4b2…). No shot module was written before the marker existed. The shared cast and sets were built
and contact-sheeted first, through the film-specific set gallery.

## What exists

- `apps/bookshelf/src/viz/films/durable-objects-unbound/cast.ts`: 11 cast specs. The demonstrator's hand is a set,
  not a puppet.
- `sets/` holds 20 files:
  - shared, director-owned: common, harbourTown, wellAndPlate, roomLantern, leaseCandle, walRibbon, heldLetter,
    neighbours, demonstratorHand, historyDesk, wellCutaway;
  - shot-specific, author-owned: ch02-s01-kit, ch02-s01-study, ch03-s01-square, ch04-s01-study, ch05-s02-parchment,
    ch05-s03-sill, ch06-s01-lanternRoom, ch07-s03-celldTown, ch07-s06-windows.
- `shots/`: all 42 screenplay shots, each a `defineShot` module timed by `T` (beats and words) from the locked clock.
  - director: ch01-s01..s04 and ch08-s01..s04;
  - author:ch02-ch03: ch02-s01..s05 and ch03-s01..s06;
  - author:ch04-ch05: ch04-s01..s04, ch05-s01..s06, ch07-s06 and ch07-s07;
  - author:ch06-ch07: ch06-s01..s05, ch07-s01, ch07-s02, ch07-s03, ch07-s03b, ch07-s04 and ch07-s05.
- Set gallery: `apps/bookshelf/src/viz/film/gallery/sets-durable-objects-unbound.gallery.ts`, with snapshots in
  `qa/sets/`.

## Verification (final state)

- `npm exec -- nx run bookshelf:typecheck`: success.
- Purity grep over the shots, sets and cast found no `Math.random`, `Date.now`, `performance.now`, rAF or timers.
- `node generator/film/depth.mjs --slug durable-objects-unbound --all`: 0 moving shots under 3 depth planes.
  - ch01-s04, ch05-s02, ch05-s06 and ch07-s05 are locked-off or slow-drift plates, so the audit does not judge them.
- `node generator/film/legibility.mjs --slug durable-objects-unbound --all`: 0 subject texts under 22 px cap at 1080p.
- `node generator/film/cards.mjs --slug durable-objects-unbound --all`: 0 blank probed cards and 0 ghost-text shots.
  - The last full per-shot pass by the authors left "suspect paper" warnings in three shots. These are warnings, not
    failures: ch06-s01 (13, the ribbon's light paper), ch03-s03 (3, the brass swap cards) and ch06-s03 (1).
- Contact sheets exist for all 42 shots at `films/durable-objects-unbound/qa/sheets/<id>.png`, each newer than its
  shot file. Every sheet was read by its author and the director.
- `FILM_DEV_URL=http://127.0.0.1:5216` was used throughout; ports 5199 and 5200 were never touched.

## Review (one fresh Opus pass) and fix round

- The round-1 review (`round-1.md`) read all 42 sheets **before** the fixes. It scored art 7.5, teaching 6.0,
  accuracy 7.5 and continuity 8.0, a mean of **7.25 / 10**; the mean of the per-shot scores was 7.07.
- It found material problems in 16 shots. The main theme was that mechanisms were too small inside wide town frames.
- Outcomes:
  - **Fixed (15):**
    - push-ins, cut-ins or larger staging so the mechanism reads: ch01-s01, ch01-s02, ch04-s03, ch05-s01, ch05-s05,
      ch07-s01, ch07-s03, ch07-s03b, ch07-s04, ch07-s06, ch07-s07 and ch08-s01;
    - ch02-s01: the white-out removed;
    - ch03-s03: the Plate no longer changes without a click;
    - ch05-s03: the accuracy lock now reads. The 4 s attempt runs out mid-gust, then a 1 s retry lands before the
      12,000 ms notch.
  - **Accuracy fixes:** celld's Plate in ch07-s03 and ch07-s04 no longer shows workerd's house·epoch·from tiles.
    - The film's tick is now plain ink everywhere; red stays reserved for pins, wax, WAL stamps and the emberRed grade.
    - The demonstrator's hand now always enters from the lower right. The shared sprite had entered from the lower
      left in ch03-s02 and ch06-s05.
  - **Ruled accurate, not changed (1):** in ch05-s04 B claims B·8·7 with the crown dark, then opens to B·8·8 with the
    crown lit before its lantern serves. That is open-before-serve, and consistent with the crown rule.
  - **Minor items:** many were addressed, including ch01-s03/s04, ch03-s01/s02/s04, ch06-s01/s03/s04/s05, ch08-s02 and
    ch08-s04.
- **No second review round was run.** No post-fix score is claimed.

## Residual issues (honest)

- **Camera speed:** several moves exceed the ~6 %/s guideline: the ch06-s03 crane, the ch06-s04 tilt, the ch07-s01
  crane and the ch07-s04 crane. The ch08-s01 pan runs about 5–6 % against the script's 4 %.
- **Staging departures from the screenplay:**
  - ch08-s01 opens on the pin board, not on C's lantern;
  - in ch08-s01 the clipboard and pin board hang on their own posts by the square, not on the canonical L6 lamp-post;
  - ch07-s02's hosted-relay lamps sit on the ridge rather than out over the far shore.
- **Small or soft details:**
  - in ch05-s04 the fencing-vignette candle is about 180 px tall;
  - deep push-ins soften the L3 art (ch01-s01 end, ch07-s07);
  - ch07-s04's L5 railing crosses the crane;
  - the record tile in ch07-s04 is small.
- **ch05-s05:** the assumed clock offset "0" is drawn in red, outside the accent budget. It is minor and unrouted.
- **Not measured:**
  - the reel performance budget (~30 ms per 1080p frame);
  - the mix against the picture;
  - a complete render. The score and mix stages are owned elsewhere.
- This stage claims neither an assembled film nor an excellence-gate pass.

## Wanted shared or engine changes (not made; requested by authors)

- Underground or section support in paintTown for true crane-downs.
- A supersample option for deep push-ins.
- Per-house neighbour cords.
- A historyDesk lamp offset and a hide option.
- Posable lantern members.
- A shorter forearm for the hand.
- The puppet rim pass ignores `globalAlpha`, so puppet fades pop (engine).
- `crossfadeMood` gives every blend a new mood id, so grade changes re-bake cached layers. paintTown now steps blends
  in twelfths to limit this.
