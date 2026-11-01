# durable-objects-unbound — final assembly (2026-11-01)

Engineer: Claude Code, claude-opus-5-5, high effort, no delegation. This pass re-rendered the eight fixed shots into the
complete film and republished it. It generated no new research, story, narration or music, and did not re-mix. The
earlier reports are history and were not edited: `post-production.md`, `../reviews/round-1/review.md`, `verdict.json`
and `fix-resolution.md`. `render-report-round0.json` here is a copy of the first render's report.

**No grade is claimed for the current movie.** The round-1 pass (8.56, zero criticals) describes the movie before these
fixes. Root owns the narrow review of the eight fixes.

## Inputs unchanged

| input | value | check |
|---|---|---|
| `narration/timeline.json` and app copy | sha256 `2482f4b2…253c` | equal to the post-production report and the invalidation report |
| `score/cues.json` | sha256 `39a58b1a…8812` | equal to the post-production report |
| `story/script.json` | md5 `e4b86fa3…` | equal to the post-production report |
| `story/meta.json` | md5 `d9b78c69…` | equal to the post-production report |
| narration takes | 203 lines | QA `narration.coverage`, `narration.stt` and `timeline.fresh` pass |
| `mix/master.wav` | unchanged since 01:08 local | not re-mixed |

## Changed shots and invalidated segments

`.orly-work/durable-film-final-invalidation.json` covers all eight changed shots, and each module's sha256 matches it.
Apart from these eight shots, the only file newer than the retained segments in the film's source folder, the engine
folder or the renderer is `credits.json`, which no shot imports.

| shot | frames invalidated for | guard sha |
|---|---|---|
| ch01-s01 | 0–718 | c918848f8e07 |
| ch03-s02 | 7396–8353 | 240f13ada8cb |
| ch03-s03 | 8351–9351 | eb59cb41c90f |
| ch05-s05 | 19233–19821 | 1fe491d497b1 |
| ch07-s02 | 26339–26975 | 7c6b944238a4 |
| ch07-s06 | 29952–30786 | 372adc849794 |
| ch08-s01 | 31257–32242 | 0c8e98229c45 |
| ch08-s04 | 33808–34546 | 0daec63be4fe |

The 20 segments re-captured, as frame ranges (9,586 frames in all):
- 0–960
- 7200–9600
- 19200–20160
- 25920–27360
- 29760–32640
- 33600–34546

As a cross-check, I widened each transition edge of a changed shot to a full 1.5 s, past the longest transition (1.4 s).
No retained segment overlaps. This was done by hand, because the first scripted attempt used a 0 s margin (the timeline
stores the transition as a name, not a duration). The scripted run confirms only the invalidation ranges.

## Render

```
FILM_DEV_URL=http://127.0.0.1:5216 node generator/film/render.mjs --slug durable-objects-unbound --dev --workers 3 --crf 20 --resume
```

Result: 72 segments, **52 reused, 20 re-captured**, 171.6 s wall time, no page errors. All renderer checks are true:
frames, fullLength, size, fps, av, chapters. Log: `render-run2.log`.

The prior master was not kept side by side. Its replacement was written over `render/film.mp4` at the mux step, because
keeping both needed about 1.37 GB and about 1.0 GiB was free. The old file stayed intact through segment capture and
concat. The segment cache is kept.

## ffprobe of `films/durable-objects-unbound/render/film.mp4`

- **Video:** H.264 High, yuv420p, 1920×1080, 24/1, 34,546 packets counted (equal to round(1439.4167 × 24)).
- **Audio:** AAC LC. Audio and video are both 1439.416667 s.
- **Captions:** mov_text, language eng. `film.vtt` has 296 cues and is byte-identical to the published copy.
- **Chapters:** 8, with titles, on the timeline boundaries.
- **Size:** 687,058,634 bytes (687.1 MB). It stays outside `public/` and carries no Workers asset.

## Evidence for the eight shots

Reused from the director, not repeated: typecheck, sheets, depth, legibility and cards (see `fix-resolution.md`).

I cut frames from the rendered movie at the review's check times and read them. Each fix is present:

