# Durable Objects, Unbound: final film review, round 1

Reviewer: fresh independent Claude Opus 5.5, high effort, via Claude Code. Verdict data: `verdict.json`.

**Result: PASS. Mean 8.56 against a bar of 8.5, every dimension at or above 8, no critical issues.**
Eight bounded shot fixes are routed. Apply ch07-s02 and ch05-s05 first.

| Dimension | Score |
|---|---|
| Accuracy | 9.0 |
| Depth | 9.0 |
| Clarity | 8.3 |
| Story and emotion | 8.6 |
| Visual artistry | 8.4 |
| Motion and sync | 8.4 |
| Sound (objective proxies) | 8.1 |
| Curiosity and novelty | 8.7 |

## What was and was not assessed

- **Sound:** assessed from the script, speech-to-text, waveforms, spectrograms and loudness and ducking measurements, not by hearing it.
- **Human pronunciation listening: pending, not signed.** This covers celld, workerd, Deno, SQLite, S3, epoch, Vogels and Litestream.
  - Also listen to L0312, where STT heard "the red and the right"; check "read" is said as "reed".
  - Also listen to L0519, where STT heard "Awakes".
  - Also listen to L0101, the first spoken line, at 199 wpm.
- **Motion:** judged from sampled frames and a 4 fps frame-difference measure. I did not watch the film in real time, so judder is unassessed.
- **My coverage:** about 350 frames cut from the current `render/film.mp4`, sampling all 42 shots, all 8 chapters, the end card, every corrected shot and each unresolved concern. Eight were viewed at full 1920 px and 16 at 960 px; the rest were in 480-640 px tiles.
- **Reused, not re-run or re-read:** the 42 current `qa/sheets` PNGs, the legibility, depth and cards audits, and the machine QA.
- **Not opened:** the `?film=` player in a browser. The dev route returned HTTP 200, and QA's manifest check and the library entry pass.

## Format

This is a genuine film.

- **Video:** H.264 High, yuv420p, 1920x1080, 24 fps, 34,546 frames.
- **Audio:** AAC, 48 kHz stereo, 1439.417 s, equal to the video.
- **Captions and chapters:** mov_text captions, 8 chapters.
- **Publishing:** format-3 `kind: film` manifest, timing `locked`; VHS library entry at `?film=durable-objects-unbound`.
- **Freshness:** no shot, set, engine or timeline file is newer than the render. Only `credits.json` is, and no shot imports it.
- **Machine QA:** 40 pass, 6 warn, 0 fail.

## Key measurements

| Measure | Result |
|---|---|
| Master loudness and true peak | -16.0 LUFS, -1.7 dBTP, LRA 3 |
| Lowest voice over music | 10.8 dB (L0423) |
| Duck under narration | 2.85 dB |
| Room-tone floor | -58 LUFS |
| Score ending (m08) | last strike 1431.66 s; fade 1435.42-1439.42 s |
| Ending level (momentary) | -17.3 LUFS at 1431 s, -21.5 at 1435, -22.7 at 1437, -32.5 at 1439 |
| Captions | 296 cues, median 14.2 cps, max 20.9 |

The score ends naturally, inside the film's last seconds, and the voice has room by the numbers.

## Rulings on the open concerns

- **Opening tick (ch01-s01): not a material problem. No change.** At 25.3 s the slip is about 115 x 48 px and high contrast, with the stroke landing on beat 25.18 s. It was still visible in a 640 px cut at 27 s and holds until about 29 s. The flight is small but carried by motion and the "#42" label.
- **B·8·7 to B·8·8 (ch05-s04): accurate. No change.** The click at 764.4 s gives B·8·7 with the crown dark, readable for about half a second. The from tile then flips and the crown lights by about 765.6 s, and B's lantern finishes lighting by 765.9 s, before "two rooms" at 767.8 s. This counterfactual does not contradict ch05-s06.
- **Hosted lamps (ch07-s02): a staging defect, not a scope error.** The stage report's "on the ridge" does not match the current render.
  - The lamps are on L1, on a separate headland, with their own tag and colour, and no town house is drawn as the relay.
  - No water is visible between that headland and the town, and the ridge clips the badge for about 1 s while Cloudflare is being named. One film-local fix is routed.
- **Camera speed, push-in softness, ch07-s04 railing:** no material harm in the sampled frames or the measure. The authors' wanted engine changes are not required.
- **QA warnings:** the suspect-paper warnings read as swap cards and the ribbon in the sampled frames, not blank cards. The two ink-bleed ghost-text transitions last about 0.4 s and are acceptable.

## Technical truth checks

All passed in the narration and sampled picture:

- Hosted Cloudflare, initial workerd, later workerd and celld 0.6.3 stay distinct.
- Storage assumptions and one-key atomicity are qualified. S3 runs no code, and coordination is moved inside the store, not eliminated.
- Claimed and opened epochs are kept apart, as are safety margins and the second look.
- WAL commit capture and proof before acknowledgement are shown in order, and the snapshot, gap and checksum limits are stated.
- celld's follower fsync, owner exclusion, bucket fallback and the mandatory seal-and-recover gate are all shown. Complete plus damaged recovers; incomplete plus damaged stays shut.
- No deal terms, benchmarks or exactly-once claims are invented, and the upstream tests are stated as read, not run.

Facts were checked against `claims.json`, `quotes.json` and the bible, not re-researched. The "Varda: celld's code and ideas" label traces to his verified quotation, Q11.

## Routed fixes

| Shot | Severity | Time (s) | Defect | Bounded fix |
|---|---|---|---|---|
| ch07-s02 | Major | 1110.4-1117 | No visible water; badge clipped by ridge | Raise headland, lamps and tag about 48 px, show a sea band, mark the tag legible |
| ch05-s05 | Major | 806.9-809.6 | Lines and clock hand obscure the assumed "0" | Move B's clock clear of the lines, park the hand, ink the zero dark brass |
| ch08-s01 | Minor | 1307.3-1309.7 | Pin board and first pin cross the title | Shorten the title to about 4.0 s |
| ch03-s03 | Minor | 373.9-380.7 | Label runs onto the Plate and A tile | Move this label clear of the Plate |
| ch03-s02 | Minor | 322-345 | Keeper hides the "3" in "Amazon S3" | Shift the keeper about 40 px or move the tag |
| ch07-s06 | Minor | 1280.5-1282.7 | Push clips the keeper and leaves a flat wall | Stop the push 15-20 % earlier and recentre |
| ch08-s04 | Minor | 1416.7-1421 | Tick butts against the sender's forehead and mullion | Move the slip about 35 px left |
| ch01-s01 | Minor | 0.0-1.3 | Screenplay's opening iris does not play | Draw a shot-local iris from black |

Re-render and re-check only these shots' ranges. Score, mix, clock, shared sets and engine do not need to change.
