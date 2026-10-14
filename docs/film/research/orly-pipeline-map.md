# orly book pipeline, mapped end to end (the base for the orly-2 film pipeline)

Source read: `/Users/blamy/Documents/Codex/orly` at `51ee450`. The orly-2 fork has
the same files: `cmp` shows `generator/export-mp4.mjs`, `generator/video.mjs`,
`player/ChapterPlayer.tsx` and `player/narration-timing.ts` are byte-identical.
Every claim below cites file:line in the orly repo. Probes are in
`/Users/blamy/Documents/Codex/orly-2/.orly-work/probes/pipeline-map/`.

---

## 0. The v3 pipeline in one picture

```
Astra plan (markdown)  ->  Fable authors apps/bookshelf/src/viz/books/<slug>/chapter-<n>.tsx
                            (vizScene(): {tl}, Render({s}); captions = narration script)
        |
        v
generator/video.mjs --slug --title ...
  1 discoverChapters()        video.mjs:67-76    finds chapter-<n>.tsx files
  2 extractScene()            scene-captions.mjs:26-61  esbuild bundles the TSX in Node, calls vizScene(), reads tl.describe().captions
  3 speakability gate         video.mjs:79-93,131-145   rejects acronyms/camelCase/code in captions
  4 synthesizeChapter()       tts.mjs:101-138    one ElevenLabs convertWithTimestamps call per chapter, lines joined with '\n\n'
       cues = start second of each caption's first word   tts.mjs:58-99
       trim the MP3 to audioEnd+0.2 s   video.mjs:169-177 ; fail if any cue is approximate   video.mjs:183-188
  5 cover: gpt-image-1 + vision QA -> animal.png -> 512px animal.webp   video.mjs:218-247, cover.mjs:64-130
  6 write manifest.json (format 3)   video.mjs:251-260
  7 upsert library.json              video.mjs:269-281 -> library.mjs:21-41
        |
        v
npm run build -> node generator/verify-book.mjs --slug   (headless gate, writes previews/chapter-<n>.png)
node generator/blog-viz.mjs --slug                        (optional companion post check)
node generator/export-mp4.mjs --slug --out                (optional MP4, realtime screen recording)
git commit + push -> deploy.yml -> wrangler deploy (static assets from dist/)
```

The runtime is `?bundle=<slug>`. `App.tsx:50-56` routes desktop to `BookPlayer`.
On mobile, `App.tsx:62-63` hands it to `Library`/`MobileShelf`, which pushes
`BookPlayer` as a screen. `BookPlayer` fetches `generated/<slug>/manifest.json`
(`BookPlayer.tsx:220-234`) and mounts one `ChapterPlayer` per chapter, keyed so
each chapter fully remounts (`BookPlayer.tsx:360-371`). `ChapterPlayer` lazy-loads
the scene chunk from `VIZ_SCENES[chapter.scene]` (`ChapterPlayer.tsx:118-133`;
the registry glob is at `viz/scenes.ts:66-73`). It retimes the timeline to the
narration (`ChapterPlayer.tsx:145-148`) and plays it with the `<audio>` element
as the clock (`ChapterPlayer.tsx:151`, `engine/core/playback.ts:80-93`).

Legacy and secondary paths:
- `cli.mjs` is DEPRECATED. It is the v2 storyboard/D3 flow (`cli.mjs:1-5`), and
  `transform.mjs` and `regen-chapter.mjs` belong to it.
- `regen-chapter.mjs` reads `storyboard.json` (`regen-chapter.mjs:30`), so it
  cannot rebuild a v3 chapter.
- `transform.mjs` emits the old step/node/edge manifest (`transform.mjs:13-56`),
  which the v3 player rejects (`BookPlayer.tsx:226`).
- `validate.mjs` (`relayout`/`validateStoryboard`, `validate.mjs:62,162`) is the
  v2 layered-layout validator. v3 books do not use it.
- `viz-narrate.mjs` publishes narration for a single Storybook (Motion Studio)
  scene into `public/viz-audio/`. It is the same idea as `video.mjs` step 4.

---

## 1. The manifest format-3 schema (every field)

A survey of all 149 manifests on disk: every one is format 3. Top-level key
counts are format/slug/title/accent/chapters 149, animal 147, subtitle 101,
paper 22, series 4, plus 1 to 2 old flat paper keys. Every one of the 672
chapters has exactly
`{number,title,blurb,scene,audio,cues,duration}`.