| shot | movie time | seen in the rendered frame |
|---|---|---|
| ch01-s01 | 0.5 s, 1.2 s | iris opening from black on A's window, then open |
| ch03-s02 | 330 s | "Amazon S3" whole, keepers either side |
| ch03-s03 | 376 s | label right-aligned under the date stamp, clear of the Plate |
| ch05-s05 | 807.8 s, 808.5 s | zero in dark brass on B's clock, clear of the lines, hand gone |
| ch07-s02 | 1111 s, 1114 s | "Cloudflare, hosted" whole above the ridge; sea band showing |
| ch07-s06 | 1282.6 s | keeper, door and dark lantern whole |
| ch08-s01 | 1306.47 s, 1326 s | title gone as the board crosses; board absent at the close-up |
| ch08-s04 | 1418 s | slip and tick on clear window light, away from the head |

I also compared frames either side of some segment joins, at 479/480, 9599/9600, 19679/19680 and 34079/34080, plus
frames 8351 and 34545. They are continuous, with no regression. This is a sample of frames, not a watch of the whole
film, and nothing here tests picture and sound together by ear.

Limits already recorded in `fix-resolution.md` remain, including ch07-s06's large area of dark wall in the end frame and
the far-left end of the ch08-s04 slip tucking behind the window frame.

## Publish

```
node generator/film/publish.mjs --slug durable-objects-unbound
node .orly-work/durable-post/fix-credits.mjs
```

- `public/generated/durable-objects-unbound/manifest.json`: format 3, kind `film`, timing `locked`, runtime 1439.4167.
- Stems reused (0 encoded, 203 lines and 8 cues). All 8 chapter audio files are byte-identical to before.
- Chapter thumbnails were re-cut from the new movie.
- `sources/`: the sources page was regenerated with the "a lab in this story" phrase corrected.
- `credits.json` (public and app copies): corrected the same way, keeping "made by Anthropic".
- `public/generated/library.json`: 182 entries with the film at `?film=durable-objects-unbound`. The other 181 are
  unchanged.
- No file in the published folder is over 25 MiB; the folder is 80 MB.

**Chapter-4 blurb (published manifest only).** It now reads the exact L0404 line: "celld runs a Workers application on
machines you own: Durable Objects, self-hosted and distributed, with long-term state in a bucket." The script checks that
text against `story/script.json` before applying it. A comparison before and after the script shows that blurb is the
only manifest change. No locked file changed, so the old wording is still in `story/chapters/ch04.json`,
`story/script.json` and `story/script.md`.

**Limit:** `fix-credits.mjs` lives in the gitignored `.orly-work/`. A publish run from a fresh checkout, or anywhere
without this file, restores both the false Anthropic phrase and the old blurb. Those outputs are correct only if the
script is run after publish.

## Machine QA (run once, after publish)

`node generator/film/qa.mjs --slug durable-objects-unbound`: **40 pass · 6 warn · 0 fail · 0 skip**
(`latest.json`, `qa-final-assembly-console.log`). The warnings are open, not resolved:

- `narration.listening`: see below.
- `narration.pacing`: 163 wpm overall. The fastest line is L0101 at 199 wpm, under the 200 wpm fail threshold.
- `narration.wordMap`: 4 lines anchor on their spoken words.
- `mix.lineLevels`: L0423 sits 1.87 dB under its target. The eight −2 dB lines are intended hints.
- `sheets.cards`: suspect unprobed paper in ch06-s01, ch06-s03 and ch03-s03.
- `sheets.ghostText`: no ghost text, but text fades over the other shot's picture for about 0.42 s in two transitions
  (ch02-s04, ch08-s03).

## Human listening: still pending, nothing signed

Nobody has listened to these for sign-off. All 11 entries in `voice/voice.json` `listening[]` are pending, with `by`,
`at` and `clipSig` empty:

- **8 terms:** celld, workerd, Deno, SQLite, S3, epoch, Vogels, Litestream.
- **3 added line checks:** L0312 "read (noun)", L0519 "A wakes", L0101 "opening line".

## Disk

About 995 MiB was free when publish finished. `render/film.mp4` and `render/segments/` are both kept.
