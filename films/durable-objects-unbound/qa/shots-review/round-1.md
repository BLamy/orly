# durable-objects-unbound · shots stage · independent art + technical review, round 1

Reviewer: independent Opus 5.5 (did not author any shot). Basis: all 42 contact sheets in
`films/durable-objects-unbound/qa/sheets/`, the brief's accuracy locks, the final screenplay digest, spot reads of shot
source where a value was ambiguous on the sheet, and three full-res stills (ch02-s01 local 11.5–13.5, ch08-s02 local 30.0).
Audit files on disk: legibility 0 offenders; cards 0 fails / 0 ghosts (suspects only in ch03-s03, ch06-s01 ×13, ch06-s03);
depth ok on every moving shot (ch01-s04, ch05-s02, ch05-s06 and ch07-s05 are locked-off).

## Overall verdict

The film has a real, consistent visual world. The canonical town is the same in every shot: A·B·C left to right,
the Well and Plate at the left third, C's dormer on the upper terrace, the L6 lamp-post as occluder. The grades are
motivated, the figures are the darkest shapes, and the history desks are dignified, with no likenesses. The parchment
plates (ch05-s02, ch05-s06, ch06-s01, ch07-s05) are excellent and technically exact. The workerd epoch geography
(A·7·7 → B·8·7 dark → C·9·7 → C·9·9 lit, and the B·8·8 counterfactual) is correct where it is taught.

The dominant weakness is **scale**. Too many mechanisms are staged as specks inside a wide town frame: the tick on
#42 (ch01-s01, ch01-s02, ch07-s07), workerd's restore chain (ch07-s01), the bell-before-the-Well ordering (ch07-s03),
the owner's empty ring and the Well proof (ch07-s03b), the failing-renewal fence (ch05-s04), the bucket proof
(ch05-s05), the calendar bars (ch04-s03) and the montage vignettes (ch08-s01). With the sound off, a viewer sees a
handsome town in which small lights change. The fix is mostly camera work: push in on the subject on its word, then
pull back.

There are four accuracy problems:
- ch05-s04: B's claim shows B·8·8 with the crown lit, which contradicts ch05-s06 and the second vignette in the same
  shot.
- ch07-s03 and ch07-s04: workerd's three-tile house·epoch·from Plate (A·7·7, then C·8·8) is carried into celld's town.
- ch07-s02: the hosted relay's five lamps sit on the harbour's own ridge.
- ch03-s03: the Plate jumps to the refused house's letter before lesson two.

The workerd lease numbers stay on workerd's side, badges are never mixed on one mechanism, WAL stamps are red ink
(not wax), and shelf 8 stays untouched.

| | score /10 |
|---|---|
| Art (composition, value, light, depth) | 7.5 |
| Teaching (sound-off read, beats on words, action through the shot) | 6.0 |
| Technical accuracy (brief locks, digest) | 7.5 |
| Continuity | 8.0 |
| **Stage mean** | **7.25** |
| Mean of the 42 per-shot scores | 7.07 |

This does not pass an 8.5 bar yet. Most of the gap is closable with framing alone, without new art.

Shots with MATERIAL findings (16): ch01-s01, ch01-s02, ch02-s01, ch03-s03, ch04-s03, ch05-s01, ch05-s03, ch05-s04,
ch05-s05, ch07-s01, ch07-s03, ch07-s03b, ch07-s04, ch07-s06, ch07-s07, ch08-s01.

Shared-set question for the director (not a shot fix): `slip()` in `sets/common.ts` draws the two-stroke tick in
`mixLab(INK_RED, '#1d1712', 0.35)`, a dark red. The accent budget reserves red for pins, wax, WAL stamps and the
emberRed grade. Decide whether the film's tick is allowed to be red; at the inset sizes (ch02-s03 29–33 s) it reads as a
red check mark.

## Per-shot findings

### ch01-s01 · cold open · 7/10
MATERIAL
- 25.2 → end (`tick`): the film's central image (a two-stroke tick strikes #42 at the lantern's door) is a ~12 px
  slip at the window's edge. The tick can't be seen and the lantern "warming by a breath" doesn't register. The
  only readable carrier is the upper-right text label. Fix: finish the push so the door, latch and slip fill about a
  quarter of the frame, and land the two strokes visibly on `tick`.