### Written by `video.mjs:251-259` and typed by `BookPlayer.tsx:12-34`

```ts
interface ManifestV3 {
  format: 3;                 // BookPlayer.tsx:226 throws on anything else; export-mp4.mjs:174, verify-book.mjs:52, blog-viz.mjs:39 check it too
  slug: string;              // == directory name under public/generated/
  title: string;             // book title (player top bar, analytics)
  subtitle?: string;         // only when --subtitle is passed (video.mjs:255)
  animal?: string;           // 'animal.webp', RELATIVE TO THE BOOK DIR (video.mjs:256); always written even if no cover exists
  accent?: string;           // '#rrggbb' (colorForSlug fallback, library.mjs:15-19). NOTE the player ignores it: BookPlayer.tsx:353 uses the Settings video accent
  chapters: ChapterV3[];
  // Extra fields written by agents, NOT by video.mjs, and ignored by the player:
  series?: string;           // e.g. "Daily Papers by Hugging Face" (the shelf groups by library.json, not by this)
  paper?: { title, authors[], publishedDate, selectedForDate, stableId, arxivBaseId, doi,
            huggingFaceUrl, dailyRankingUrl, canonicalUrl, pdfUrl, officialCodeUrl,
            officialCodeCommit, popularityEvidence };   // provenance only; no consumer in apps/ or generator/
}
interface ChapterV3 {
  number: number;            // 1-based; also the ?chapter=N deep link (BookPlayer.tsx:101-107) and previews/chapter-N.png (BookPlayer.tsx:516)
  title: string;             // --chapter-titles, else the scene's leading // comment, else the first caption (video.mjs:96-104)
  blurb?: string;            // --blurbs, else the first caption text (video.mjs:156)
  scene: string;             // 'books/<slug>/chapter-<n>' = key into VIZ_SCENES (scenes.ts:70-73)
  audio?: string;            // 'audio/chapter-<n>.mp3', relative to the book dir (ChapterPlayer.tsx:114). Absent with --no-tts unless --silent-audio
  cues?: number[];           // one per caption, in the MP3's seconds (3 decimals): when the first word of caption i starts. Index-paired with captions!
  duration?: number;         // aligned end of narration (s). Authoritative end and seek max (ChapterPlayer.tsx:203-220, 274)
}
```

Real examples:
- `explained-neural-nets`: 5 chapters, 12 to 14 cues each, 97 to 113 s per
  chapter. The MP3s are mono, 44.1 kHz, 128 kbps (`ffprobe` on
  `audio/chapter-1.mp3`: duration 111.36 s, bit_rate 128089, channels 1).
- `deepseek-v41-kv-cache` (one of the newest): 4 chapters, 10 cues each,
  60 to 82 s, plus `series` and `paper{...}`.

### `public/generated/library.json` entry (`{ books: BookMeta[] }`, sorted newest-first by `createdAt`, `library.mjs:35`)

Writers: `video.mjs:269-281` and `library.mjs:21-41`. The type is at
`library/cover.ts:6-20`.

```ts
interface BookMeta {
  slug: string; title: string; subtitle: string;      // subtitle '' when absent
  author: string; role: string;                       // defaults 'Brett Lamy' / 'Software Engineer at Replay' (video.mjs:34-35)
  color: string;                                      // = manifest accent
  animal?: string;                                    // 'generated/<slug>/animal.webp' RELATIVE TO SITE BASE (differs from manifest.animal!)
  href: string;                                       // '?bundle=<slug>'
  series?: string; seriesOrder?: number;              // seriesOrder deleted for chronological series (library.mjs:29-31)
  chapters?: { number?: number; title: string; duration?: number }[];
  createdAt?: string;                                 // ISO; ordering + "Recently Added"
  hidden?: boolean;                                   // typed (cover.ts:19) but unused in data
}
```
Counts across 148 entries: slug/title/subtitle/author/role/color/href/chapters/createdAt
148, animal 124, series 123, seriesOrder 88. There is no `kind` field anywhere.
Adding one is safe: unknown fields are ignored and the only format gate is
`format === 3`.

Other per-book files: `animal.png` (gitignored, `.gitignore:17`), `animal.webp`,
`audio/chapter-N.mp3`, `previews/chapter-N.png` (written by verify-book, used
as sidebar thumbs), `blog.md` (optional) and `blog/`.

---

## 2. How narration cues drive scene playback: yes, a piecewise-linear time warp

