# Durable Objects, Unbound: fix verification, round 2

Reviewer: Claude Opus 5.5, high effort, via Claude Code. Verdict data: `verdict.json`.

**Result: PASS. All eight routed fixes are verified in the refreshed `render/film.mp4`, with no new material regression in the sampled frames.**

## What this round is

This is a bounded check of the eight fixes, not a new review.

- **Scores:** the 8.56 mean and every dimension score are inherited unchanged from round 1, which scored the movie before these fixes. Nothing was re-scored, and sound and accuracy were not re-assessed.
- **Round 1:** its verdict and report are untouched and remain the historical record.
- **Coverage:** 67 frames cut from the refreshed movie at the eight locations. Four were viewed at full 1920 px and 12 at 960 px; the rest were in 480-640 px tiles.
- **"Before" evidence:** the round-1 record and its retained cuts, because the earlier movie was overwritten at the mux step.
- **Not assessed:** real-time viewing or judder, hearing or A/V sync by ear, native Safari playback, and any human sign-off.
- **Not re-inspected:** the rest of the film. I relied on the final-assembly report's segment-join checks and the director's audits of the eight shots.

## The eight fixes

| Shot | Samples (s) | Result | Seen in the movie |
|---|---|---|---|
| `ch01-s01` iris | 0.0-1.3 | Fixed | Starts black, opens from a point on A's window, open by 1.3 s |
| `ch03-s02` keeper and tag | 323-344 | Fixed | "Amazon S3" whole in all four samples |
| `ch03-s03` label | 374.5-380.5 | Fixed | Label sits under the date stamp, clear of the Plate |
| `ch05-s05` assumed zero | 806.9-809.6 | Fixed | Clock clear of every line; hand gives way to a clear dark brass 0 from 807.8 s |
| `ch07-s02` hosted relay | 1110.4-1117 | Fixed | Sea band with a waterline separates town and headland; tag clear of the ridge from 1110.8 s |
| `ch07-s06` final door frame | 1280.5-1282.6 | Fixed | Keeper, error slip, door and dark lantern whole at 1282.6 s |
| `ch08-s01` title and board | 1303.6-1309.7, 1326, 1335 | Fixed | Title clear of the board 1304.2-1306.2 s and gone by 1306.6 s; no board at 1326 s or 1335 s |
| `ch08-s04` slip and tick | 1416.7-1421 | Fixed | Tick on clear window light, away from the head; gold trace still starts at the slip |

## Remaining small limits (not routed)

None of these is a material regression, so none is routed.

- **`ch07-s02`:**
  - The tag is sharper and larger than the far plane it stands for.
  - It meets the right frame edge at low alpha while arriving (about 1110.4-1110.6 s) and leaving (about 1117 s).
  - The moon shows at frame left below the waterline's height for about 2 s during the camera moves, where the line has mostly faded.
- **`ch07-s06`:**
  - Lower-frame dark wall remains.
  - The upper window passes the top edge during the move at about 1280.5 s.
  - A hairline shows at the top edge at 1282.6 s.
- **`ch08-s01`:** title end and board edge touch at very low title alpha near 1306.4 s.
- **`ch08-s04`:** the slip's far-left end tucks behind the window frame, which reads as paper held at the frame.

## Format and listening

- **Format unchanged:** H.264 High, yuv420p, 1920x1080, 24 fps, 34,546 frames. AAC audio and video are both 1439.416667 s, with captions and 8 chapters. Only the file size changed, to 687,058,634 bytes, which the re-capture would explain.
- **Machine QA:** 40 pass, 6 warn, 0 fail, the same counts and warnings as round 1.
- **Human listening: pending, not signed.** All 11 entries in `voice/voice.json` are pending with no name, date or clip signature. That includes the 3 added line checks: L0312, L0519 and L0101.