- 0.0–5.6: the cold open's defining image is missing. The direction asks for an iris on one warm point far across
  black water, then a long push across the sea. The first frame (0.08) is the whole town already lit, framed from the
  square, with no sea or far shore in any frame. The sheet reports `in: cut`. If the reel drops the iris on shot one,
  the composition still needs the L1 water.
MINOR
- 17.9–23.0: the slip's flight from the sender's window to the lantern door is a white fleck crossing the
  square. Good path, too small.
- 22.4–29: the Plate is clipped by the right frame edge (its right tile is half off). Either keep it whole or drop it.
- Both labels are small italic at the 22 px floor. They pass, but sit upper-right over a bright sky gradient.

### ch01-s02 · the failure, then the mystery · 7/10
MATERIAL
- 18.8–26 (`slip`, L0107 "still there, with its tick"): after the push, the slip in C's window is ~17 px wide
  (`slip(... w: 17 ...)`). The tick and the slip's identity can't be read, so the shot's promise ("the promise is still
  true") has no visible proof. Push closer, or use a larger slip in an inset.
MINOR
- 13.1 (`bundle`): the bundle climbing C's pulley line is a speck. Make it bigger, or keep the camera on it.
- ~7.0–8.0: B's one-second flicker (the ch05-s06 plant) falls between sheet frames, so I couldn't verify it on the
  sheet. Check it reads as a lit window and not just a glow.
- 25.8 (`true`): the Well's single glint isn't visible.
- Strong: the lampChange in, A guttering on ones at 0.6–3, the grade back to winterBlue as C lights at 10.15, and the
  lamp-post occluder pass at 20.9.

### ch01-s03 · the question · 8/10
MATERIAL — none.
MINOR
- 0–6 (`crane`): reads more as a truck from left to right past the lamp-post than as a 220 px vertical crane down;
  the houses never rise out of the frame top.
- 16.1 (`acked`): C's lantern is off-frame or clipped at the right edge at this beat, so "the ticked slip seen tiny in
  C's lantern" isn't in the shot. Reframe to include C's window.
- 22.4 (`move`): the three pulley lines converging on the Well are hairlines.
- Good: the labels land on their words; the C tile and the crown pulse at 14.4 read; the end reflection works.

### ch01-s04 · title · 8/10
MATERIAL — none.
MINOR
- 16.8 → end: the direction says competing layers fade to 0.15 and the frame rests on the crown lamp. The title stays
  at full strength to the last frame.
- The Plate's first tile appears blank here, while ch01-s03 ended on 'C'. Check this, and keep the C.
- The label 'illustrative harbour · real code' sits at y ≈ 600: legal, but close to the caption band.

### ch02-s01 · one place in the whole world · 7/10
MATERIAL
- ~11.0–13.2 (`globe`): the push into the laptop glow becomes a ~2 s near-uniform cream white-out (stills at
  local 12.0 and 13.0). Kenton's figure goes paler than the ground, inverting the value hierarchy, and the frame
  reads as blank in a dusk-dark film. Shorten the bloom to ≤ 0.6 s, or dissolve through a darker paper tone.
MINOR
- From 14.5: a large out-of-focus dark L5 shape hugs the right edge. The direction puts the shelf edge at the left.
- Strong: the one lantern on 'place' (18.7), slips converging (22.7), many lanterns (28.2), and the quote landing on
  'plain'.

### ch02-s02 · the chat room · 7/10
MATERIAL — none.
MINOR
- 18.7–24 (`interleave`): three slips stand in a row inside the lantern, but "a handler in two halves, paused, with
  another slip sliding between the halves" isn't distinguishable from three whole slips. Give the halves a torn
  edge and keep the intruder visibly different in value or size.
- 5.7–6.7 (`broadcast`/`threads`): the threads and copies are very small at this framing.
- Good: the match-cut to House C's window (9.9–12.4) is a lovely beat.

### ch02-s03 · the output gate · 8/10
MATERIAL — none. The quote is verbatim, the date sits top-right, the quote clears before the term tag, the letter lifts
on 'lifts', there is an emberRed flicker with red-edged error slips at 26.0, and the #42 inset with its tick arrives
on 'tick'.
MINOR
- 17.8 (`done`): "the ledger ink dries" doesn't read; the change is too subtle.
- 29.0: the inset card fades in as a blank light rectangle for a few frames before its text. The audit passes, but
  ink the text sooner.