There are two clocks:
1. **Authored clock.** Scene keyframes and `tl.caption({at})` times as Fable
   wrote them.
2. **Narration clock.** `audio.currentTime` of the chapter MP3.

The audio is THE clock. In `usePlayback`, when `useAudioClock` is set, every
rAF tick does `next = a.currentTime` (`engine/core/playback.ts:80-93`). The
scene is then `timeline.sample(t)` on that value (`playback.ts:125`). The
fallback with no audio is a rAF delta accumulator (`playback.ts:93-104`) plus
Web Speech TTS (`ChapterPlayer.tsx:172-176`, `speech.ts:69-118`).

The warp happens in `ChapterPlayer.tsx:145-148`:
`retimeTimelineToNarration(built.tl, chapter.cues, chapter.duration)`.
`narration-timing.ts` does the work:
- `createNarrationTimeMap` (`:19-70`) builds anchor pairs
  `source=[0, captions[i].at..., sourceDuration]` and
  `playback=[0, cues[i]..., playbackDuration]` (`:24-52`). A pair is skipped
  if either side is non-increasing or non-finite (`:30-37`). Between anchors
  it interpolates linearly (`:54-62`), and the inverse is `toSource`.
- `retimeTimelineToNarration` (`:73-100`) rewrites the timeline IN PLACE:
  - every keyframe gets `at' = map(at)` and
    `dur' = max(min(dur, 0.25), map(at+dur) - at')` (`:81-90`);
  - every caption gets `dur' = max(0.5, ...)` (`:93-97`), applied through
    `Timeline.updateKeyframe/updateCaption` (`engine/core/timeline.ts:211-231`).
- `sourceDuration = max(tl.duration, ...)` and
  `playbackDuration = max(manifest.duration, ...)`. The whole tail after the
  last caption is therefore stretched or squeezed to the narration end.
- The timeline instance lives in module scope ("build once",
  `scenes.ts:25-27`). Re-entering a chapter retimes an already-retimed
  timeline. That is an identity map, so it is harmless when captions are in
  order.
- The blog reuses the same map in reverse: `BlogPanel.tsx:248-250` maps manifest
  cue windows back to authored time.

Measured behaviours of the warp (`order-probe.ts`; the output is in the
summary):
- **Identity when authored == cues.** `[0, 3.3, 7, 11] -> [0, 3.3, 7, 11]`.
  So a film scene authored on the final, locked audio clock passes through
  untouched.
- **Music-sync drift.** A cut authored at 10 s, halfway between captions at
  0 s and 20 s, lands at 13.00 s when the cues are `[0, 26]`. Anything synced
  to the SCORE (downbeats, stingers) that is not itself a caption is linearly
  interpolated between narration anchors, so it drifts off the beat.
- **Ordering bug.** `scene-captions.mjs:54-56` SORTS captions by `at` before
  TTS, but `createNarrationTimeMap` pairs `cues[i]` with
  `timeline.describe().captions[i]`, which is in INSERTION order
  (`timeline.ts:196-209`). A scene that declares captions out of time order
  gets a broken map. Measured: authored 20 s maps to 0.50 s, and the second
  anchor is dropped.
- **Cost.** A 30-minute single timeline (20k keyframes, 400 captions) retimes
  in 261 ms and fires 20,400 subscriber notifications (one `bump()` and one
  re-sort per keyframe, `timeline.ts:211-222`). Fine per 3-minute chapter;
  wasteful for one film-length timeline.

Other playback facts:
- `seek` clamps to `timeline.duration` (`playback.ts:50-56`).
- `sample()` clamps to `[0, duration]` (`timeline.ts:313`).
- The end of a chapter is `audio.currentTime >= manifest.duration`, read on
  `timeupdate` (about 4 Hz), so up to about 250 ms of latency
  (`ChapterPlayer.tsx:203-220`). This guards against TTS junk tails.
- Captions: only the newest active caption shows (`ChapterPlayer.tsx:168-169`).
  CC is on by default and sticky in localStorage `orly-cc` (`:96-109`). The
  fade envelope is 0.35 s (`timeline.ts:92`).

---

## 3. How captions are extracted from TSX scenes (`generator/scene-captions.mjs`)

