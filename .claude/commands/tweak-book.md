---
description: Edit or fine-tune an existing book on the shelf (one targeted change)
---

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
- **Cover** → `node generator/video.mjs --slug <slug> --title "…" --no-tts`
  after deleting `animal.png`/`animal.webp`, or regenerate with an `--animal`
  hint. The webp thumbnail is what ships.
- **Shelf metadata (title/subtitle/color)** → library.json via video.mjs flags.

### Blog-only live viz sections

When a tweak asks for a written companion post, keep `manifest.json`, chapter
MP3s, and normal chapter playback unchanged. Author a small number of
semantic sections in `public/generated/<slug>/blog.md`, not one viewer per
narration cue. Every section is: a `###` title, a lead paragraph, one live
viewer, and an optional paragraph after it:

```md
### The authority record is the commit point

This paragraph introduces the complete visual section.

{% viz scene="books/<slug>/chapter-1" section="chapter-1-authority" cue="3" from="21.000" to="42.000" title="The authority record is the commit point." %}
{% endviz %}

This optional paragraph gives the takeaway before the next section.
```

`from`/`to` are manifest-clock seconds. They must be adjacent or separated,
never overlapping; `BlogPanel` maps them back to the authored scene clock so
later chapters do not collapse to repeated final frames. Run
`node generator/blog-viz.mjs --slug <slug>` to validate headings, bounds, and
non-overlap. Its legacy migration bundles contiguous cue figures into at most
four sections per chapter, but the generated fallback prose must be replaced
with source-grounded section writing before publish. `BlogPanel` mounts each
block with the latest Docstream `VizEmbed` component and the real viz-engine
scene, with autoplay/loop on and no audio or captions. Never generate or commit
cue PNGs, GIFs, MP4s, or WebM files, and do not use Docstream's direct-video
embed syntax for a live scene.

Use `?blog=<slug>` for a blog-only page. It renders no chapter video or sidebar
and ends with a link back to `?bundle=<slug>`.

After ANY change: `npx tsc --noEmit && npm run build &&
node generator/verify-book.mjs --slug <slug>` must pass; commit
`public/generated/<slug>` + `apps/bookshelf/src/viz/books/<slug>` together.