- The inset's tick is red (see the shared-set question above).

### ch02-s04 · the runtime leaves; SQLite moves in · 7/10
MATERIAL — none.
MINOR
- 12.9–20.6: ~8 s with almost no change (the lone house-with-lantern on the hill, under the quote). The "ringed once"
  on 'single' (11.4) and the single thread to the desk aren't visible. Animate the tether and the ring.
- 20.6–22.0: the 2022 → 2024 "small ink bleed across the window" is a full-frame cut-paper blackout (frame 20.83 is
  almost entirely dark).
- 23.0 / 30.1 (`book`/`local`): the SQLite book and the slip touching it are too small to read.

### ch02-s05 · Cloudflare's hosted relay (diagram) · 8/10
MATERIAL — none. It is a diagram, never the town; the badge 'Cloudflare, hosted' is legible; the chute and cistern are
slow; five lamps sit on threads; the quote is verbatim; the pull-back reveals the great wall.
MINOR
- 31.8 (`three`): only one lamp's flash is clearly visible on the sheet. Make three distinct flashes back along the
  threads.
- 9.5 onward: the ribbon frames already carry red marks. That's accurate (they are WAL commit marks), but the
  stamp isn't introduced until ch06-s01. Consider plain frames here.
- The lower 40% of the frame is empty dark board for the whole shot.

### ch03-s01 · freshness · 7/10
MATERIAL — none.
MINOR
- 14.9 (`stale`): the faded old stroke against the fresh one is a weak distinction at this scale. Also, the fresh
  stroke glyph is '~' in the first pass and 'Z' in the second; use one glyph.
- ~22.8: the closing of the cutaway passes through an almost all-black frame (a band of town at the top only).
- Good: the two-channel sliver at 19.8 teaches the path split clearly; the date and label land on their words.

### ch03-s02 · PULL THE PIN: the naive race · 8/10
MATERIAL — none. The pin is drawn on 'pin'; both keepers read; A then B are stamped; both lanterns light; B wins; the
push on B beside A's lit lantern; the pin is reseated, the lanterns gutter and the grade returns.
MINOR
- 25.3 (`served`): the ticked slip leaving A's lantern is a fleck.
- 34.7 (`gap`): the read…write ink diagram is tiny and thin. Enlarge the gap mark where the second card slips in.
- 7.9: the demonstrator's arm is a long black diagonal across the lower-right foreground. It's acceptable, but heavy.

### ch03-s03 · two refusals · 7/10
MATERIAL
- ~16.0–16.8: between lesson one (A stamped, B refused) and the 'November' date stamp, the first tile flips from 'A'
  to 'B' with no action (code: `house2 = 'B'` before the click). With the sound off, the refused house now owns the
  Plate. Reset the tile to blank, or mark the reset as a new scene (date first, then an engraver re-cutting the tile).
MINOR
- 14.9 (`refuse1`) and 30.6 (`thunk`): the punched hole in the refused card isn't visible.
- 25.9 (`click`): the re-cut of the Plate's notch isn't readable as a *change* of pattern. Briefly highlight the old
  and new profiles.
- The cards audit lists 3 unprobed light-paper suspects (the swap cards).

### ch03-s04 · who referees the referee · 8/10
MATERIAL — none. The name card, both quotes (verbatim, attributed, one replacing the other), the three cistern lamps,
the order ledger, the witness with a cord and bell, and the proof sheets outnumbering the ledges all read.
MINOR
- 1.0: Werner's figure is already visible at the bottom-right edge, partly below y 634, before the crane and the
  name card.
- 13–30: several large irregular black blobs float in the dark wall left of the cutaway. They read as stains or
  artifacts rather than stonework.
- 30.3 (`inside`): the cyan pulse in the Well and the pulley lines converging on the wellhead are not visible.

### ch03-s05 · 'compatible' is not a guarantee · 7/10
MATERIAL — none. The badge 'celld 0.6.3' is on the rig (not the well), the quote is verbatim, and the look-alike
well recedes into fog.
MINOR
- 19.8–27.5 (`four`): the accept/refuse/accept/refuse sequence of the four test cards can't be told apart at this
  framing; only the two green check lamps at 27.5 read. Push into the rig for the four feeds.
- 15.2 (`silent`): the card sliding under the closed shutter is ambiguous; it looks like an ordinary insert.
- 11.2 (`two`): the two lanterns on the terrace aren't both clearly in frame.

