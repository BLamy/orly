# Strudel music backend (verified 2026-10-05)

**Decision:** render every cue with **strudel.cc's own "Export to WAV"** panel, driven by
Playwright. It renders through an `OfflineAudioContext` — faster than real time, sample-exact,
and cycle 0 is sample 0 by construction.

## Verified recipe
1. `chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })`
   (chrome-headless-shell 1243 works; so does system Chrome).
2. `page.goto('https://strudel.cc/')`, wait for `window.strudelMirror.repl`, then `await strudelMirror.prebaked`
   (default sample maps + soundfonts registered; ~5 s).
3. **Send a real user gesture** — `page.mouse.click(400, 400)` + a key press. Strudel defers audio
   init (`initAudioOnFirstClick`); without a gesture `repl.evaluate()` never resolves (this is
   what looked like "page closed" crashes in the first probe — they were watchdog kills).
4. `strudelMirror.setCode(code)` then `await strudelMirror.repl.evaluate(code, false)` (evaluate,
   don't play). Evaluating writes the code into the URL hash (`#<base64>`), i.e. a share link.
5. Clip onsets so the tail is pure decay: `state.pattern = state.pattern.filterWhen(t => t < bodyCycles)`.
6. Open the **export** tab; fill Start cycle `0`, End cycle `ceil((body+tail)·cps)`, Sample rate
   `48000`, Max polyphony `1024`; click **Export to WAV**.
7. An init script tees `OfflineAudioContext.prototype.startRendering` so the driver can pull the
   rendered float buffer in base64 chunks, then writes 24-bit WAV (`generator/film/score.mjs`).

## Measured
- Test cue (strings + piano + cello soundfonts, `setcpm(16)`, 4 cycles + 5 s tail): 20.0 s of
  audio rendered in **4.1 s (5.4× real time)**; 48 kHz stereo s24; peak −8 dBFS; −19.3 LUFS;
  first sound 4 ms after cycle 0; 0 clipped samples; chord changes exactly every 3.75 s.
- Probe code: `.orly-work/probes/strudel/record-strudel.mjs` (modes `export` | `realtime` | `local`).

## Composition notes for composers
- Tempo: `setcpm(bpm/beatsPerCycle)` (e.g. `setcpm(64/4)` = 64 BPM in 4/4 with one bar per cycle).
- Length is exact in cycles: a cue of D seconds at cps c needs `D·c` cycles; compose arrangements
  with `arrange([cycles, pattern], …)` or `<…>` sequences so the music *ends* rather than loops.
- Documentary textures that worked: `gm_string_ensemble_1`, `piano`, `gm_cello` with `.room()`,
  `.lpf()`, slow attacks; `chord("<…>").voicing()` for voice-led harmony; `perlin` for humanized velocity.
- Visual feedback for authoring: `.pianoroll()` / `._punchcard()` in the REPL (use Claude in Chrome
  for live auditioning; keep audible tests short).