- **Yes, it bundles with esbuild, not Vite** (`scene-captions.mjs:31-44`). The
  settings are: `bundle:true`, `format:'esm'`, `platform:'node'`,
  `jsx:'automatic'`, loaders `{'.css':'empty', '.svg':'dataurl', '.png':'dataurl'}`,
  `nodePaths:[<repo>/node_modules]`, and
  `define:{'import.meta.env':'{}'}`. It writes a temp `.mjs`, `import()`s it in
  Node, then deletes the temp dir.
- **Contract a scene must meet:**
  1. Export `vizScene()` (or `buildScene()`) returning `{ tl }` where
     `tl.describe` exists (`:46-53`). It also needs `Render({s})` for the
     player (`scenes.ts:33-39`).
  2. The module must be importable in Node: no DOM access at module scope, no
     `import.meta.glob`, no `import.meta.env.X` beyond `{}`, and no asset
     types other than css/svg/png. JSON (`overrides.json`) works natively.
  3. Building the timeline must be deterministic and pure. The captions come
     out of `tl.describe().captions`, mapped to `{id, at, dur, text}` and
     sorted by `at` (`:54-56`). The `tex` field is DROPPED.
  4. `leadingComment` is the first non-empty `//` line of the file, used as a
     chapter-title hint (`:64-77`, `video.mjs:96-104`).
- The caption list is the narration script. If it is empty, `video.mjs` fails
  (`:133`). Each caption text goes through `sanitizeSpoken` (`tts.mjs:14-30`;
  em-dash becomes a comma, curly quotes and ellipsis are normalized, "rrweb"
  becomes "r r web"). It then must pass `speakabilityProblems`
  (`video.mjs:79-93`).

**Film blocker found.** The speakability gate rejects the core vocabulary of
the pilot. Measured with the same regexes:
- "AlexNet", "ImageNet", "OpenAI", "ChatGPT", "LeCun", "DeepMind" and "AlphaGo"
  are flagged as camelCase.
- "DARPA", "MIT", "GTX", "US" and "GPT" are flagged as unspoken acronyms. Only
  QA/AI/OK/URL/A/I/TV/CEO/PR/CI/GPS are allowed (`video.mjs:79`).
- "GPT-3" is flagged as a machine id.

A film needs a per-film pronunciation lexicon (spoken form separate from the
displayed caption) instead of this hard gate. The only pronunciation hook
today is the hard-coded rrweb rewrite (`tts.mjs:18`, mirrored in
`viz/engine/narrator` `speechify`; see `generator/pronunciation.test.mjs`).

Narration request details:
- `synthesizeChapter` (`tts.mjs:101-138`) sends `{ text, modelId }` only.
  `modelId` defaults to `eleven_multilingual_v2` (`:105`).
- It sends NO `voice_settings` (stability, similarity, style, speed), NO
  `previous_text`/`next_text`, NO seed and NO output format. You get the API
  default MP3 (observed: 44.1 kHz mono 128 kbps).
- The whole chapter is one request, so the script length is bounded by the
  per-request character limit.
- Cues come from matching the first 24 alphanumerics of each line forward
  through the character alignment (`tts.mjs:58-99`). Unmatched lines are
  interpolated, and `video.mjs` makes that a hard failure (`:183-188`).
- The default voice is `Fahco4VZzobUeiPqni1S` (`video.mjs:33`, also hard-coded
  in `regen-chapter.mjs:20`).
- The post-TTS trim calls `ffmpeg` from PATH and silently skips if it is missing
  (`video.mjs:169-177`).

---

## 4. export-mp4.mjs: approach and limits for a 30-minute film

**Approach** (`export-mp4.mjs`):
1. It needs `dist/` and builds if it is missing (`:176-179`). It serves `dist/`
   with `npx vite preview` on a free port (`:185-193`).
2. Per chapter it opens a NEW Playwright context with
   `recordVideo:{size:1280x720}` and a 1280x720 viewport (`:80-85`). It
   injects CSS that hides the player chrome but KEEPS the caption pills (they
   are burned in, `:72-78`), then navigates to `?bundle=<slug>&chapter=N`
   (`:101`).
3. It mutes the `<audio>`, which is still the clock. It records `startWall`
   when `currentTime` first advances (back-dated, `:121-124`) and waits for
   `ended`/duration (`:129-133`).
4. It trims the webm by anchoring on the END of the file:
   `trimStart = webmDur - (closeWall - startWall)` (`:139-151`). Playwright
   does not expose the recording start time.