### ch03-s06 · scope of the referee · 7/10
MATERIAL — none.
MINOR
- 12.0 (`quiet`): the Well darkening and the rope going slack are not discernible; the frame at 12.3 looks like the
  one at 10.4.
- 8.5 (`apart`): one click while the other card is still in flight doesn't read. Separate the two moments with light.
- The direction asks for a high angle over the terrace; this is the standard eye level.

### ch04-s01 · Ryan Dahl's desk · 7/10
MATERIAL — none. The desk is screen-right (geography lock), with the name card, the date, the narrowed label, and the
README quote (verbatim).
MINOR
- Figure and desk occupy the lower-middle third; the upper half is empty brown wall for 42 s. The camera move is
  small, so the shot feels static. Push in further, or frame the window town larger.
- 38.4 (`lineage`): the braided spine cord isn't visible. 36.1 (`well`): the cyan glint is a dot.
- The label 'Ryan Dahl, 2026: why he started celld' is small, top-left.

### ch04-s02 · the gap; the braid begins · 7/10
MATERIAL — none.
MINOR
- 11–24: ~13 s with almost no change while L0408–L0409 play (the bell jar is the only event). The lamp brightening on
  'delighted' (24.5) is very subtle.
- The pull and braid (27–30) are good, and both lamps share the frame as directed.

### ch04-s03 · the announcement as plans · 6/10
MATERIAL
- 8.7–35 (`plans`, `year`, `endyear`, `deploy`, `continue`, `open`, `terms`): six beats across ~26 s are carried
  entirely by dotted pencil marks inside a ~150×80 px calendar card on Ryan Dahl's desk. None of the bars, the cap, the
  arrows, the paper door or the lifted pencil can be read on the sheet. Push in on the calendar for this run (and
  pull back for 'Bert').
MINOR
- The Q12 quote is still visible at 22.33 (`deploy`, where it should be carried out). It fades shortly after.
- Good: the Bert Belder name card beside an empty, soft chair; Kenton's lamp faintly at frame left throughout.

### ch04-s04 · the commit, as a document · 8/10
MATERIAL — none. The serverCyan rim is used only here (the commit strip), the quote is verbatim with the commit id,
there is a margin vignette of three houses and one well, an empty bracket then a clock, a facet, the two workerd
badges, and the fold-open.
MINOR
- 13.3–15.4 (`owner`/`dies`): the window hand-off in the vignette is tiny. Enlarge the vignette.
- The badges are below the strip at ~y 565. That's fine as art; don't rely on them being read.

## ch05–ch08

### ch05-s01 · the Plate opened · 7/10
MATERIAL
- 31.0 (beat `one`, "at most one claimant wins"): the second claimant's ghost card from House C being spat back is not
  visible in any sheet frame at 30.6–32.6; the "at most one" half of L0504 has no image. Fix: put the refused C card at
  the Tooth slot, large enough to read at this framing (or push in for 1.5 s), with the punched hole.
MINOR
- 19.1–21 (`log`): the scroll-shelf outline in the Well is a faint dotted box at the well base; reads as nothing.
  Brighten it and draw the brass tie to the Plate clearly.
- 22–30: only one keeper figure is in the square; it is not obvious that it is B's keeper (it stands right of the
  Well, not at B's door). A short walk from B's door would make "B claims" read.

### ch05-s02 · the Candle Ruler (parchment) · 8/10
MATERIAL — none.
- Arithmetic checks out on the sheet: 12,000 sits at 0.60 and 16,000 at 0.80 of the 0–20,000 scale; the red band is
  16,000–20,000; the renewal bracket runs 12,000→16,000; `serve: t + 4,000 < 20,000` / `renew: t + 8,000 < 20,000`.
MINOR
- 0–30 s: everything sits in the left 35% of the plate; the right two-thirds is blank parchment until the
  equations ink at 30.9. Centre the ruler, or bring the clock face and the brackets out larger into the right half.
- 11.5–17 (`timetable`): the 3 s ticks, 4 s bracket and 1 s hook are hairline-thin and tiny; at 1080p they are
  texture, not teaching. Scale them up and land each one on its word ("three", "four", "one").
- 17.3 (`skew`): the offset clock face and ghost scale are faint; the 2,000 ms slide doesn't read.

