---
name: "source-command-tweak-book"
description: "Edit or fine-tune an existing book on the shelf (one targeted change)"
---

# source-command-tweak-book

Use this skill when the user asks to run the migrated source command `tweak-book`.

## Command Template

# /tweak-book — fine-tune an existing book

Make the change a follow-up issue asks for to a book that's already published,
touching as little as possible. Use this when you don't like something and want
it adjusted — not to add a whole new book.

**Arguments / issue:** the "✏️ Tweak a book" form gives you a **book** (its label
ends with ` — <slug>`), an optional **chapter** number, and a **What should change?**
description. Parse the `<slug>` from the dropdown selection.

Keys come from `.env` locally or CI env (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`,
`NOUN_PROJECT_KEY/SECRET`).

## The book's files (v3 — scene-native)
`apps/bookshelf/src/viz/books/<slug>/chapter-<n>.tsx` are the editable sources — each chapter
IS one authored 3b1bd3 scene whose captions are the narration script.
`public/generated/<slug>/` holds the built artifacts: `manifest.json`
(format 3: per-chapter scene id, audio path, cues, duration),
`audio/chapter-N.mp3`, `animal.webp` (the committed cover thumbnail; the
full-size `animal.png` is a gitignored local artifact), and `previews/`.
`public/generated/library.json` has the shelf entry.

## Pick the smallest change that does the job

- **Reword narration / change what a beat shows** → edit the chapter scene
  (`apps/bookshelf/src/viz/books/<slug>/chapter-<n>.tsx`: captions for the voice, channels/
  render for the visuals), then rebuild the book's audio + manifest:
  ```bash
  node generator/video.mjs --slug <slug> --title "<existing title>"     --chapter-titles "…" --blurbs "…"          # re-narrates every chapter
  ```
  (Narration is per-chapter MP3s; there is no per-chapter regen yet — keep the
  edit small and re-run the build.)
- **Visual-only change (no caption text touched)** → edit the scene and re-run
  with `--no-tts` — existing MP3s and cues stay; only the manifest rewrites.
- **Cover** → when Codex built-in ImageGen is available, always use it instead
  of the API generator. Preserve the requested animal concept, use a uniform
  pure-white (`#FFFFFF`) field with no tan/cream/ivory cast, texture, vignette,
  scene, or lettering, visually inspect it, then replace `animal.png` and the
  committed 512px-wide `animal.webp`. Run
  `node generator/video.mjs --slug <slug> --title "…" --no-tts --no-cover`
  only if the manifest/library also needs rebuilding. Use the API cover path
  only when built-in ImageGen is unavailable.
- **Shelf metadata (title/subtitle/color)** → library.json via video.mjs flags.

## Blog-only live viz sections

Blog cues are separate from normal chapter playback. Keep the chapter MP3,
manifest, and narrated player unchanged; consume `manifest.chapters[].cues`
only to delimit a small number of semantic sections in
`public/generated/<slug>/blog.md`, not one viewer per narration cue:

```md
### The authority record is the commit point

This paragraph introduces the complete visual section.

{% viz scene="books/<slug>/chapter-1" section="chapter-1-authority" cue="3" from="21.000" to="42.000" title="The authority record is the commit point." %}
{% endviz %}

This optional paragraph gives the takeaway before the next section.
```

`from`/`to` are manifest-clock seconds and adjacent sections must not overlap.
`BlogPanel` maps those windows back to the authored scene clock so inactive
chapters cannot clamp every viewer to the same final frame. Run
`node generator/blog-viz.mjs --slug <slug>` after authoring; it validates the
section headings, manifest bounds, and non-overlap. Its compatibility path
bundles legacy cue figures into at most four sections per chapter, after which
the fallback prose must be replaced with source-grounded writing. `BlogPanel`
bridges these repo-local blocks to the latest `@brett_lamy/docstream`
`VizEmbed` component and the real viz-engine scene; sections autoplay and loop
silently with captions hidden. Do not make cue stills or exported
PNG/GIF/MP4/WebM assets, and do not use Docstream's direct-video embed syntax
for a live scene.

Use `?blog=<slug>` for the standalone post; it omits the chapter player and
sidebar and links back to `?bundle=<slug>` at the bottom.

After ANY change: `npx tsc --noEmit && npm run build &&
node generator/verify-book.mjs --slug <slug>` must pass; commit
`public/generated/<slug>` + `apps/bookshelf/src/viz/books/<slug>` together.