5. It encodes with
   `ffmpeg -ss trim -i webm -i chapter.mp3 -t duration -vf scale=1280:720,fps=30 libx264 crf18 + aac 192k -shortest`
   (`:154-167`). Then it concatenates all chapter MP4s with
   `-f concat -c copy` (`:216-222`).
6. `W=1280, H=720, FPS=30` are hard-coded constants (`:22-24`). There are no CLI
   flags for them.

**What Playwright's recorder actually does** (playwright-core 1.63,
`node_modules/playwright-core/lib/coreBundle.js:37040,37095`):
- It takes CDP screencast JPEG frames stamped with wall-clock swap time.
- It pipes them through ffmpeg as
  `-r 25 -c:v vp8 -qmin 0 -qmax 50 -crf 8 -deadline realtime -speed 8 -b:v 1M`.
  The frame rate is FIXED at 25 fps, and the codec is a realtime VP8 at about
  1 Mbps.

**Measured** (`record-probe.mjs`, `barcode-probe.mjs`, `heavy-probe.mjs`,
`det-probe.mjs`):

| probe | result |
|---|---|
| Real chapter (`explained-neural-nets` ch1), 720p, 20 s | webm is VP8, `r_frame_rate 25/1`, 553 frames, **0.50 Mbps**; in-page rAF 120 Hz, audio clock smooth |
| Same at 1080p, 15 s | VP8 1920x1080, 25 fps, 426 frames |
| Synthetic barcode (page paints its own ms clock), light canvas, 1080p and 720p | 25 fps, 0 duplicates in 10 s; frame deltas p05/p50/p95 = 33/41-42/42-43 ms, i.e. **±7 ms jitter** (quantized to the 120 Hz rAF grid) |
| Barcode with a **heavy SVG scene** (8 full-frame feGaussianBlur ellipses + feTurbulence displacement, the "haze" look), 1080p | page renders about 20 fps (p50 delta 50 ms); **37 of 222 recorded frames (17%) are duplicate page instants**; jitter p95 40 ms |
| **Deterministic alternative**: set t = n/30, `page.screenshot`, pipe to `ffmpeg image2pipe -> libx264`, same heavy scene, 1080p | decoded timestamps exactly 0,33,67,100,... ms, **0 duplicates**; **13.8 frames/s** with JPEG q95 (a 30-min film at 30 fps is about 65 min on one worker); 5.0 frames/s with PNG (about 180 min) |

**Limits for a 30-minute film:**
1. **Not frame-exact.** Capture is fixed at 25 fps on wall-clock time. The
   `fps=30` filter then duplicates every 5th frame (judder on slow pans). Under
   cinematic SVG filters the page itself falls below 25 fps and frames are
   duplicated or dropped (measured 17%). 24/30/60 fps output is impossible
   without duplication.
2. **Quality ceiling.** JPEG goes into realtime VP8 at about 0.5 to 1 Mbps,
   then into x264. The 1080p cap gets about 1 Mbps for a whole frame of soft
   gradients and haze, the worst case for banding and blocking. That is
   generation loss before the CRF-18 encode.
3. **Realtime only.** Recording takes at least the runtime per chapter (30+ min
   plus encode). Each chapter is recorded in a single take, so any GC or
   compositor hiccup is baked in. There is no parallelism.
4. **Sync anchored to the end of the file.** The webm start time is inferred
   (`:146-151`). The error equals the latency between the `closeWall` evaluate
   and the real last frame. It is unmeasured, but it is not frame-locked.
5. **Burned-in captions and no subtitle track.** CLEAN_CSS keeps
   `.captions-pill` (`:72-78`). No SRT/VTT is emitted.
6. **Chapter seams.** Each chapter's audio is a separately encoded AAC,
   concatenated with `-c copy`. AAC priming and padding per segment risk small
   gaps or clicks at every boundary. That matters once a continuous score runs
   under the narration. Each chapter is also a separate page load, so there are
   no cross-chapter transitions.
7. **Hard-coded 1280x720 at 30 fps** (`:22-24`), and the stage is the
   responsive player layout.
8. **Environment in orly-2.** Playwright 1.63 wants
   `chromium_headless_shell-1243`, which is not in `~/Library/Caches/ms-playwright`
   (only 1148/1228/1234 are). Run
   `npx playwright install chromium chromium-headless-shell` or pass
   `executablePath` (the probes use
   `.../chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`).
   orly-2 also has no `dist/` yet.

