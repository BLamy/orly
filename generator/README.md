# repo → narrated D3 explainer

Point this at any GitHub repo (or local path) and a subsystem prompt; it generates
a multi‑chapter, **audio‑narrated, animated** data‑flow explainer that plays in the
existing D3 player (chapters on the left, the "video" on the right, mobile‑friendly).

```bash
ANTHROPIC_API_KEY=…  ELEVENLABS_API_KEY=…  \
  npm run explain -- --repo https://github.com/koajs/koa \
                     --prompt "how a request flows through the middleware onion" \
                     --open
```

Open the printed URL (`http://localhost:5173/?bundle=<slug>`), or pass `--open` to
launch Chrome (it starts the dev server if needed).

## How it works (start to finish)

```
--repo + --prompt
  │
  ├─ repo.mjs        clone (shallow, sanitized) or local path → rank files with
  │                  ripgrep against the prompt → bounded source "digest"
  ├─ storyboard.mjs  Anthropic API + a vetted system prompt + JSON schema →
  │                  3–6 chapters { nodes, edges, steps{ spoken, displayNarration } },
  │                  grounded in real code, with a validate→repair loop (validate.mjs)
  ├─ tts.mjs         per chapter: concat each step's `spoken` → ElevenLabs
  │                  convertWithTimestamps → one MP3 + character timings
  ├─ (cues)          each step's cue = the audio time of its `spoken` segment's first
  │                  character — exact, derived from the timestamps (no STT)
  ├─ transform.mjs   storyboard + cues → the engine's Chapter[] manifest
  └─ emit            public/generated/<slug>/{manifest.json, audio/chapter-N.mp3}

player:  App.tsx reads ?bundle=<slug> → fetches the manifest → LearnPage renders it.
         The static "almostnode" chapters remain the default (no ?bundle).
```

## Flags

| flag | meaning |
|------|---------|
| `--repo <url\|path>` | github.com URL or a local repo path |
| `--prompt "<text>"` | which subsystem to explain |
| `--slug <name>` | output slug (default: derived from the prompt) |
| `--voice <id>` | ElevenLabs voice id (default `Fahco4VZzobUeiPqni1S`) |
| `--model <id>` | Anthropic model (default `claude-opus-4-8`) |
| `--storyboard <path>` | use a pre‑made storyboard JSON, skip the LLM step |
| `--no-tts` | diagram‑only preview (no narration) |
| `--open` | open the result in Chrome |

## Keys

- `ANTHROPIC_API_KEY` — storyboard generation (skip with `--storyboard`).
- `ELEVENLABS_API_KEY` — narration (skip with `--no-tts`).

## Notes

- The storyboard system prompt (`prompts/storyboard.txt`) forbids invented
  components: every node/edge/identifier must come from the digest, and every step
  cites the file(s) it's grounded in. `validate.mjs` enforces the structural
  invariants (cover‑first, reveal‑union == node set, non‑overlapping layout, clean
  spoken text) and auto‑repairs layout.
- Cues are exact because we TTS the concatenated `spoken` script once and map each
  segment's character offset to its start time via ElevenLabs' character alignment.