### ch05-s03 · the R2 scar · 7/10
MATERIAL
- 18.7–22.6 (`retry`, the brief's lock): the rewind needs to show the 4 s attempt running out mid-gust, then the 1 s
  retry hook, then a retry landing after the gust and before the 12,000 ms notch. The sheet shows three
  hourglasses appearing in a row and the candle relighting. I can't see a notch on the candle or any mark of the
  order of events at sheet scale, so the "not a single 4 s attempt outlasting a 5.5 s stall" point does not read
  yet. Fix: put a visible 12,000 notch on the candle, empty the 4 s glass while the gust still blows, then
  show a small hook and a third glass that finishes after the gust lines stop.
MINOR
- 5.2 (`scar`): the page shows two or three red-underlined lines; the script asks for a single underlined line.
- The lower 40% of the frame is a flat dark wall in every frame; consider a lower sill or near-plane detail.

### ch05-s04 · PULL THE PIN: the self-fence · 6/10
MATERIAL
- 14.5–27.0: after B's click the Plate reads **B · 8 · 8 with the crown lit** (code: `from: 8, crown: …bOpen`). The
  digest beat is "B · 8 · 7, crown dark", and the second vignette in the same shot (37.0 →) does show B · 8 · 7, crown
  dark. So one shot gives the viewer two different post-claim Plates, and 90 s later ch05-s06 teaches that B·8 stayed
  "from 7" and never opened. If B opening here is deliberate (so that B's lit lantern is not shown serving while the
  crown is dark), make it read as a two-step event (click → B·8·7 dark → B opens → B·8·8 lit) and keep it
  clearly separate from the canonical night. Otherwise follow the digest (B·8·7, crown dark) and do not light B's
  lantern until it opens. Either way, the director has to decide this.
- 28.9–36 (`early`, a brief lock): the failing-renewal keeper must close its shutters at the 12,000 ms notch,
  visibly 4 s above the band, and B's card must click only after expiry. At sheet scale the candle in A's window is
  ~10 px and no notch or band can be seen, so the core of "fencing" (gone *before* anyone may take over) does not
  read with the sound off. Fix: push in on the candle for this vignette, mark the notch and the band, and hold the
  shutter close on the notch.
- 38.7 (`knew`): no camera drift to B's keeper. The frame is unchanged from 36 to 45 s, which is a ~9 s static hold
  over L0522.
MINOR
- 4.3–7: the demonstrator's arm is a long diagonal black bar that crosses the badge and the lower frame; shorten it
  or bring it in lower-right only.
- 47 (`foreshadow`): the lamp-hook on the Plate is not visible at sheet scale.

### ch05-s05 · borrowed clocks / celld split · 6/10
MATERIAL
- 12.9–22.9 (`record`): about 10 s of near-static split screen. The celld keeper stands still beside a bell, with no
  scroll landing in its Well (the bucket proof), no look up at its plate, and none of the shorter ten-second candles
  with a renewal mark that the direction calls for. L0526's point ("when the Well proves a write it reads the record,
  not a clock") has no action. Fix: show the scroll drop, the bucket coming up, the keeper's head turning to the plate,
  then the bell.
- 6.2 (`zero`): the snapped thread and the engraved '0' on the sill clock are not visible at sheet scale, so
  "assumes zero" does not read.
MINOR
- The split keeps workerd's badge and celld's badge on screen together (left/right halves). The digest asks for
  this, and the halves don't merge, so it's acceptable. Keep the seam hard and avoid mirrored framing.

### ch05-s06 · claimed ≠ opened (parchment) · 9/10
MATERIAL — none. Accurate on every lock: A·7·7 lit → B·8·7 dark (the from tile held by the hand) → restore/snapshot/
opening-write steps with a ghost B·8·8 → B dies → C·9·7 dark with its line back to A·7·7 → empty shelf 8 → rewind →
B·8·8 lit → C·9·8 dark with its line back to B·8·8. The labels swap without ghosting.
MINOR
- 49–52: the direction says "hold on the two lines, side by side". After the rewind only the epoch-8 line remains (the
  C·9·7 → 7 line was unprinted), so the comparison is not on screen at the end. Re-print the first case as a faint
  second row.
- The lower third of the parchment is empty for the whole shot; the stamp row could be larger.

### ch06-s01 · the write-ahead log (parchment) · 8/10
MATERIAL — none. Leader '32 BYTES', five frames with '24' tabs, red INK stamps 6 (frame 3) and 7 (frame 5), zeros on
the other tabs, brackets 1–3 / 4–5 at `mark`. Good.
MINOR
- 27.7: the ledger flashes red-striped. Red is reserved for stamps/pins/wax, so use brass or ink for the
  "6 pages" highlight.
- 4.7–8.6: ~4 s of a near-empty plate (ledger + quill) after the unfold.
- The cards audit lists 13 unprobed light-paper suspects in this shot: probe the parchment cards.

### ch06-s02 · the Scissors · 8/10
MATERIAL — none. Stamp → cut, waiting through unsealed frames, rollback frames greyed then pasted over, and the
checkpoint all read.
MINOR
- 8.5–22: the push crops the 'workerd · 28 Oct' badge at the top edge (half its height off-frame) for ~13 s. Either
  keep it in frame or let it leave cleanly.
- 26.7 (`fresh`): pages sliding into the ledger are hard to see; the new leader card is small.
- The basket is half off-frame left during the middle section, so the lengths "dropping into a basket" are lost.

### ch06-s03 · scrolls and Books in the Well · 7/10
MATERIAL — none.
MINOR
- 14.7–33: the set-aside short scroll parks at the right frame edge, half clipped, at y ≈ 630 (on the caption-band
  line) for the rest of the shot. Move it inboard and higher.
- 28.8–33.4: the celld LTX shelf (labGreen, its own badge) never fades as the direction says ("then it fades"), so the
  shot ends with both badges and two formats on screen. Fade it ≤ 0.15 by the end.
- 5.9 (`merge`): the two-versions-of-one-page inset is tiny.

### ch06-s04 · proof before response (workerd) · 7/10
MATERIAL — none against the locks: upload → lamp to the Plate A·7·7 → A and 7 glint → bell → latch → tick.
MINOR
- 23.96 (`tick`): the inset slip's tick isn't distinguishable at sheet scale; enlarge the inset or the tick strokes.
- 27.5–30.7: the celld quote ("…cannot act on a value that a crash can still lose." — celld guarantees, v0.6.3) sets
  over workerd's door ~3 s before the celld inset arrives. The workerd badge has correctly faded, but the quote is
  celld's and the art is workerd's. Land the quote on `celld` (30.7) together with the inset.
- 8.7–10.4: the tilt passes through an awkward frame (door cropped top-left, Well tiny bottom-right).

### ch06-s05 · PULL THE PIN: the second look · 7/10
MATERIAL — none against the locks (B·8·7 after the claim; the late scroll lands on shelf 7; shelf 8 does not get it;
after the reseat the lamp shows B·8, no bell).
MINOR
- 26.25 (`error`) and 28.25 (`clear`): the letter turning into a red-edged error slip and the sweep of the late
  scroll from shelf 7 are not discernible on the sheet; shelf 7 still shows its scrolls at 28.25.
- The epoch shelf inset sits as a floating box under the square with EPOCH 8 left of EPOCH 7. ch07-s04 stacks 7 above
  8, so order them 7 → 8 left-to-right for continuity.
- 32–44: a ~10 s near-static coda on the sender's window (acceptable, but the '?' is faint).

### ch07-s01 · workerd's restore · 5/10
MATERIAL
- 8.8–31 (the whole restore): the mechanism is staged inside C's window at medium-wide. The window is about 140×170 px
  at 1280, and the Book, the four tagged scrolls riding the pulley line, the already-laid page that flashes and is set
  aside (`skip`), the gap in the chain (`gap`), the crumpled scroll whose panel stays blank (`crc`/`never`) and the pages
  dropping into the lantern's book (`replay`) are all specks or invisible on the sheet. This is the film's key
  restore lesson and it does not teach with the sound off. Fix: push in so the window desk and the chain of scrolls
  fill at least a third of the frame, and stage gap/crc as large ghost inserts.
- 1.5 (`badge`): the camera is not on the wellhead. The Well/Plate/badge enter only at ~4.9, crammed against the left
  frame edge with House A cut off.
MINOR
- The ghost what-if darkens the entire frame for 6 s (18–25), which flattens the image. Darken only the chain.
- Accuracy is correct: C·9·from 7 with the crown dark, ending C·9·9 with the crown lit (the brief's lock; the
  digest's "C·8" beat text is stale and was rightly ignored).

### ch07-s02 · the price; followers remembered · 7/10
MATERIAL — none. A bar with no scale, a dotted outline, 'workerd · 28 Oct' on the rod, C·9·9.
MINOR
- 13–17.7 (`shore`): the five serverCyan lamps and 'Cloudflare, hosted' tag sit on the town's own L2 ridge, directly
  above the terrace roofs, so they read as part of the harbour hill. The lock says the hosted relay is never drawn
  as the harbour town. Move them out over the sea / far shore (L1), clearly separated by water.
- The 'Cloudflare, hosted' tag is small and soft (likely below the 22 px cap if it is meant to be read on
  "Cloudflare's"); push in or enlarge it.

### ch07-s03 · celld's fleet: fsync · 6/10
MATERIAL
- 20.9–25 (`bell`/`upload`, the whole point of L0715): at the wide pull-back, A's bell swinging, the latch lifting,
  #42's tick landing *while the scroll is still on A's sill*, and the scroll then rolling down to the Well are all
  specks. The "bell before the Well" ordering, which is celld's key difference, can't be seen. Fix: frame A's sill,
  bell and lantern door with the pulley line and wellhead in one medium shot, then hold the scroll visibly on the sill
  through the tick.
- 18.05 (`every`): the two glowing press tabs aren't visible; at that moment the camera is on C's window only, so
  "both locked" never shares a frame.
MINOR
- celld's Plate shows dimmed tiles A·7·7. The from tile is workerd's three-tile construct (L0501, "In workerd's
  cluster it has three tiles"), and the direction asks for "a plain plate". ch07-s07 uses blank tiles, so be
  consistent: blank, or house + epoch only.
- 7.75 (`hands`): the page travelling along the neighbour cords is a white speck.

### ch07-s03b · count: the owner never counts itself · 6/10
MATERIAL
- 2.9 (`self`): the empty ink ring around A's own notebook is invisible at this wide locked-off framing, so the
  label "The owner never counts itself" has no image under it.
- 4.5–10.8 (`alone`/`wellproof`): the slow trip down to the Well and the bell ringing only when the bucket comes up
  read only as a few moving dots; "much slower, still correct" isn't shown.
MINOR
- The lamp arithmetic (A only → +B → +C → back to A+B) and the gold A↔B two-copy outline at 22.2 read well; the
  three page silhouettes on three sills at 15.1 are too small.

### ch07-s04 · celld: tail outside the Well · 6/10
MATERIAL
- 25–40: the successor's Plate in celld's town reads **C · 8 · 8** (code: `house C, epoch 8, from 8`) with the crown
  lit. Showing workerd's house·epoch·from triple, and a from tile at all, in celld's town carries a workerd mechanism
  into celld. It also puts "C·8" on screen two minutes after workerd's C·9, in the same houses. The celld shelves 7/8
  are fine; the Plate should be a plain celld record (house + epoch, or blank as in ch07-s07), and the narration
  doesn't need a from tile.
- 25.6 (`gone`) and 28–30.4 (`asleep`/`stale`): "the slip loses its tick", the unsealed copyists pressing A's next
  page, and A's bell ringing again are not discernible. The stale-owner half of the lesson doesn't read.
MINOR
- 11–21: the cutaway is strong (late scroll on shelf 7 by a ghost keeper; shelf 8 holds only its Book; label "Epoch
  shelves fence the Well, not the tail"). The heavy black L5 railing band crossing mid-frame during the cranes is
  clumsy.
- 37.8 (`record`): the record tile with its eye is very small at the wellhead.

### ch07-s05 · the recovery gate (parchment) · 8/10
MATERIAL — none. Absent → straight to the Book; Sealed → straight to the Book; Open → Tooth click / notch, red wax across
both notebooks (correctly wax: celld sealing), pages → scroll, scroll → Well, seal on the record, then the gate
swings. The order is exact.
MINOR
- The digest calls the upper-right text a "quote fragment in a cartouche", but it is the label 'celld: seal the old
  session, then restore'. That's fine per the on-screen list. The italic label is small; check the cap at 1080p.
- Stations 2–6 are very faint before activation; slightly stronger ghosts would let the viewer see the whole path
  first.

### ch07-s06 · a complete tail · 6/10
MATERIAL
- 25.1–34.1 (end): the label "celld: an error is not proof of absence" sits over the top of C's lit window, and after
  the `promise` push the label "No complete tail: the door stays shut" overlaps the top-clipped lit window of the left
  house (33.17). The final image is two labels over clipped, busy window art, with the window cut by the top edge.
  The push also frames the keeper rather than "the closed door". Fix: push toward the latched Room Lantern door
  (centre-right), keep both windows either fully in or fully out, and put the labels on clear sky.
- 13.7 (`proceeds`): "the gate (seen small at the wellhead) opens" is not in frame. There is no Well in this shot, so
  the outcome of case one reads only as the keeper's lantern brightening.
MINOR
- The spine bands (complete / gap / water-stain) read as grey blobs on the notebooks at this scale. Make the
  band itself the subject in an insert.
- Geography is correct: the keeper stands at C's door; copyist-1 is in B, copyist-2 is in C.

### ch07-s07 · patience; the room returns · 6/10
MATERIAL
- 17.8 (`tick`): the payoff ("forty-two keeps its tick") is a ~25 px slip beside the lantern; the tick isn't legible.
  The direction asks for a slow push in to slip #42. Push until the slip and its two strokes fill a readable size.
MINOR
- 3.3 (`lend`): notebooks passing along the cords are specks. 13.8 (`whole`): the spine bands, pages riding down and
  the gate opening are not visible during the truck.
- The truck past the L6 lamp-post at 13.7 is nicely motivated; the restart flicker at 0.4 is subtle.

### ch08-s01 · the pin montage · 6/10
MATERIAL
- 2.9–4.8: the L6 lamp-post pole passes through the title "What Travels" (it crosses the word "Travels" at 4.46). This
  is text occluded by art in the chapter title. Keep the pole clear of the title, or move the title.
- 15.9–40 (more than half the shot): after the pan settles on the Well, the five closing images (the Tooth thunking a
  stale card, the bucket coming up, a lamplighter relighting a fenced house, the Scissors cutting after a seal, pages
  falling into the lantern's book) are tiny at wide framing, and no lamplighter figure is visible at
  `supervisor`. About 24 s of a wide town over a list-like narration doesn't teach. Fix: a rack/push into each vignette
  on its word, or stage them as inserts.
MINOR
- 15.9 →: the pin board stays clipped in the top-left corner for the rest of the shot. Either finish the pan off it
  or let it go.
- 9.9 (`broke`): the four emberRed flashes land well.

### ch08-s02 · the dated small print · 7/10
MATERIAL — none. At full resolution at local 30.0 the celld beat is clean: workerd's badge faded out, 'celld 0.6.3'
at B, the lamplighter at B, the rake and the roped Well.
MINOR
- 22.9 (`once`): the alarm bell's ghost double-ring isn't discernible.
- 17.6 (`notrun`): the switch staying OFF isn't visible.
- During the labGreen beat workerd's experimental pennant, alarm bell, test clipboard and C·9·9 Plate stay on screen.
  Only the badge swaps, so the celld beat is still dressed in workerd's props. Dim them with the badge.
- Each badge fade crosses ~0.5 s with a readable ghost (28.1, 32–34). That's acceptable, but tighten it.

### ch08-s03 · the two lamps once more · 7/10
MATERIAL — none. The quote is verbatim with its attribution (Ryan Dahl, commit aa494794). The figures are generic, at
their desks, with no gestures toward the town.
MINOR
- Bert Belder's empty, out-of-focus chair beside Ryan Dahl is not discernible on the sheet (the source mentions it);
  make it read as a chair.
- 18.5–27.2: on the paper model, "the keeper's hand stays at the house", the bell's ghost repeat and "every house
  closes its shutters" are not visible. At 26.2 several model windows are still lit after `quiet` (25.67).

### ch08-s04 · dawn payoff · 8/10
MATERIAL — none. A strong ending: gold lines trace from the slip down to the Well and up to the Plate, whose ghost tiles read
A·7·7 with the crown lit, then a pull back to the end card.
MINOR
- 7.3–11.3 (`slip`): the slip text '#42 · the ferry is late' and its tick are small inside the window; push one step
  closer so the returning ch01 image reads.
- The far-shore lamps "going out one by one" and the brightening sea aren't in frame (no sea visible).
- End card lines are small; verify ≥ 22 px cap at 1080p (the audit passed, but it looks close).