**Conclusion.** `sample(t)` is pure (`timeline.ts:311-362`), so the film master
should come from a **deterministic frame-stepping renderer**: for each frame
`n`, set `t = n/fps`, render with React flushSync and wait for any
`CanvasLayer` `useLayoutEffect` to finish, take a screenshot (or CDP
`HeadlessExperimental.beginFrame`), and pipe to ffmpeg. Shard chapters or
segments across N browser workers. Mux once against the lossless master mix
(one AAC encode, no concat of AAC segments). Write SRT/VTT from cues. Today
there is no render entry that exposes `seek(t)` without the rAF loop. The
player's `usePlayback` is rAF/audio driven (`playback.ts:75-113`), so a
`?render=1` route (or a standalone render page) that mounts `Stage` +
`Render({s: tl.sample(t)})` and exposes `window.__renderFrame(t)` is the
missing piece.

---

## 5. Can a 30-minute film (about 10 chapters, narration plus a continuous score) also play on the shelf?

**Yes. Model it as a format-3 book with `kind: "film"`, where each chapter's
`audio` is a slice of one continuous narration+music master mix.** Almost
everything carries over. These are the specifics:

### 5a. Why slices, not one file
Cloudflare Workers static assets cap each file at 25 MiB (`wrangler.jsonc`
deploys `./dist` as static assets). The largest file under
`public/generated` today is under 5 MB. Sizes at different bitrates:

| bitrate | 30-min file | fits under 25 MiB? |
|---|---|---|
| 128 kbps | 28.8 MB | no |
| 96 kbps | 21.6 MB | yes |
| 96 kbps, 40-min film | 28.8 MB | no |

Per-chapter slices of about 3 min at 160 kbps AAC stereo are about 3.6 MB. They
work with offline download (`offline/downloads.ts:71-73` collects `ch.audio`),
service-worker caching and the existing ChapterV3 contract unchanged. Slice
each one from the LOSSLESS master (WAV), not from a compressed master:
`ffmpeg -i film-mix.wav -ss S -to E -c:a aac -b:a 160k audio/chapter-N.m4a`.
Keep `.mp3` if Safari or old clients matter. `<audio>` plays both.

### 5b. Timing model for a film (lock the edit)
Narration and score come FIRST. The narration is synthesized per chapter or per
line and placed on a global film timeline, music is composed to that timeline,
and then scenes are authored on the locked clock. Then:
- `chapter.cues[i]` is the global start of line i minus the chapter slice start.
- `chapter.duration` is the slice length.
- Scene captions are authored at exactly those times. The retime is then the
  identity (proven in §2), and music-synced keyframes stay on the beat.

Add an explicit `timing: "locked"` flag so the player SKIPS
`retimeTimelineToNarration`. That avoids both the drift and the index-pairing
bug. It also allows music-only stretches with no caption anchors.

### 5c. Proposed backward-compatible manifest extension
```jsonc
{
  "format": 3, "kind": "film",              // old players ignore kind
  "slug": "...", "title": "...", "subtitle": "...", "animal": "animal.webp", "accent": "#...",
  "film": {
    "runtime": 1834.2,                       // sum of chapter durations
    "fps": 30, "width": 1920, "height": 1080,
    "timing": "locked",                      // authored clock == audio clock; skip retime
    "master": { "mp4": "<external URL; too big for Workers assets>", "subtitles": "film.vtt" },
    "voice": { "provider": "elevenlabs", "voiceId": "...", "modelId": "...", "settings": {} },
    "score": { "tool": "strudel", "source": "score/*.strudel" },
    "loudness": { "integratedLufs": -16, "truePeakDb": -1 }
  },
  "chapters": [{
    "number": 1, "title": "...", "blurb": "...", "scene": "books/<slug>/chapter-1",
    "audio": "audio/chapter-1.m4a",         // slice of the master mix (narration + score)
    "cues": [ ... ],                         // relative to the slice
    "duration": 182.4,
    "filmStart": 0.0,                        // global offset (for a film-wide scrubber + SRT)
    "handles": { "pre": 0.0, "post": 0.5 }   // optional overlap for gapless handoff
  }]
}
```
In `library.json`, add `kind: "film"` (and optionally `runtime`) to the
`BookMeta` entry. The `href` stays `?bundle=<slug>`.

### 5d. Player changes needed
1. **Types.** `ManifestV3.kind?`, `film?`, `ChapterV3.filmStart?`,
   `timing?` in `BookPlayer.tsx:12-34`, and `BookMeta.kind?` in
   `library/cover.ts:6-20`.
2. **Skip the warp when locked.** Guard `ChapterPlayer.tsx:145-148`:
   `if (timing === 'locked') return;`. Fixing the ordering bug for books too
   means sorting `describe().captions` by `at` in `narration-timing.ts:24`.
3. **Continuous playback.** Film mode drops the "Up next" card and the 5 s
   countdown (`ChapterPlayer.tsx:227-236, 312-337`). It needs:
   - end detection at `duration` with rAF precision instead of about 4 Hz
     `timeupdate` (`:203-220`);
   - next chapter's scene chunk (`VIZ_SCENES[next.scene]()`) and audio
     prefetched about 10 s before the end;
   - no full remount gap. Today the `key` at `BookPlayer.tsx:361` remounts and
     reloads audio.

   For truly gapless music across chapter seams, use a small Web Audio
   scheduler that decodes the current and next slice and starts them
   sample-accurately with `AudioBufferSourceNode.start(when)`, with handles
   trimmed. The simpler fallback is to place chapter seams at musical rests so
   an HTMLAudio cut of about 50 to 250 ms is inaudible.
4. **Film-wide scrubber and time.** Total = sum of durations. Seeking maps to
   (chapter, local t) and switches chapter as needed. Keep `?chapter=N`. Add
   `?t=` for a global position (fits beside `?ep=`, `BookPlayer.tsx:110-116`).
5. **Caption styling.** A film subtitle style (serif, lower third) instead of
   the pill (`ChapterPlayer.tsx:16-33`). Default CC can stay on, but the
   `orly-cc` key is shared with books.
6. **Shelf.** Show a film badge and runtime on the cover or row. Possibly add a
   "Films" shelf group (Library groups by `series`, `Library.tsx:292-294`).
7. **verify-book.** At the midpoint it requires a caption element
   (`verify-book.mjs:215-218`), but `.captions` only renders while a caption is
   active (`ChapterPlayer.tsx:302-306`). A music-only midpoint would FAIL. For
   films, sample at a caption-bearing time or accept a music-only span. It also
   uses the fixed port 5199 (`:25`).
8. **Narration fallback.** Speech fallback (`ChapterPlayer.tsx:172`) is
   irrelevant for films, which always ship audio.

---

## 6. Reuse points and gaps

### Reuse as-is
| What | Where | Use in film pipeline |
|---|---|---|
| Pure timeline (`channel/tween/set/caption/hold/sample/describe/exportNarration`) | `engine/core/timeline.ts:107-363` | Shot and scene timelines; deterministic frame sampling |
| Stage 1280x720 viewBox and Camera transform | `engine/core/stage.tsx:3-48` | Vector stage scales to 1080p and 4K; the camera is the base of multiplane parallax |
| CanvasLayer (2x supersampled canvas in a foreignObject) | `engine/core/canvas-layer.tsx:13-50` | Particles and haze grain; note it uses `useLayoutEffect`, so the renderer must wait for commit |
| Scene registry glob | `viz/scenes.ts:66-73` | Film chapters under `viz/books/<film-slug>/chapter-N.tsx` register with no edits (`films/` would need a second glob) |
| Caption extraction (esbuild in Node) | `generator/scene-captions.mjs:26-61` | Pull the script and timing out of TSX for checks; also usable to bundle scenes for a Node-side renderer |
| ElevenLabs with timestamps and alignment-to-cue matching | `generator/tts.mjs:58-138` | Narration lines to word-exact cues (extend with voice settings, model, previous_text) |
| Junk-tail trim, approx-cue hard fail | `video.mjs:169-188` | Keep both guards |
| Cover (gpt-image + vision QA + webp thumb) | `generator/cover.mjs:64-130` | Film cover or poster animal |
| library upsert and series handling | `generator/library.mjs:21-41` | Register films on the shelf |
| verify-book headless gate (mounted SVG, console clean, alive, clipped-label warning, previews) | `generator/verify-book.mjs:115-273` | Per-chapter QA plus thumbnails |
| Player: audio clock, seek, CC, chapter nav, deep links, series sidebar, blog | `player/*` | Shelf playback of the film |
| Offline download of book assets | `offline/downloads.ts:62-93` | Works for slices unchanged |
| `export-mp4.mjs` server/ffprobe/concat helpers | `export-mp4.mjs:40-68,216-228` | Scaffolding only; replace the capture method |

### Gaps (must build or change for films)
1. **No deterministic renderer.** The export is realtime `recordVideo` at a fixed
   25 fps with VP8 at about 1 Mbps and drops under filters
   (`export-mp4.mjs:80-167`; measurements in §4). Build a frame-stepping
   renderer with sharding, a render route or page, and a lossless audio mux.
2. **No music or mix stage.** Audio is narration only, one mono MP3 per chapter
   (`video.mjs:158-189`). Needed:
   - score import (Strudel capture);
   - a film timeline that places narration lines with gaps and breaths;
   - ducking/sidechain, loudness normalization (EBU R128) and a master WAV;
   - chapter slicing.
3. **TTS is not tunable.** No `voice_settings`/speed/style, no
   `previous_text`/`next_text` continuity, no per-line synthesis, no output
   format choice, and a hard-coded model and voice (`tts.mjs:101-121`,
   `video.mjs:33`).
4. **The speakability gate blocks history-of-AI names** (`video.mjs:79-93`). It
   needs a pronunciation lexicon (caption text vs spoken text) plus an
   allowlist.
5. **The retime warp is caption-anchored only.** Music cues drift (§2), and the
   pairing is in insertion order vs sorted (`narration-timing.ts:24-41` vs
   `scene-captions.mjs:54-56`). Add `timing:"locked"` and sort.
6. **Chapter-to-chapter playback is not continuous.** There is a 5 s countdown,
   a remount, about 4 Hz end detection and no prefetch
   (`ChapterPlayer.tsx:203-236`, `BookPlayer.tsx:361`).
7. **No film-wide clock, scrubber or SRT/VTT output.**
8. **No v3 per-chapter regen.** `regen-chapter.mjs` is v2 (storyboard.json,
   `:30`). Re-narrating one v3 chapter means rerunning `video.mjs` for the whole
   book (all chapters re-synthesized; pass `--no-cover`). A film needs per-line
   or per-chapter regeneration with a cache keyed by text+voice+settings.
9. **Asset size limits.** A 25 MiB per-file cap on Workers static assets means
   the master MP4 and a single full-film audio file cannot ship in `dist/` (the
   MP4 is hundreds of MB). Host the master elsewhere (R2 or another external
   URL), or ship only slices plus the scene code.
10. **Film metadata not modelled.** There is no `kind`, `runtime`, poster,
    voice/score provenance or loudness in the manifest or `BookMeta`. These are
    additive and safe (§1).
11. **verify-book assumes book semantics.** A caption is required at 50%, the
    port is fixed, and it uses the player's 1600x900 layout, not the film
    raster (`verify-book.mjs:25,121,215`).
12. **Retime cost on long timelines.** One bump and one sort per keyframe
    (`timeline.ts:211-222`; 20k keyframes = 261 ms and 20,400 notifications).
    Batch the updates if a film chapter is very dense.
13. **The stage is fixed at 16:9 and 1280x720 units** (`stage.tsx:3-4`). That is
    fine for 1080p since it is vector, but raster layers (`CanvasLayer`, 2x
    backing) cap at 2560x1440 effective.

### Probe files
- `.orly-work/probes/pipeline-map/record-probe.mjs`: real chapter via
  recordVideo, read-only static server over `orly/dist`, rAF and audio stats,
  ffprobe. Env `W/H/SECS/SLUG/CH/CHROME`.
- `.orly-work/probes/pipeline-map/barcode-probe.mjs`: synthetic page-clock
  barcode, decodes every recorded frame's page time.
- `.orly-work/probes/pipeline-map/heavy-probe.mjs`: the same with heavy SVG
  blur and turbulence filters.
- `.orly-work/probes/pipeline-map/det-probe.mjs`: deterministic
  screenshot-per-frame into an x264 pipe (throughput plus exact-time check).
- `.orly-work/probes/pipeline-map/order-probe.ts` (and the bundled `.mjs`):
  narration warp edge cases (identity, music drift, ordering bug, cost).

Run them with cwd `/Users/blamy/Documents/Codex/orly-2`, for example
`node .orly-work/probes/pipeline-map/barcode-probe.mjs`. For the order probe:
`NODE_PATH=/Users/blamy/Documents/Codex/orly/node_modules node_modules/.bin/esbuild .orly-work/probes/pipeline-map/order-probe.ts --bundle --platform=node --format=esm --outfile=.orly-work/probes/pipeline-map/order-probe.mjs && node .orly-work/probes/pipeline-map/order-probe.mjs`.
